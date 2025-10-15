import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CarouselModule } from 'ngx-owl-carousel-o';
import { NFT, Voucher } from '../../../interfaces/interfaces';
import { ShortenAddressPipe } from '../../../pipes/shorten-address.pipe';
import { ContractService } from '../../../services/contract.service';
import { firstValueFrom, Subscription } from 'rxjs';
import { NftService } from '../../../services/nft.service';
import { LoaderComponent } from '../../../shared-components/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    CarouselModule,
    ShortenAddressPipe,
    LoaderComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit, OnDestroy {
  constructor(
    private contractSrv: ContractService,
    private nftSrv: NftService,
    private loaderSrv: LoaderService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  featuredNFTs: (Voucher | NFT)[] = [];

  walletAddrSub!: Subscription;
  walletAddress!: string;

  sessionId!: string;

  customOptions = {
    loop: true,
    autoplay: true,
    autoplayTimeout: 3000,
    autoplayHoverPause: true,
    margin: 20,
    dots: true,
    autoHeight: true,
    responsive: {
      0: { items: 1 },
      640: { items: 2 },
      1000: { items: 3 },
    },
  };

  async ngOnInit() {
    this.loaderSrv.show();
    this.sessionId = Date.now().toString();

    this.walletAddrSub = this.contractSrv.walletAddress$.subscribe(
      async (address) => {
        if (address) {
          this.walletAddress = address;
          try {
            const res = await firstValueFrom(
              this.nftSrv.getNFTsAndVouchers(
                'explore',
                1,
                'asc',
                this.sessionId
              )
            );

            if (!res.ok || !res.body) {
              throw new Error('Error fetching items from the server');
            }

            this.featuredNFTs = res.body.data.items;
          } catch (err: any) {
            console.error(err);
            this.toastr.error('Error fetching more items');
          } finally {
            this.loaderSrv.hide();
          }
        }
      }
    );
  }

  weiToEth(wei: string) {
    return this.contractSrv.weiToEth(wei);
  }

  viewMore(item: NFT | Voucher) {
    const type = this.isNFT(item) ? 'nft' : 'voucher';

    this.router.navigate([`/nft/${item._id}`], {
      queryParams: { type },
      queryParamsHandling: 'merge',
    });
  }

  isNFT(item: NFT | Voucher): item is NFT {
    return this.nftSrv.isNFT(item);
  }

  ngOnDestroy(): void {
    if (this.walletAddrSub) {
      this.walletAddrSub.unsubscribe();
    }
  }
}
