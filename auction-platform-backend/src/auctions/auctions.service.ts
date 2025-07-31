import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Auction, AuctionStatus } from '../entities/auction.entity';
import { User } from '../entities/user.entity';
import { Bid } from '../entities/bid.entity';
import { CreateAuctionDto, UpdateAuctionDto, PlaceBidDto } from './dto/auction.dto';
import { AuctionEventsService } from './auction-events.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuctionsService {
  constructor(
    @InjectRepository(Auction)
    private auctionsRepository: Repository<Auction>,
    @InjectRepository(Bid)
    private bidsRepository: Repository<Bid>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private readonly auctionEvents: AuctionEventsService,
    private readonly usersService: UsersService, // Inject UsersService
  ) {}

  async create(createAuctionDto: CreateAuctionDto, seller: User): Promise<Auction> {
    const auction = this.auctionsRepository.create({
      ...createAuctionDto,
      seller,
      currentPrice: createAuctionDto.startingPrice,
      status: AuctionStatus.DRAFT,
    });

    const savedAuction = await this.auctionsRepository.save(auction);
    this.auctionEvents.emitAuctionStatusChange(savedAuction.id, savedAuction.status);
    return savedAuction;
  }

  async findAll(): Promise<Auction[]> {
    return this.auctionsRepository.find({
      where: { status: AuctionStatus.ACTIVE },
      relations: ['seller', 'bids'],
    });
  }

  async findOne(id: string): Promise<Auction> {
    const auction = await this.auctionsRepository.findOne({
      where: { id },
      relations: ['seller', 'bids', 'bids.bidder'],
    });

    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    return auction;
  }

  async update(id: string, updateAuctionDto: UpdateAuctionDto): Promise<Auction> {
    const auction = await this.findOne(id);
    
    if (auction.status !== AuctionStatus.DRAFT) {
      throw new BadRequestException('Can only update draft auctions');
    }

    Object.assign(auction, updateAuctionDto);
    const updatedAuction = await this.auctionsRepository.save(auction);
    this.auctionEvents.emitAuctionUpdate(updatedAuction.id);
    return updatedAuction;
  }

  async placeBid(auctionId: string, bidDto: PlaceBidDto, bidder: User): Promise<Bid> {
    const auction = await this.findOne(auctionId);

    if (auction.status !== AuctionStatus.ACTIVE) {
      throw new BadRequestException('Auction is not active');
    }

    if (auction.endTime < new Date()) {
      auction.status = AuctionStatus.ENDED;
      await this.auctionsRepository.save(auction);
      this.auctionEvents.emitAuctionStatusChange(auction.id, auction.status);
      throw new BadRequestException('Auction has ended');
    }

    if (bidDto.amount <= auction.currentPrice) {
      throw new BadRequestException('Bid amount must be higher than current price');
    }

    if (auction.seller.id === bidder.id) {
      throw new BadRequestException('Seller cannot bid on their own auction');
    }

    const bid = this.bidsRepository.create({
      amount: bidDto.amount,
      bidder,
      auction,
    });

    const savedBid = await this.bidsRepository.save(bid);
    auction.currentPrice = bidDto.amount;
    await this.auctionsRepository.save(auction);

    this.auctionEvents.emitBidPlaced(auction.id, savedBid);
    this.auctionEvents.emitAuctionUpdate(auction.id);

    return savedBid;
  }

  async checkEndedAuctions(): Promise<void> {
    const endedAuctions = await this.auctionsRepository.find({
      where: {
        status: AuctionStatus.ACTIVE,
        endTime: LessThan(new Date()),
      },
      relations: ['bids', 'bids.bidder'],
    });

    for (const auction of endedAuctions) {
      auction.status = AuctionStatus.ENDED;

      if (auction.bids.length > 0) {
        const winningBid = auction.bids.reduce((prev, current) =>
          prev.amount > current.amount ? prev : current
        );

        auction.winningBidId = winningBid.id;
        const winner = winningBid.bidder;
        winner.balance -= winningBid.amount;
        await this.usersRepository.save(winner);

        const seller = auction.seller;
        const commission = winningBid.amount * 0.1; // 10% commission
        seller.balance += winningBid.amount - commission;
        await this.usersRepository.save(seller);
      }

      await this.auctionsRepository.save(auction);
      this.auctionEvents.emitAuctionStatusChange(auction.id, auction.status);
    }
  }

  async completePaymentAndCommission(auctionId: string): Promise<void> {
    const auction = await this.findOne(auctionId);
    if (!auction || auction.status !== AuctionStatus.ENDED || auction.paymentCompleted) return;
    if (!auction.winningBidId) return;
    const winningBid = await this.bidsRepository.findOne({ where: { id: auction.winningBidId }, relations: ['bidder'] });
    if (!winningBid) return;
    const winner = winningBid.bidder;
    const seller = auction.seller;
    const commission = Number(winningBid.amount) * 0.1;
    auction.commissionFee = commission;
    auction.paymentCompleted = true;
    seller.balance += Number(winningBid.amount) - commission;
    await this.usersRepository.save(seller);
    await this.usersRepository.update(winner.id, { balance: Number(winner.balance) - Number(winningBid.amount) });
    await this.usersService.updatePurchaseHistory(winner.id, auction.id, Number(winningBid.amount));
    await this.auctionsRepository.save(auction);
  }

  async issueRefund(auctionId: string): Promise<void> {
    const auction = await this.findOne(auctionId);
    if (!auction || !auction.winningBidId) return;
    const winningBid = await this.bidsRepository.findOne({ where: { id: auction.winningBidId }, relations: ['bidder'] });
    if (!winningBid) return;
    const winner = winningBid.bidder;
    winner.balance += Number(winningBid.amount);
    auction.refundIssued = true;
    await this.usersRepository.save(winner);
    await this.auctionsRepository.save(auction);
  }

  async markSuspicious(auctionId: string): Promise<void> {
    const auction = await this.findOne(auctionId);
    if (!auction) return;
    auction.suspicious = true;
    await this.auctionsRepository.save(auction);
    await this.usersService.freezeAccount(auction.seller.id);
  }

  async adminRefundBid(auctionId: string): Promise<void> {
    // Admin can trigger a refund for a suspicious auction
    await this.issueRefund(auctionId);
  }

  async adminFreezeAccount(userId: string): Promise<void> {
    // Admin can freeze a user account
    await this.usersService.freezeAccount(userId);
  }
}
