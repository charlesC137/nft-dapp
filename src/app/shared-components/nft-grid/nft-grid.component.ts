import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { NftService } from '../../services/nft.service';
import { firstValueFrom } from 'rxjs';
import { NFT, Voucher } from '../../interfaces/interfaces';

@Component({
  selector: 'app-nft-grid',
  standalone: true,
  imports: [CommonModule, InfiniteScrollDirective],
  templateUrl: './nft-grid.component.html',
  styleUrl: './nft-grid.component.css',
})
export class NftGridComponent implements OnInit {
  constructor(private nftSrv: NftService) {}

  @Input() filter!: string;

  onSale: boolean = false;
  profile: boolean = true;

  isLoading: boolean = false;
  hasError: boolean = false;
  items: Voucher[] | NFT[] = [];
  skeletons = Array(3);
  page = 1;

  async ngOnInit() {
    this.isLoading = true;
    console.log(this.filter);

    try {
      if (!this.filter) {
        throw new Error('Filter not initialized');
      }
      const parts = this.filter.split(' ');
      const filter = parts[0];
      const order = parts[1];
      const res = await firstValueFrom(
        this.nftSrv.getNFTsAndVouchers(filter, this.page, order)
      );

      if (!res.ok) {
        throw new Error('Error fetching items from the server');
      }

      if (res.body) {
        this.items.push(res.body?.items);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async loadMore() {}
}
