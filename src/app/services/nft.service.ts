import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Category,
  NFT,
  SignedVoucher,
  UnsignedVoucher,
  Voucher,
} from '../interfaces/interfaces';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NftService {
  constructor(private http: HttpClient) {}

  public categories!: Category[];

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
    return this.http.get<{ item: NFT | Voucher }>('/api/nft/details', {
      params: { id, type },
      observe: 'response',
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
}
