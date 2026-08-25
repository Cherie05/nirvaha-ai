import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../cache/redis.service';
import { UsersService } from '../users/users.service';
import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private readonly redisService: RedisService,
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    // If a valid Bearer token is present, always try to authenticate with it
    if (token) {
      // Check denylist before letting passport verify
      try {
        const base64Payload = token.split('.')[1];
        if (base64Payload) {
          const payloadBuffer = Buffer.from(base64Payload, 'base64');
          const payload = JSON.parse(payloadBuffer.toString());
          const jti = payload.jti;
          if (jti) {
            const isBlacklisted = await this.redisService.get(
              `denylist:${jti}`,
            );
            if (isBlacklisted) {
              throw new UnauthorizedException('Token has been revoked');
            }
          }
        }
      } catch (err) {
        if (err instanceof UnauthorizedException) throw err;
        // Malformed token — let passport handle it rather than silently skipping
        this.logger.debug(
          'Could not decode token for denylist check, deferring to passport',
          err,
        );
      }

      const result = (await super.canActivate(context)) as boolean;
      return result;
    }

    // No token present — check if @Public() allows anonymous access
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      const allowAnonymous =
        this.configService.get<boolean>('allowAnonymousScan');
      if (allowAnonymous) {
        // Attach the stable demo account for anonymous requests, so an
        // anonymous scan and a logged-in scan land in the same history.
        const demoUser = await this.usersService.findByEmail(
          this.configService.get<string>('demoAccount.email'),
        );
        if (demoUser) {
          request.user = {
            id: demoUser.id,
            email: demoUser.email,
            displayName: demoUser.displayName,
          };
          return true;
        }
      }
    }

    // No token AND not public/anonymous — reject
    throw new UnauthorizedException('Authorization token required');
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
