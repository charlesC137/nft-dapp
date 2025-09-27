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
    private contractSrv: ContractService
  ) {}

  @Input() order!: string;
  @Input() filters!: string[];
  @Input() searchTerm!: string;

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
    if (changes['filters'] || changes['order'] || changes['searchTerm']) {
      this.page = 1;
      this.items = [];
      this.noMoreItems = false;
      await this.loadItems();
    }
  }

  onScroll() {
    if (this.initialLoad || this.isLoading) return;
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

            this.items.push(...data.items);
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

  weiToEth(wei: string) {
    return this.contractSrv.weiToEth(wei);
  }

  ngOnDestroy() {
    if (this.walletAddrSub) {
      this.walletAddrSub.unsubscribe();
    }
  }
}
