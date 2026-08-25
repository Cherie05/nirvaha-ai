import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AggregationController } from './aggregation.controller';
import { AggregationService } from './aggregation.service';
import { DigitalBinItem } from './digital-bin-item.entity';
import { AggregationGateway } from './aggregation.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DigitalBinItem]),
    AuthModule,
    UsersModule,
    GeocodingModule,
    CacheModule,
  ],
  controllers: [AggregationController],
  providers: [AggregationService, AggregationGateway],
  exports: [AggregationService],
})
export class AggregationModule {}
