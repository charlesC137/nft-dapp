import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { InfiniteScrollDirective } from 'ngx-infinite-scroll';
import { NftService } from '../../services/nft.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { NFT, Voucher } from '../../interfaces/interfaces';
import { ToastrService } from 'ngx-toastr';
import { ContractService } from '../../services/contract.service';
import { FormsModule } from '@angular/forms';
import { ShortenAddressPipe } from '../../pipes/shorten-address.pipe';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nft-grid',
  standalone: true,
  imports: [
    CommonModule,
    InfiniteScrollDirective,
    FormsModule,
    ShortenAddressPipe,
  ],
  templateUrl: './nft-grid.component.html',
  styleUrl: './nft-grid.component.css',
})
export class NftGridComponent implements OnInit, OnChanges, OnDestroy {
  constructor(
    private nftSrv: NftService,
    private toastr: ToastrService,
    private contractSrv: ContractService,
    private router: Router
  ) {}

  @Input() order!: string;
  @Input() filters!: string[];
  @Input() searchTerm!: string;
  @Input() firstPageOnly!: string;

  @Output() nftsFound = new EventEmitter<number>();

  isLoading: boolean = false;
  hasError: boolean = false;
  initialLoad = true;
  noMoreItems = false;

  items: (Voucher | NFT)[] = [];
  skeletons = Array(3);

  page = 1;
  walletAddress!: string;

  sessionId!: string;

  walletAddrSub!: Subscription;

  async ngOnInit() {
    //await this.loadItems();

    this.sessionId = Date.now().toString();

    this.initialLoad = false;
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes['filters'] ||
      changes['order'] ||
      changes['searchTerm'] ||
      changes['firstPageOnly']
    ) {
      this.page = 1;
      this.items = [];
      this.noMoreItems = false;
      await this.loadItems();
    }
  }

  onScroll() {
    if (
      this.initialLoad ||
      this.isLoading ||
      (this.firstPageOnly && this.page > 1)
    )
      return;
    this.loadItems();
  }

  async loadItems() {
    this.isLoading = true;
    this.hasError = false;
    this.walletAddrSub = this.contractSrv.walletAddress$.subscribe(
      async (address) => {
        if (address) {
          this.walletAddress = address;
          try {
            if (!this.order) this.order = 'explore asc';
            const parts = this.order.split(' ');
            const form = parts[0];
            const order = parts[1];

            const res = await firstValueFrom(
              this.nftSrv.getNFTsAndVouchers(
                form,
                this.page,
                order,
                this.sessionId,
                this.filters,
                this.searchTerm
              )
            );

            if (!res.ok || !res.body) {
              throw new Error('Error fetching items from the server');
            }

            const data = res.body.data;
            this.nftsFound.emit(data.totalCount);

            if (data.items.length === 0) {
              console.warn('No more items to load');
              this.noMoreItems = true;
              return;
            }

            if (this.firstPageOnly) {
              const newItems = data.items.filter(
                (item) => item._id !== this.firstPageOnly
              );
              this.items.push(...newItems);
            } else {
              this.items.push(...data.items);
            }

            this.page++;
          } catch (err: any) {
            console.error(err);
            this.hasError = true;
            this.toastr.error('Error fetching more items');
          } finally {
            this.isLoading = false;
          }
        }
      }
    );
  }

  viewMore(item: NFT | Voucher) {
    const type = this.isNFT(item) ? 'nft' : 'voucher';
    this.router.navigate([`/nft/${item._id}`], {
      queryParams: { type },
      queryParamsHandling: 'merge',
    });
  }

  isNFT(item: NFT | Voucher): item is NFT {
    return (item as NFT).owner !== undefined;
  }

  weiToEth(wei: string) {
    return this.contractSrv.weiToEth(wei);
  }

  ngOnDestroy() {
    if (this.walletAddrSub) {
      this.walletAddrSub.unsubscribe();
    }
  }
}
