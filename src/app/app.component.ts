import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './services/socket.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from './services/product.service';
import { Product } from './models/product.model';
import { Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private message!: string;
  currentBid!: number;
  socketId!: any;
  activeProducts!: Product[];
  highestBid!: number;
  highestBidUser!: string;
  userBidForm = new FormGroup({
    username: new FormControl(''),
    bid: new FormControl(0)
  })
  simulationForm = new FormGroup({
    noOfUsers: new FormControl(0)
  })
  errorMessage!: string;
  logger: string[] = [];

  constructor(
    private socketservice: SocketService,
    private productService: ProductService
  ){
    this.currentBid = 10;
  }

  ngOnInit(){
    this.socketservice.onMessage().subscribe({
      next: data =>{
        console.log(data)
      }
    })

    this.socketservice.onConnect().subscribe({
      next: data =>{
        console.log(data);
        this.socketId = data;
      }
    })

    this.socketservice.onBidError().subscribe({
      next: data =>{
        this.errorMessage = data;
      }
    })

    this.socketservice.onNewHighestBid().subscribe({
      next: data =>{
        this.highestBid = data.currentBid;
        this.highestBidUser = data.username;
      }
    })

    this.socketservice.onLogger().subscribe({
      next: data =>{
        console.log(data);
        this.logger.push(data.message);
      }
    })

    this.loadAllData();
  }

  loadAllData(){
    this.getActiveProducts();
  }

  getActiveProducts(){
    this.productService.getActiveProducts().subscribe({
      next: (data) => {
        this.activeProducts = data
      },
      error: (err)=>{
        console.log(err);
      }
    })
  }

  onSubmit(productid: Number){
    this.socketservice.emitEvent('bid',{bid: this.userBidForm.value.bid, username: this.userBidForm.value.username, productId: productid});
  }

  onStartSimulation(productId: number){
    const clients = this.socketservice.createUsers(Number(this.simulationForm.value.noOfUsers));
    this.simulate(productId,clients);
  }

  getRandomSubset(clients: Socket[] ,size: number) {
    const shuffled = clients.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, size); // Return the first `size` elements
  }

  generateRandomBid() {
    const highestBid = this.highestBid || this.activeProducts[0].highestBid;
    const minBid = highestBid + 1; // Minimum bid value
    const maxBid = highestBid + 5; // Maximum bid value
    return Math.floor(Math.random() * (maxBid - minBid + 1)) + minBid; // Random value in range [minBid, maxBid]
  }

  simulate(productId: number, clients: Socket[]){
    setInterval(() => {
      const numberOfClients = clients.length;
      const subsetSize = Math.floor(Math.random() * numberOfClients) + 1;
      const selectedClients = this.getRandomSubset(clients,subsetSize);
      console.log("=========================================");
      selectedClients.forEach((socket, index) => {
        const randomBid = this.generateRandomBid();
        console.log(`User-${socket.id} | ${randomBid} | ${new Date()}`)
        this.socketservice.emitSimulatedEvent(socket,'bid',{
          bid: randomBid,
          username: `User-${socket.id}`,
          productId: productId});
      });
      console.log("=========================================");
    }, 2000);
  }
}
