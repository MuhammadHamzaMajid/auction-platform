import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';
import { Auction } from './auction.entity';

@Entity()
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @ManyToOne(() => User, { eager: true })
  bidder: User;

  @ManyToOne(() => Auction, auction => auction.bids)
  auction: Auction;

  @CreateDateColumn()
  createdAt: Date;
}
