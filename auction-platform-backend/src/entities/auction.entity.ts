import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Bid } from './bid.entity';

export enum AuctionStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

@Entity()
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  startingPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  currentPrice: number;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AuctionStatus,
    default: AuctionStatus.DRAFT
  })
  status: AuctionStatus;

  @ManyToOne(() => User, { eager: true })
  seller: User;

  @OneToMany(() => Bid, bid => bid.auction)
  bids: Bid[];

  @Column({ nullable: true })
  winningBidId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  commissionFee: number;

  @Column({ type: 'boolean', default: false })
  paymentCompleted: boolean;

  @Column({ type: 'boolean', default: false })
  refundIssued: boolean;

  @Column({ type: 'boolean', default: false })
  suspicious: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
