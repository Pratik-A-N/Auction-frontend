import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io } from "socket.io-client";

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;
  constructor() {
    this.socket = io('http://localhost:3000')
  }

  public onMessage() {
    return new Observable(observer => {
      this.socket.on('message', (message : string) => {
        observer.next(message);
      });
    });
  }

  public onConnect(){
    return new Observable(Observer => {
      this.socket.on('connect',()=>{
        Observer.next(this.socket.id)
      })
    })
  }

  onBidError(): Observable<string> {
    return new Observable((observer) => {
      this.socket.on('bidError', (error: string) => {
        observer.next(error);
      });
    });
  }

  onNewHighestBid(): Observable<{productId: string; currentBid: number; username: string }> {
    return new Observable((observer)=>{
      this.socket.on('updateBid',(data: { productId: string; currentBid: number; username: string; } | undefined)=>{
        observer.next(data);
      })
    })
  }

  emitEvent(event: string, data: any): void {
    this.socket.emit(event, data);
  }

}
