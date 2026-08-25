import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum BinStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COLLECTED = 'COLLECTED',
}

/**
 * One classified item a user has dropped into their Digital Bin.
 *
 * Aggregating these by zone is what turns individually-unprofitable household
 * pickups into a route a scrap dealer can afford to drive.
 */
@Entity('digital_bin_items')
export class DigitalBinItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  /** Neighbourhood, e.g. "RS Puram", "Peelamedu". */
  @Index()
  @Column()
  zone: string;

  /**
   * The scan this item came from.
   *
   * Without it the same photo could be added to the bin repeatedly — open a
   * scan from History, tap "Add to bin", and the weight counted again. The
   * classifier saw one bottle; the bin must hold one bottle.
   */
  @Index()
  @Column({ type: 'varchar', nullable: true })
  scanId: string | null;

  /** Resin code from the classifier, e.g. "PET 1". */
  @Column()
  materialType: string;

  @Column({ type: 'float', default: 0 })
  weightGrams: number;

  /**
   * Where this pickup physically is. Snapshotted from the user at add-time,
   * not joined at read-time: if a household moves, past collections must stay
   * on the map where they were actually collected.
   */
  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Index()
  @Column({ type: 'varchar', length: 16, default: BinStatus.PENDING })
  status: string;

  /** Set when a vendor claims the zone. */
  @Column({ type: 'varchar', nullable: true })
  claimedByVendorId: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  scheduledAt: Date | null;

  /**
   * When the household asked for this to be collected.
   *
   * Distinct from [scheduledAt], which is the vendor's answer. Without this the
   * user's "Schedule pickup" button had nothing to write and so did nothing at
   * all — the bin only ever moved when a vendor happened to claim the zone.
   */
  @Column({ type: 'timestamptz', nullable: true })
  requestedAt: Date | null;

  /**
   * When it was actually collected. History used to be dated by [scheduledAt],
   * which is when the trip was *planned* — off by a day, and null entirely for
   * a single-household pickup that was never part of a claimed route.
   */
  @Column({ type: 'timestamptz', nullable: true })
  collectedAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;
}
