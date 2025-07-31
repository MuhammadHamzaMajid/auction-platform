import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RouterTestingModule } from '@angular/router/testing';

import { AuctionListComponent } from './auction-list.component';
import { AuctionService, Auction } from '../../core/services/auction.service';
import { AuthService } from '../../core/services/auth.service';

describe('AuctionListComponent', () => {
  let component: AuctionListComponent;
  let fixture: ComponentFixture<AuctionListComponent>;
  let auctionServiceSpy: jasmine.SpyObj<AuctionService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  const mockAuction: Auction = {
    id: '1',
    title: 'Test Auction',
    description: 'Test Description',
    startingPrice: 100,
    currentPrice: 100,
    startTime: new Date(),
    endTime: new Date(),
    status: 'active',
    seller: {
      id: '1',
      username: 'seller1'
    },
    bids: []
  };

  beforeEach(async () => {
    const auctionSpy = jasmine.createSpyObj('AuctionService', ['getAuctions']);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: of(null)
    });

    await TestBed.configureTestingModule({
      imports: [
        AuctionListComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: AuctionService, useValue: auctionSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    }).compileComponents();

    auctionServiceSpy = TestBed.inject(AuctionService) as jasmine.SpyObj<AuctionService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    
    fixture = TestBed.createComponent(AuctionListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load auctions on init', () => {
    const mockAuctions = [mockAuction];
    auctionServiceSpy.getAuctions.and.returnValue(of(mockAuctions));
    
    fixture.detectChanges();

    expect(component.auctions).toEqual(mockAuctions);
    expect(component.isLoading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should handle error when loading auctions fails', () => {
    const errorMessage = 'Failed to load auctions';
    auctionServiceSpy.getAuctions.and.returnValue(throwError(() => new Error(errorMessage)));
    
    fixture.detectChanges();

    expect(component.auctions).toEqual([]);
    expect(component.isLoading).toBeFalse();
    expect(component.error).toBe(errorMessage);
  });

  it('should update user role when logged in as seller', () => {
    const mockUser = { role: 'SELLER' };
    Object.defineProperty(authServiceSpy, 'currentUser$', { 
      get: () => of(mockUser) 
    });
    
    fixture.detectChanges();

    expect(component.isLoggedIn).toBeTrue();
    expect(component.isSeller).toBeTrue();
  });

  it('should format price correctly', () => {
    const price = 1234.56;
    const formatted = component.formatPrice(price);
    expect(formatted).toBe('$1,234.56');
  });

  it('should calculate time left correctly', () => {
    const future = new Date();
    future.setDate(future.getDate() + 2); // 2 days from now
    const timeLeft = component.getTimeLeft(future);
    expect(timeLeft).toContain('d');
    expect(timeLeft).toContain('h');
  });

  it('should show ended status for past auctions', () => {
    const past = new Date();
    past.setDate(past.getDate() - 1); // 1 day ago
    const timeLeft = component.getTimeLeft(past);
    expect(timeLeft).toBe('Auction ended');
  });
});
