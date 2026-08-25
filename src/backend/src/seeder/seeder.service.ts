import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Scan, ConfidenceLevel } from '../scan/scan.entity';
import {
  DigitalBinItem,
  BinStatus,
} from '../aggregation/digital-bin-item.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/user.entity';
import { ZONE_CENTROIDS } from '../geocoding/geocoding.service';

@Injectable()
export class SeederService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeederService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    @InjectRepository(Scan)
    private scanRepository: Repository<Scan>,
    @InjectRepository(DigitalBinItem)
    private binRepo: Repository<DigitalBinItem>,
  ) {}

  async onApplicationBootstrap() {
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev) return;

    try {
      const demoEmail = this.configService.get<string>('demoAccount.email');
      const demoPassword = this.configService.get<string>(
        'demoAccount.password',
      );
      const demoName = this.configService.get<string>(
        'demoAccount.displayName',
      );

      let demoUser = await this.usersService.findByEmail(demoEmail);

      if (!demoUser) {
        this.logger.log(`Seeding demo account: ${demoEmail}`);
        const passwordHash = await bcrypt.hash(demoPassword, 10);
        demoUser = await this.usersService.create({
          email: demoEmail,
          passwordHash,
          displayName: demoName,
        });
      } else {
        // Keep the password in step with .env even if the row already exists,
        // so changing DEMO_PASSWORD never leaves a stale hash behind.
        const stillValid = await bcrypt.compare(
          demoPassword,
          demoUser.passwordHash,
        );
        if (!stillValid) {
          demoUser.passwordHash = await bcrypt.hash(demoPassword, 10);
          await this.usersService.save(demoUser);
          this.logger.log(`Demo account password re-synced from .env`);
        }
      }
      // Give the household a real Coimbatore address so it lands on the map.
      if (demoUser.latitude == null) {
        const home = ZONE_CENTROIDS['RS Puram'];
        demoUser.role = UserRole.USER;
        demoUser.address = '12 Thadagam Road, RS Puram';
        demoUser.zone = 'RS Puram';
        demoUser.latitude = home.latitude;
        demoUser.longitude = home.longitude;
        await this.usersService.save(demoUser);
        this.logger.log('Demo household located in RS Puram');
      }

      // Vendor test account — warehouse pin on the map.
      const vendorEmail = 'vendor@gmail.com';
      let vendor = await this.usersService.findByEmail(vendorEmail);
      if (!vendor) {
        const wh = ZONE_CENTROIDS['Singanallur'];
        vendor = await this.usersService.create({
          email: vendorEmail,
          passwordHash: await bcrypt.hash('vendor@1234', 10),
          displayName: 'Coimbatore Scrap Traders',
          role: UserRole.VENDOR,
          address: 'Singanallur, Coimbatore',
          zone: 'Singanallur',
          warehouseAddress: 'Plot 8, Singanallur Industrial Estate, Coimbatore',
          warehouseLat: wh.latitude,
          warehouseLng: wh.longitude,
        });
        this.logger.log(`Vendor login ready: ${vendorEmail} / vendor@1234`);
      }

      // Households are deliberately UNEVEN: a dense western cluster that is
      // clearly worth one trip, and two far outliers that are not. A vendor
      // looking at the map should be able to see the right choice without
      // being told what it is.
      const DENSE: [string, number, number][] = [
        // [zone, households, avg kg each]
        ['RS Puram', 6, 2.3],
        ['Saibaba Colony', 4, 2.2],
        ['Gandhipuram', 3, 2.3],
      ];
      const OUTLIERS: [string, number, number][] = [
        ['Saravanampatti', 1, 2.2],
        ['Kuniamuthur', 1, 1.8],
      ];

      const binCount = await this.binRepo.count();
      if (binCount === 0) {
        this.logger.log('Seeding neighbourhood pickup density...');
        let n = 0;

        for (const [zone, households, avgKg] of [...DENSE, ...OUTLIERS]) {
          const centre = ZONE_CENTROIDS[zone];
          if (!centre) continue;

          for (let i = 0; i < households; i++) {
            n++;
            // ~+/-400m of jitter so pins spread out instead of stacking.
            const lat = centre.latitude + (Math.random() - 0.5) * 0.008;
            const lng = centre.longitude + (Math.random() - 0.5) * 0.008;
            const email = `resident${n}@nirvaha.local`;

            let u = await this.usersService.findByEmail(email);
            if (!u) {
              u = await this.usersService.create({
                email,
                passwordHash: await bcrypt.hash('test@1234', 10),
                displayName: `Household ${n}`,
                role: UserRole.USER,
                address: `${zone}, Coimbatore`,
                zone,
                latitude: lat,
                longitude: lng,
              });
            }

            // One or two items each, weights varied around the zone average.
            const items = 1 + (i % 2);
            for (let k = 0; k < items; k++) {
              const grams = Math.round(
                ((avgKg * 1000) / items) * (0.75 + Math.random() * 0.5),
              );
              const materials = [
                'PET 1',
                'HDPE 2',
                'LDPE 4',
                'PP 5',
                'OTHER 7',
              ];
              await this.binRepo.save(
                this.binRepo.create({
                  userId: u.id,
                  zone,
                  materialType: materials[(n + k) % materials.length],
                  weightGrams: grams,
                  status: BinStatus.PENDING,
                  latitude: lat,
                  longitude: lng,
                  address: `${zone}, Coimbatore`,
                }),
              );
            }
          }
        }
        this.logger.log(
          `Seeded ${n} households across ${DENSE.length} dense zones and ${OUTLIERS.length} outliers`,
        );
      }

      this.logger.log(`Demo login ready: ${demoEmail} / ${demoPassword}`);

      const scanCount = await this.scanRepository.count({
        where: { userId: demoUser.id },
      });
      if (scanCount === 0) {
        this.logger.log('Seeding sample scans...');

        await this.scanRepository.save([
          {
            userId: demoUser.id,
            imageUrl: null, // Placeholder
            imageHash: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
            isRecyclable: true,
            itemName: 'PET Water Bottle',
            materialType: 'PET 1',
            quantity: 2,
            estimatedWeightGrams: 50,
            recyclingInstructions: 'Rinse and crush to save space.',
            confidence: ConfidenceLevel.HIGH,
            confidenceScore: 0.95,
          },
          {
            userId: demoUser.id,
            imageUrl: null,
            imageHash: 'b1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
            isRecyclable: false,
            itemName: 'Unknown Packaging',
            materialType: 'Mixed',
            quantity: 1,
            estimatedWeightGrams: 10,
            recyclingInstructions: 'Manual sorting required.',
            confidence: ConfidenceLevel.LOW,
            confidenceScore: 0.4,
          },
          {
            userId: demoUser.id,
            imageUrl: null,
            imageHash: 'c1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
            isRecyclable: false,
            itemName: 'Dirty Plastic Wrap',
            materialType: 'LDPE 4',
            quantity: 1,
            estimatedWeightGrams: 5,
            recyclingInstructions:
              'Too contaminated to recycle. Discard in general waste.',
            confidence: ConfidenceLevel.HIGH,
            confidenceScore: 0.88,
          },
        ]);
        this.logger.log('Seed complete.');
      }
    } catch (e) {
      this.logger.error('Failed to seed database', e);
    }
  }
}
