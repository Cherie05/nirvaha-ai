import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'USER',
  VENDOR = 'VENDOR',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  displayName: string;

  /** Households scan and fill bins; vendors claim routes. */
  @Column({ type: 'varchar', length: 12, default: UserRole.USER })
  role: string;

  // ── Location ────────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  /** Neighbourhood used to cluster pickups, e.g. "RS Puram". */
  @Column({ type: 'varchar', nullable: true })
  zone: string | null;

  @Column({ type: 'float', nullable: true })
  latitude: number | null;

  @Column({ type: 'float', nullable: true })
  longitude: number | null;

  // ── Vendors only ────────────────────────────────────────────
  @Column({ type: 'varchar', nullable: true })
  warehouseAddress: string | null;

  @Column({ type: 'float', nullable: true })
  warehouseLat: number | null;

  @Column({ type: 'float', nullable: true })
  warehouseLng: number | null;

  @CreateDateColumn()
  createdAt: Date;
}
