import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

@Entity('scans')
export class Scan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  imageUrl: string;

  @Column({ type: 'varchar', length: 32 })
  imageHash: string;

  /** Per-item breakdown. One row per distinct object found in the photo. */
  @Column({ type: 'jsonb', nullable: true })
  items: any;

  @Column({ type: 'boolean', default: false })
  requiresManualSorting: boolean;

  @Column()
  isRecyclable: boolean;

  @Column()
  itemName: string;

  @Column()
  materialType: string;

  @Column('int')
  quantity: number;

  @Column('int')
  estimatedWeightGrams: number;

  @Column('text')
  recyclingInstructions: string;

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    default: ConfidenceLevel.LOW,
  })
  confidence: ConfidenceLevel;

  @Column('float')
  confidenceScore: number;

  @Column({ nullable: true })
  aiProvider: string;

  @Column({ nullable: true })
  aiModel: string;

  @CreateDateColumn()
  createdAt: Date;
}
