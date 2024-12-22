import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './services/socket.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from './services/product.service';
import { Product } from './models/product.model';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Socket } from 'socket.io-client';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ReactiveFormsModule, CommonModule, MatCardModule, MatButtonModule, MatInputModule, MatFormFieldModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  private message!: string;
  private simulationIntervalId: any = null;
  currentBid!: number;
  socketId!: any;
  activeProducts!: Product[];
  highestBid!: number;
  highestBidUser!: string;
  userBidForm = new FormGroup({
    username: new FormControl(''),
    bid: new FormControl(0)
  })
  showStartBtn: boolean = true;
  simulationForm = new FormGroup({
    noOfUsers: new FormControl(0)
  })
  private _snackBar = inject(MatSnackBar);
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
        this._snackBar.open(this.errorMessage, 'Close' ,{
          duration: 5000
        });
      }
    })

    this.socketservice.onNewHighestBid().subscribe({
      next: data =>{
        this.highestBid = data.currentBid;
        this.highestBidUser = data.username;
      }
    })

    this.socketservice.onLogs().subscribe({
      next: data =>{
        const logMessage = `Status: ${data.status} | Username: ${data.username} | Bid Value: ${data.bid} | Time Stamp: ${data.timeStamp}`;
        this.logger.unshift(logMessage);
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
    if(Number(this.simulationForm.value.noOfUsers)<=0 || Number(this.simulationForm.value.noOfUsers) > 50){
      this._snackBar.open("User number should be between 1 and 50", 'Close' ,{
        duration: 5000
      });
      return;
    }
    this.showStartBtn = false;
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
    this.simulationIntervalId = setInterval(() => {
      const numberOfClients = clients.length;
      const subsetSize = Math.floor(Math.random() * numberOfClients) + 1;
      const selectedClients = this.getRandomSubset(clients,subsetSize);
      // console.log("=========================================");
      selectedClients.forEach((socket, index) => {
        const randomBid = this.generateRandomBid();
        // console.log(`User-${socket.id} | ${randomBid} | ${new Date()}`)
        this.socketservice.emitSimulatedEvent(socket,'bid',{
          bid: randomBid,
          username: `User-${socket.id}`,
          productId: productId});
      });
      // console.log("=========================================");
    }, 500);
  }

  stopSimulation(){
    this.showStartBtn = true;
    if (this.simulationIntervalId !== null) {
      clearInterval(this.simulationIntervalId); 
      this.simulationIntervalId = null; 
      this.socketservice.clearUsers();
    }
  }
}
