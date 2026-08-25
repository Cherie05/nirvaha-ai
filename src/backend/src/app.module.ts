import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';
import { StorageModule } from './storage/storage.module';
import { ScanModule } from './scan/scan.module';
import { StatsModule } from './stats/stats.module';
import { HealthModule } from './health/health.module';
import { SeederModule } from './seeder/seeder.module';
import { AggregationModule } from './aggregation/aggregation.module';

@Module({
  imports: [
    AggregationModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.user'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.name'),
        autoLoadEntities: true,
        synchronize: true, // For hackathon ONLY
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    CacheModule,
    AuthModule,
    StorageModule,
    ScanModule,
    StatsModule,
    HealthModule,
    SeederModule,
  ],
})
export class AppModule {}
