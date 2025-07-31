import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuctionService, Auction, Bid } from '../../core/services/auction.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auction-detail',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auction-detail.component.html',
  styleUrl: './auction-detail.component.scss'
})
export class AuctionDetailComponent implements OnInit, OnDestroy {
  auction: Auction | null = null;
  bidForm: FormGroup;
  isLoading = true;
  error: string | null = null;
  bidError: string | null = null;
  currentUser: any = null;
  isSpectator = false;
  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private auctionService: AuctionService,
    private authService: AuthService
  ) {
    this.bidForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0)]]
    });
  }

  ngOnInit(): void {
    this.loadAuction();
    this.setupWebSocket();
    this.subscriptions.push(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.auction) {
      this.auctionService.leaveAuctionRoom(this.auction.id);
    }
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private loadAuction(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/auctions']);
      return;
    }

    this.auctionService.getAuction(id).subscribe({
      next: (auction) => {
        this.auction = auction;
        this.isLoading = false;
        this.updateBidFormValidation();
      },
      error: (error) => {
        this.error = error.message || 'Failed to load auction';
        this.isLoading = false;
      }
    });
  }

  private setupWebSocket(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.auctionService.joinAuctionRoom(id);

    this.subscriptions.push(
      this.auctionService.onAuctionUpdate().subscribe(auction => {
        this.auction = auction;
        this.updateBidFormValidation();
      }),

      this.auctionService.onNewBid().subscribe(bid => {
        if (this.auction) {
          this.auction.bids = [...this.auction.bids, bid];
          this.auction.currentPrice = bid.amount;
          this.updateBidFormValidation();
        }
      }),

      this.auctionService.onAuctionStatusChange().subscribe(update => {
        if (this.auction && this.auction.id === update.auctionId) {
          this.auction.status = update.status as any;
          this.updateBidFormValidation();
        }
      })
    );
  }

  private updateBidFormValidation(): void {
    if (this.auction) {
      const minBid = this.auction.currentPrice + 1;
      this.bidForm.get('amount')?.setValidators([
        Validators.required,
        Validators.min(minBid)
      ]);
      this.bidForm.get('amount')?.updateValueAndValidity();
    }
  }

  onSubmitBid(): void {
    if (this.bidForm.valid && this.auction) {
      const amount = this.bidForm.get('amount')?.value;
      this.bidError = null;

      this.auctionService.placeBid(this.auction.id, amount).subscribe({
        next: (bid) => {
          // Update auction currentPrice and bids after successful bid
          if (this.auction) {
            this.auction.currentPrice = bid.amount;
            this.auction.bids = [...this.auction.bids, bid];
          }
          this.bidForm.reset();
        },
        error: (error) => {
          this.bidError = error.error?.message || 'Failed to place bid';
        }
      });
    }
  }

  canBid(): boolean {
    return this.currentUser 
      && this.auction 
      && this.auction.status === 'active'
      && this.auction.seller.id !== this.currentUser.id
      && !this.currentUser.isFrozen
      && !this.isSpectator;
  }

  spectateAuction(): void {
    if (this.auction) {
      this.auctionService.spectateAuctionRoom(this.auction.id);
      this.isSpectator = true;
    }
  }

  getTimeLeft(): string {
    if (!this.auction) return '';
    const end = new Date(this.auction.endTime).getTime();
    const now = new Date().getTime();
    const distance = end - now;

    if (distance <= 0) {
      return 'Auction ended';
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days}d ${hours}h left`;
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleString();
  }
}
