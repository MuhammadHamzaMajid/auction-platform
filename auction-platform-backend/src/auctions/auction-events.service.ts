import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Bid } from '../entities/bid.entity';
import { AuctionStatus } from '../entities/auction.entity';

@Injectable()
export class AuctionEventsService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  emitAuctionUpdate(auctionId: string): void {
    this.eventEmitter.emit('auction.update', { auctionId });
  }

  emitAuctionStatusChange(auctionId: string, status: AuctionStatus): void {
    this.eventEmitter.emit('auction.status', { auctionId, status });
  }

  emitBidPlaced(auctionId: string, bid: Bid): void {
    this.eventEmitter.emit('auction.bid', { auctionId, bid });
  }
}
