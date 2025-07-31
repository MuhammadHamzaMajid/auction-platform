import { Controller, Get, Post, Body, Param, Put, UseGuards, Request, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuctionsService } from './auctions.service';
import { CreateAuctionDto, UpdateAuctionDto, PlaceBidDto } from './dto/auction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { User, UserRole } from '../entities/user.entity';
import { Auction } from '../entities/auction.entity';
import { Bid } from '../entities/bid.entity';

interface RequestWithUser extends Request {
  user: User;
}

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all auctions' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all auctions', 
    type: [Auction]
  })
  async findAll(): Promise<Auction[]> {
    return this.auctionsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get auction by id' })
  @ApiResponse({ 
    status: 200, 
    description: 'The auction', 
    type: Auction 
  })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async findOne(@Param('id') id: string): Promise<Auction> {
    return this.auctionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new auction' })
  @ApiResponse({
    status: 201,
    description: 'The auction has been successfully created',
    type: Auction
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a seller' })
  async create(
    @Body() createAuctionDto: CreateAuctionDto,
    @Request() req: RequestWithUser
  ): Promise<Auction> {
    return this.auctionsService.create(createAuctionDto, req.user);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an auction' })
  @ApiResponse({
    status: 200,
    description: 'The auction has been successfully updated',
    type: Auction
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not the owner or admin'
  })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async update(
    @Param('id') id: string,
    @Body() updateAuctionDto: UpdateAuctionDto,
    @Request() req: RequestWithUser
  ): Promise<Auction> {
    const auction = await this.auctionsService.findOne(id);
    if (auction.seller.id !== req.user.id && req.user.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('You can only update your own auctions unless you are an admin');
    }
    return this.auctionsService.update(id, updateAuctionDto);
  }

  @Post(':id/bid')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.BUYER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Place a bid on an auction' })
  @ApiResponse({
    status: 201,
    description: 'Bid successfully placed',
    type: Bid
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid bid amount or auction not active'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - User is not a buyer' })
  @ApiResponse({ status: 404, description: 'Auction not found' })
  async placeBid(
    @Param('id') id: string,
    @Body() bidDto: PlaceBidDto,
    @Request() req: RequestWithUser
  ): Promise<Bid> {
    return this.auctionsService.placeBid(id, bidDto, req.user);
  }

  @Post(':id/admin-refund')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Refund winning bid for an auction' })
  @ApiResponse({ status: 200, description: 'Refund issued' })
  async adminRefund(@Param('id') id: string): Promise<{ message: string }> {
    await this.auctionsService.adminRefundBid(id);
    return { message: 'Refund issued' };
  }

  @Post(':userId/admin-freeze')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin: Freeze a user account' })
  @ApiResponse({ status: 200, description: 'Account frozen' })
  async adminFreeze(@Param('userId') userId: string): Promise<{ message: string }> {
    await this.auctionsService.adminFreezeAccount(userId);
    return { message: 'Account frozen' };
  }
}
