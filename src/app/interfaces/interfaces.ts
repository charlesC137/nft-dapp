export interface Voucher {
  creator: string;
  price: string;
  uri: string;
}

export interface SignedVoucher extends Voucher {
  signature: string;
  name: string;
  categories: string[];
  description: string;
  isListed: boolean;
}
