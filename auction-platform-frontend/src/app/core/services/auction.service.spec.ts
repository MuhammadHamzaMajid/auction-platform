import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuctionService, Auction, Bid } from './auction.service';
import { WebSocketService } from './websocket.service';
import { environment } from '../../../environments/environment';

describe('AuctionService', () => {
  let service: AuctionService;
  let httpMock: HttpTestingController;
  let wsServiceSpy: jasmine.SpyObj<WebSocketService>;

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

  beforeEach(() => {
    const spy = jasmine.createSpyObj('WebSocketService', ['emit', 'listen']);
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuctionService,
        { provide: WebSocketService, useValue: spy }
      ]
    });

    service = TestBed.inject(AuctionService);
    httpMock = TestBed.inject(HttpTestingController);
    wsServiceSpy = TestBed.inject(WebSocketService) as jasmine.SpyObj<WebSocketService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get all auctions', () => {
    const mockAuctions: Auction[] = [mockAuction];

    service.getAuctions().subscribe(auctions => {
      expect(auctions).toEqual(mockAuctions);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auctions`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAuctions);
  });

  it('should get a single auction by id', () => {
    service.getAuction('1').subscribe(auction => {
      expect(auction).toEqual(mockAuction);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auctions/1`);
    expect(req.request.method).toBe('GET');
    req.flush(mockAuction);
  });

  it('should place a bid', () => {
    const mockBid: Bid = {
      id: '1',
      amount: 150,
      createdAt: new Date(),
      bidder: {
        id: '2',
        username: 'bidder1'
      }
    };

    service.placeBid('1', 150).subscribe(bid => {
      expect(bid).toEqual(mockBid);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/auctions/1/bid`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ amount: 150 });
    req.flush(mockBid);
  });

  it('should join auction room via websocket', () => {
    service.joinAuctionRoom('1');
    expect(wsServiceSpy.emit).toHaveBeenCalledWith('joinAuction', '1');
  });

  it('should leave auction room via websocket', () => {
    service.leaveAuctionRoom('1');
    expect(wsServiceSpy.emit).toHaveBeenCalledWith('leaveAuction', '1');
  });

  it('should listen for auction updates', () => {
    wsServiceSpy.listen.and.returnValue(null as any);
    service.onAuctionUpdate();
    expect(wsServiceSpy.listen).toHaveBeenCalledWith('auctionUpdate');
  });

  it('should listen for new bids', () => {
    wsServiceSpy.listen.and.returnValue(null as any);
    service.onNewBid();
    expect(wsServiceSpy.listen).toHaveBeenCalledWith('newBid');
  });

  it('should listen for auction status changes', () => {
    wsServiceSpy.listen.and.returnValue(null as any);
    service.onAuctionStatusChange();
    expect(wsServiceSpy.listen).toHaveBeenCalledWith('auctionStatus');
  });
});
