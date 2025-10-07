import { Component, OnDestroy, OnInit } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';
import { NFT, Voucher } from '../../../interfaces/interfaces';
import { NftService } from '../../../services/nft.service';
import { ContractService } from '../../../services/contract.service';
import {
  combineLatest,
  firstValueFrom,
  Subject,
  Subscription,
  takeUntil,
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../../shared-components/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';
import { ShortenAddressPipe } from '../../../pipes/shorten-address.pipe';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-nft-detail',
  standalone: true,
  imports: [
    NftGridComponent,
    LoaderComponent,
    ShortenAddressPipe,
    CommonModule,
  ],
  templateUrl: './nft-detail.component.html',
  styleUrl: './nft-detail.component.css',
})
export class NftDetailComponent implements OnInit, OnDestroy {
  constructor(
    private nftSrv: NftService,
    private contractSrv: ContractService,
    private toastr: ToastrService,
    private loaderSrv: LoaderService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  private destroy$ = new Subject<void>();

  item!: Voucher | NFT;

  walletAddrSub!: Subscription;
  walletAddr!: string;

  contractAddr!: string;

  ngOnInit() {
    this.contractAddr = environment.contractAddress;

    combineLatest([
      this.contractSrv.walletAddress$,
      this.route.paramMap,
      this.route.queryParamMap,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([walletAddr, params, queryParams]) => {
        if (!walletAddr) return;

        const id = params.get('id');
        const itemType = queryParams.get('type');

        if (
          !id ||
          !itemType ||
          (itemType !== 'voucher' && itemType !== 'nft')
        ) {
          this.toastr.error('Invalid URL');
          this.router.navigate(['/404']);
          return;
        }

        this.walletAddr = walletAddr;
        this.loaderSrv.show();

        try {
          const res = await firstValueFrom(
            this.nftSrv.getNFTOrVoucherDetail(id, itemType)
          );

          if (!res.body?.item) throw new Error('Item details not found');

          this.item = res.body.item;
        } catch (err) {
          console.error(err);
          this.toastr.error('Error loading item details');
        } finally {
          this.loaderSrv.hide();
        }
      });
  }

  isNFT(item: NFT | Voucher): item is NFT {
    return (item as NFT).owner !== undefined;
  }

  weiToEth(wei: string) {
    return this.contractSrv.weiToEth(wei);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
