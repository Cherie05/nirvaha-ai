import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Scan } from '../scan/scan.entity';
import { DigitalBinItem } from '../aggregation/digital-bin-item.entity';
import { UsersModule } from '../users/users.module';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { SeederService } from './seeder.service';

@Module({
  imports: [
    GeocodingModule,
    UsersModule,
    TypeOrmModule.forFeature([Scan, DigitalBinItem]),
  ],
  providers: [SeederService],
})
export class SeederModule {}
