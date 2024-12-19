export class Product{
    constructor(
        public productId: number,
        public productName: string,
        public productDescription: string,
        public startingBid: number,
        public highestBid: number,
        public highestBidUserName: string,
        public isActive: boolean
    ){}
}