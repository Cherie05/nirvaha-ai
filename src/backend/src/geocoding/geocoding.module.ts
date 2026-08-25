import { Module } from '@nestjs/common';
import { GeocodingService } from './geocoding.service';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [CacheModule],
  providers: [GeocodingService],
  exports: [GeocodingService],
})
export class GeocodingModule {}
