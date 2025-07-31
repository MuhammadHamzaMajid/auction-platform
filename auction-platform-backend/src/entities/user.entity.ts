import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Auction } from './auction.entity';
import { Bid } from './bid.entity';

export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin'
}

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  @MinLength(3)
  username: string;

  @Column()
  @Exclude()
  @MinLength(8)
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER
  })
  role: UserRole;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ default: false })
  isVerified: boolean;

  @Column({ default: false })
  isFrozen: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Auction, auction => auction.seller)
  auctions: Auction[];

  @OneToMany(() => Bid, bid => bid.bidder)
  bids: Bid[];

  @Column({ type: 'jsonb', nullable: true, default: () => "'[]'" })
  purchaseHistory: Array<{ auctionId: string; amount: number; date: Date }>;

}
