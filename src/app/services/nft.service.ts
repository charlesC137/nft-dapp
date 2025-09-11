import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  NFT,
  SignedVoucher,
  UnsignedVoucher,
  Voucher,
} from '../interfaces/interfaces';

@Injectable({
  providedIn: 'root',
})
export class NftService {
  constructor(private http: HttpClient) {}

  createVoucher(form: FormData) {
    return this.http.post<{ voucher: UnsignedVoucher }>(
      '/api/nft/create-voucher',
      form,
      {
        observe: 'response',
      }
    );
  }

  saveVoucher(voucher: SignedVoucher) {
    return this.http.post('/api/nft/save-voucher', voucher, {
      observe: 'response',
    });
  }

  shuffle(array: []) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  getNFTsAndVouchers(filter: string, page: number, order: string) {
    return this.http.get<{ items: Voucher[] | NFT[] }>(
      `/api/nft/items?filter=${filter}&page=${page}&order=${order}`,
      { observe: 'response' }
    );
  }
}
