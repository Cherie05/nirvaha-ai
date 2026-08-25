import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { RedisService } from '../cache/redis.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private redisService: RedisService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    if (!this.configService.get<boolean>('allowRegistration')) {
      throw new ForbiddenException(
        'Signup is disabled for this demo. Use the provided test account.',
      );
    }

    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      email: registerDto.email,
      passwordHash: hashedPassword,
      displayName: registerDto.displayName,
    });

    return this.loginUser(user);
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.loginUser(user);
  }

  private async loginUser(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      jti: uuidv4(),
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
    };
  }

  async logout(token: string) {
    try {
      const decoded = this.jwtService.decode(token) as any;
      if (decoded && decoded.jti && decoded.exp) {
        const currentTime = Math.floor(Date.now() / 1000);
        const ttl = decoded.exp - currentTime;

        if (ttl > 0) {
          await this.redisService.setWithTtl(
            `denylist:${decoded.jti}`,
            'true',
            ttl,
          );
        }
      }
    } catch {
      // Token unparseable
    }
  }

  /**
   * Demo OTP check. There is no SMS provider in this build — the OTP is a
   * fixed value from .env so the login screen can be exercised end to end.
   */
  async verifyOtp(email: string, otp: string) {
    const expected = this.configService.get<string>('demoAccount.otp');
    if (!expected || otp !== expected) {
      throw new UnauthorizedException('Invalid OTP');
    }
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Invalid OTP');
    }
    return this.loginUser(user);
  }
}
