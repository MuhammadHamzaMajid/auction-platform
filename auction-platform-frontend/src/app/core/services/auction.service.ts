import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { WebSocketService } from './websocket.service';

export interface Auction {
  id: string;
  title: string;
  description: string;
  startingPrice: number;
  currentPrice: number;
  startTime: Date;
  endTime: Date;
  status: 'draft' | 'active' | 'ended' | 'cancelled';
  seller: {
    id: string;
    username: string;
  };
  bids: Bid[];
}

export interface Bid {
  id: string;
  amount: number;
  createdAt: Date;
  bidder: {
    id: string;
    username: string;
  };
}

export interface CreateAuctionDto {
  title: string;
  description: string;
  startingPrice: number;
  startTime: Date;
  endTime: Date;
}

@Injectable({
  providedIn: 'root'
})
export class AuctionService {
  private apiUrl = `${environment.apiUrl}/auctions`;

  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status === 0) {
      // Network error or backend not running
      errorMessage = 'Unable to connect to the server. Please ensure the backend server is running.';
    } else {
      // Backend error
      errorMessage = `${error.status}: ${error.error?.message || error.statusText}`;
    }
    console.error('AuctionService Error:', error);
    return throwError(() => new Error(errorMessage));
  }

  getAuctions(): Observable<Auction[]> {
    return this.http.get<Auction[]>(this.apiUrl).pipe(
      retry(3),
      delay(1000),
      catchError(this.handleError)
    );
  }

  getAuction(id: string): Observable<Auction> {
    return this.http.get<Auction>(`${this.apiUrl}/${id}`).pipe(
      retry(3),
      delay(1000),
      catchError(this.handleError)
    );
  }

  createAuction(auction: CreateAuctionDto): Observable<Auction> {
    return this.http.post<Auction>(this.apiUrl, auction).pipe(
      catchError(this.handleError)
    );
  }

  placeBid(auctionId: string, amount: number): Observable<Bid> {
    return this.http.post<Bid>(`${this.apiUrl}/${auctionId}/bid`, { amount }).pipe(
      catchError(this.handleError)
    );
  }

  joinAuctionRoom(auctionId: string): void {
    this.wsService.emit('joinAuction', auctionId);
  }

  leaveAuctionRoom(auctionId: string): void {
    this.wsService.emit('leaveAuction', auctionId);
  }

  spectateAuctionRoom(auctionId: string): void {
    this.wsService.emit('spectateAuction', auctionId);
  }

  onAuctionUpdate(): Observable<Auction> {
    return this.wsService.listen<Auction>('auctionUpdate');
  }

  onNewBid(): Observable<Bid> {
    return this.wsService.listen<Bid>('newBid');
  }

  onAuctionStatusChange(): Observable<{ auctionId: string; status: string }> {
    return this.wsService.listen<{ auctionId: string; status: string }>('auctionStatus');
  }
}
