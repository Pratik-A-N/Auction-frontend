import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly apiUrl: string = environment.apiUrl + '/product';
  constructor(private http: HttpClient) { }

  getActiveProducts(){
    return this.http.get<Product[]>(this.apiUrl);
  }
}
