import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SocketService } from './services/socket.service';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { ProductService } from './services/product.service';
import { Product } from './models/product.model';

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
  errorMessage!: string;

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
}
