import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { Auction } from '../entities/auction.entity';
import { Bid } from '../entities/bid.entity';
import { User } from '../entities/user.entity';
import { AuctionsService } from './auctions.service';
import { AuctionsController } from './auctions.controller';
import { AuctionsGateway } from './auctions.gateway';
import { AuctionEventsService } from './auction-events.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Auction, Bid, User]),
    EventEmitterModule.forRoot(),
    UsersModule,
  ],
  providers: [AuctionsService, AuctionsGateway, AuctionEventsService],
  controllers: [AuctionsController],
  exports: [AuctionsService],
})
export class AuctionsModule {}
