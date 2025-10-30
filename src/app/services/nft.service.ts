import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Category,
  NFT,
  UnsignedVoucher,
  Voucher,
} from '../interfaces/interfaces';
import { firstValueFrom } from 'rxjs';
import { ContractService } from './contract.service';

@Injectable({
  providedIn: 'root',
})
export class NftService {
  constructor(private http: HttpClient, private contractSrv: ContractService) {}

  public categories!: Category[];

  createVoucher(form: FormData) {
    return this.http.post<{ voucher: Voucher }>(
      '/api/nft/create-voucher',
      form,
      {
        observe: 'response',
      }
    );
  }

  saveSignature(signature: string, voucherId: string) {
    return this.http.post(
      '/api/nft/save-signature',
      { signature, voucherId },
      {
        observe: 'response',
      }
    );
  }

  getNFTCategories() {
    return this.http.get<{ categories: Category[] }>('/api/nft/categories', {
      observe: 'response',
    });
  }

  async loadNftCategories() {
    const res = await firstValueFrom(this.getNFTCategories());

    if (!res.ok || !res.body?.categories || !res.body?.categories.length) {
      throw new Error('Error fetching category');
    }

    this.categories = res.body.categories;

    return this.categories;
  }

  getNFTsAndVouchers(
    sort: string,
    page: number,
    order: string,
    sessionId?: string,
    filters?: string[],
    searchTerm?: string,
    ownerAddress?: string,
    nftIds?: string[],
    filterType?: string
  ) {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('order', order)
      .set('sort', sort);

    if (filters) {
      filters.forEach((filter) => {
        params = params.append('filters', filter);
      });
    }

    if (sessionId) {
      params = params.set('sessionId', sessionId);
    }

    if (searchTerm) {
      params = params.set('searchTerm', searchTerm);
    }

    if (ownerAddress) {
      params = params.set('ownerAddress', ownerAddress);
    }

    if (nftIds) {
      nftIds.forEach((id) => {
        params = params.append('nftIds', id);
      });
    }

    if (filterType) {
      params = params.set('filterType', filterType);
    }

    return this.http.get<{
      data: { items: (NFT | Voucher)[]; totalCount: number };
    }>('/api/nft/items', {
      params,
      observe: 'response',
    });
  }

  getNFTOrVoucherDetail(id: string, type: 'nft' | 'voucher') {
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    });

    return this.http.get<{ item: NFT | Voucher }>('/api/nft/details', {
      params: { id, type },
      observe: 'response',
      headers,
    });
  }

  toggleNFTBookmark(id: string, owner: string) {
    return this.http.post<{ message: string; bookmarks: string[] }>(
      'api/nft/bookmark',
      { id, owner },
      {
        observe: 'response',
      }
    );
  }

  isNFT(item: NFT | Voucher) {
    return (item as NFT).tokenId !== undefined;
  }

  async mint(voucher: Voucher) {
    try {
      const date = new Date(voucher.expiry);
      const unixSeconds = Math.floor(date.getTime() / 1000);
      const expiry = BigInt(unixSeconds);

      const miniVoucher: UnsignedVoucher = {
        creator: voucher.creator,
        uri: voucher.uri,
        price: BigInt(voucher.price),
        expiry,
        listItem: false,
      };

      await this.contractSrv.mintNFT(miniVoucher, voucher.signature);
    } catch (err) {
      console.error(err);
    }
  }
}
