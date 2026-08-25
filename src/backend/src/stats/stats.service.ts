import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Scan, ConfidenceLevel } from '../scan/scan.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
  ) {}

  async getUserStats(userId: string) {
    const { total_scans, total_weight_grams } = await this.scanRepository
      .createQueryBuilder('scan')
      .select('COUNT(scan.id)', 'total_scans')
      .addSelect('SUM(scan.estimatedWeightGrams)', 'total_weight_grams')
      .where('scan.userId = :userId', { userId })
      .getRawOne();

    const recyclable_count = await this.scanRepository.count({
      where: { userId, isRecyclable: true },
    });

    const uncertain_count = await this.scanRepository.count({
      where: { userId, confidence: ConfidenceLevel.LOW },
    });

    return {
      total_scans: parseInt(total_scans || '0', 10),
      total_weight_grams: parseInt(total_weight_grams || '0', 10),
      recyclable_count,
      uncertain_count,
    };
  }
}
