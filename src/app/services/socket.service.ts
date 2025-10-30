import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private socket: Socket;

  constructor() {
    this.socket = io('http://localhost:3000', {
      transports: ['websocket'],
    });
  }

  onNFTMinted(): Observable<any> {
    return new Observable((subscriber) => {
      this.socket.on('nft-minted', (data) => subscriber.next(data));
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
