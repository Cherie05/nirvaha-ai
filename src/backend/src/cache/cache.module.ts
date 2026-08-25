import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new Redis({
          host: configService.get<string>('redis.host'),
          port: configService.get<number>('redis.port'),
          // Managed Redis (Railway, Upstash, Redis Cloud) requires AUTH; the
          // local Docker one has no password. Undefined when unset, which is
          // exactly the previous behaviour, so nothing changes locally.
          password: configService.get<string>('redis.password') || undefined,
          // Without a cap ioredis retries a bad host forever and the process
          // sits there looking healthy while every cache call hangs.
          maxRetriesPerRequest: 3,
        });
      },
      inject: [ConfigService],
    },
    RedisService,
  ],
  exports: ['REDIS_CLIENT', RedisService],
})
export class CacheModule {}
