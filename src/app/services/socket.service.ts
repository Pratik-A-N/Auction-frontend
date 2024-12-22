import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from "socket.io-client";
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: any;
  private readonly apiUrl: string = environment.apiUrl;
  private sockets: Socket[] = [];
  constructor() {
    this.socket = io(this.apiUrl)
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

  onLogs(): Observable<{
    status: string;
    username: string;
    bid: number;
    currentBid: number;
    timeStamp: Date
  }> {
    return new Observable((observer) =>{
      this.socket.on('logs',(data: {status: string; username: string; bid: number; currentBid: number; timeStamp: Date} | undefined)=>{
        observer.next(data);
      })
    })
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

  emitSimulatedEvent(sokt: Socket, event: string, data: any){
    sokt.emit(event,data);
  }

  createUsers(userNumber: number){
    console.log(userNumber);
    for(let i=0; i<userNumber; i++){
      const sokt = io(this.apiUrl); 
      this.sockets.push(sokt);
    }
    return this.sockets;
  }

  clearUsers(){
    this.sockets = [];
  }
}
