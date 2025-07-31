import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, timer } from 'rxjs';
import { retryWhen, tap, delayWhen } from 'rxjs/operators';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000; // 1 second

  constructor(private authService: AuthService) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    const token = this.authService.getToken();
    if (token && !this.connected) {
      this.socket = io(environment.apiUrl, {
        auth: { token },
        transports: ['websocket'],
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: this.baseReconnectDelay,
        reconnectionDelayMax: 5000
      });

      this.setupSocketListeners();
    }
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.connected = true;
      this.reconnectAttempts = 0;
      console.log('Connected to WebSocket server');
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect();
    });

    this.socket.on('disconnect', (reason) => {
      this.connected = false;
      console.log('Disconnected from WebSocket server:', reason);
      if (reason === 'io server disconnect') {
        // Server initiated disconnect, try to reconnect
        this.handleReconnect();
      }
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts), 5000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      setTimeout(() => {
        this.initializeSocket();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
    }
  }

  emit(event: string, data?: any): void {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    } else {
      console.warn('Socket not connected, attempting to reconnect...');
      this.handleReconnect();
    }
  }

  listen<T>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      if (!this.socket) {
        observer.error(new Error('Socket not initialized'));
        return;
      }

      this.socket.on(event, (data: T) => {
        observer.next(data);
      });

      return () => {
        this.socket?.off(event);
      };
    }).pipe(
      retryWhen(errors =>
        errors.pipe(
          tap(err => console.warn(`Error on event ${event}:`, err)),
          delayWhen(() => timer(1000)), // Wait 1 second before retrying
          tap(() => console.log(`Retrying event ${event} subscription...`))
        )
      )
    );
  }

  ngOnDestroy(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}
