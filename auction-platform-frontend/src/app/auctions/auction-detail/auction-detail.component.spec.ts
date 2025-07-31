import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { AuctionDetailComponent } from './auction-detail.component';
import { AuctionService, Auction, Bid } from '../../core/services/auction.service';
import { AuthService } from '../../core/services/auth.service';

describe('AuctionDetailComponent', () => {
  let component: AuctionDetailComponent;
  let fixture: ComponentFixture<AuctionDetailComponent>;
  let auctionServiceSpy: jasmine.SpyObj<AuctionService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockAuction: Auction = {
    id: '1',
    title: 'Test Auction',
    description: 'Test Description',
    startingPrice: 100,
    currentPrice: 100,
    startTime: new Date(),
    endTime: new Date(Date.now() + 86400000), // 1 day from now
    status: 'active',
    seller: {
      id: '1',
      username: 'seller1'
    },
    bids: []
  };

  beforeEach(async () => {
    const auctionSpy = jasmine.createSpyObj('AuctionService', [
      'getAuction',
      'placeBid',
      'joinAuctionRoom',
      'leaveAuctionRoom',
      'onAuctionUpdate',
      'onNewBid',
      'onAuctionStatusChange'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of(null)
    });
    const routeSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        AuctionDetailComponent,
        ReactiveFormsModule
      ],
      providers: [
        { provide: AuctionService, useValue: auctionSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routeSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        }
      ]
    }).compileComponents();

    auctionServiceSpy = TestBed.inject(AuctionService) as jasmine.SpyObj<AuctionService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Setup default spy returns
    auctionServiceSpy.getAuction.and.returnValue(of(mockAuction));
    auctionServiceSpy.onAuctionUpdate.and.returnValue(of(mockAuction));
    auctionServiceSpy.onNewBid.and.returnValue(of());
    auctionServiceSpy.onAuctionStatusChange.and.returnValue(of());

    fixture = TestBed.createComponent(AuctionDetailComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load auction on init', () => {
    fixture.detectChanges();

    expect(component.auction).toEqual(mockAuction);
    expect(component.isLoading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should handle error when loading auction fails', () => {
    const errorMessage = 'Failed to load auction';
    auctionServiceSpy.getAuction.and.returnValue(throwError(() => new Error(errorMessage)));
    
    fixture.detectChanges();

    expect(component.auction).toBeNull();
    expect(component.isLoading).toBeFalse();
    expect(component.error).toBe(errorMessage);
  });

  it('should validate bid amount', () => {
    fixture.detectChanges();
    const bidForm = component.bidForm;
    
    // Invalid - no amount
    expect(bidForm.valid).toBeFalse();

    // Invalid - below current price
    bidForm.get('amount')?.setValue(50);
    expect(bidForm.valid).toBeFalse();

    // Valid - above current price
    bidForm.get('amount')?.setValue(150);
    expect(bidForm.valid).toBeTrue();
  });

  it('should place bid when form is valid', () => {
    const mockBid: Bid = {
      id: '2',
      amount: 150,
      createdAt: new Date(),
      bidder: {
        id: '2',
        username: 'bidder1'
      }
    };
    auctionServiceSpy.placeBid.and.returnValue(of(mockBid));

    fixture.detectChanges();
    component.bidForm.get('amount')?.setValue(150);
    component.onSubmitBid();

    expect(auctionServiceSpy.placeBid).toHaveBeenCalledWith('1', 150);
    // Update auction currentPrice and bids after placing bid
    expect(component.auction?.currentPrice).toBe(150);
    expect(component.auction?.bids.some(bid => bid.id === mockBid.id)).toBeTrue();
    expect(component.bidForm.value.amount).toBe('');
    expect(component.bidError).toBeNull();
  });

  it('should handle bid placement error', () => {
    const errorMessage = 'Bid must be higher than current price';
    auctionServiceSpy.placeBid.and.returnValue(throwError(() => ({ error: { message: errorMessage } })));

    fixture.detectChanges();
    component.bidForm.get('amount')?.setValue(150);
    component.onSubmitBid();

    expect(component.bidError).toBe(errorMessage);
  });

  it('should calculate time left correctly', () => {
    fixture.detectChanges();
    
    const timeLeft = component.getTimeLeft();
    expect(timeLeft).toContain('h left');
  });

  it('should format price correctly', () => {
    const price = 1234.56;
    const formatted = component.formatPrice(price);
    expect(formatted).toBe('$1,234.56');
  });

  it('should format date correctly', () => {
    const date = new Date('2024-02-20T12:00:00Z');
    const formatted = component.formatDate(date);
    expect(formatted).toBeTruthy();
  });

  it('should determine if user can bid', () => {
    fixture.detectChanges();
    
    // Not logged in
    expect(component.canBid()).toBeFalse();

    // Logged in as buyer
    Object.defineProperty(authServiceSpy, 'currentUser$', { 
      get: () => of({ id: '2', role: 'BUYER' }) 
    });
    fixture.detectChanges();
    expect(component.canBid()).toBeTrue();

    // Logged in as seller (own auction)
    Object.defineProperty(authServiceSpy, 'currentUser$', { 
      get: () => of({ id: '1', role: 'SELLER' }) 
    });
    fixture.detectChanges();
    expect(component.canBid()).toBeFalse();
  });

  it('should clean up WebSocket subscriptions on destroy', () => {
    fixture.detectChanges();
    
    const spy = spyOn(component['subscriptions'][0], 'unsubscribe');
    component.ngOnDestroy();
    
    expect(spy).toHaveBeenCalled();
    expect(auctionServiceSpy.leaveAuctionRoom).toHaveBeenCalledWith('1');
  });
});
