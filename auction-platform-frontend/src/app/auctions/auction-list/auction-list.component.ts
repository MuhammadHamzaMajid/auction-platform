import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuctionService, Auction } from '../../core/services/auction.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auction-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './auction-list.component.html',
  styleUrl: './auction-list.component.scss'
})
export class AuctionListComponent implements OnInit {
  auctions: Auction[] = [];
  isLoading = true;
  error: string | null = null;
  isLoggedIn = false;
  isSeller = false;

  constructor(
    private auctionService: AuctionService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadAuctions();
    this.checkUserRole();
  }

  private loadAuctions(): void {
    this.isLoading = true;
    this.auctionService.getAuctions().subscribe({
      next: (auctions) => {
        this.auctions = auctions;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = error.message || 'Failed to load auctions';
        this.isLoading = false;
      }
    });
  }

  private checkUserRole(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.isSeller = user?.role === 'SELLER';
    });
  }

  getTimeLeft(endTime: Date): string {
    const end = new Date(endTime).getTime();
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
}
