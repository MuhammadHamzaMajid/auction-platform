import { WebSocketGateway, SubscribeMessage, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards, Injectable } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
})
export class AuctionsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  @UseGuards(JwtAuthGuard)
  async handleConnection(client: Socket) {
    // Handle connection
    console.log(`Client connected: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Handle disconnection
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinAuction')
  async handleJoinAuction(client: Socket, auctionId: string) {
    await client.join(`auction_${auctionId}`);
  }

  @SubscribeMessage('leaveAuction')
  async handleLeaveAuction(client: Socket, auctionId: string) {
    await client.leave(`auction_${auctionId}`);
  }

  @SubscribeMessage('spectateAuction')
  async handleSpectateAuction(client: Socket, auctionId: string) {
    // Spectators join the room but are not allowed to bid
    await client.join(`auction_${auctionId}`);
    client.emit('spectatorJoined', { auctionId });
  }

  @OnEvent('auction.update')
  handleAuctionUpdate(payload: { auctionId: string }) {
    this.server.to(`auction_${payload.auctionId}`).emit('auctionUpdated', payload);
  }

  @OnEvent('auction.status')
  handleAuctionStatusChange(payload: { auctionId: string; status: string }) {
    this.server.to(`auction_${payload.auctionId}`).emit('auctionStatusChanged', payload);
  }

  @OnEvent('auction.bid')
  handleBidPlaced(payload: { auctionId: string; bid: any }) {
    this.server.to(`auction_${payload.auctionId}`).emit('bidPlaced', payload);
  }

  @SubscribeMessage('placeBid')
  async handlePlaceBid(client: Socket, data: { auctionId: string; amount: number; userId: string }) {
    // Optionally, check if user is allowed to bid (not a spectator, not seller, not frozen)
    // This should also be enforced in the service layer
    this.server.to(`auction_${data.auctionId}`).emit('bidAttempted', data);
  }
}
