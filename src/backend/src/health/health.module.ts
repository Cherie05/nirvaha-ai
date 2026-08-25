import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { HealthController } from './health.controller';
import { ScanModule } from '../scan/scan.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), ScanModule],
  controllers: [HealthController],
})
export class HealthModule {}
