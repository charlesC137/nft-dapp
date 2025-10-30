import { Component, OnDestroy, OnInit } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';
import {
  NFT,
  UnsignedVoucher,
  User,
  Voucher,
} from '../../../interfaces/interfaces';
import { NftService } from '../../../services/nft.service';
import { ContractService } from '../../../services/contract.service';
import {
  catchError,
  combineLatest,
  filter,
  firstValueFrom,
  of,
  startWith,
  Subject,
  Subscription,
  take,
  takeUntil,
} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { LoaderComponent } from '../../../shared-components/loader/loader.component';
import { LoaderService } from '../../../services/loader.service';
import { ShortenAddressPipe } from '../../../pipes/shorten-address.pipe';
import { environment } from '../../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { SocketService } from '../../../services/socket.service';

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
    private router: Router,
    private userSrv: UserService,
    private socketSrv: SocketService
  ) {}

  private destroy$ = new Subject<void>();

  item!: Voucher | NFT;

  onMintedSub!: Subscription;

  walletAddr!: string;
  contractAddr!: string;

  bookmarked!: boolean;
  user!: User;

  ngOnInit() {
    this.contractAddr = environment.contractAddress;

    this.onMintedSub = this.socketSrv.onNFTMinted().subscribe((payload) => {
      if (payload.metadataId !== this.item.metadata._id) {
        return;
      }

      this.destroy$.next();
      this.destroy$ = new Subject<void>();

      this.router.navigate([`/nft/${payload.nftId}`], {
        queryParams: { type: 'nft' },
        queryParamsHandling: 'merge',
      });

      this.router.events
        .pipe(
          filter((e) => e instanceof NavigationEnd),
          take(1)
        )
        .subscribe(() => {
          this.setupDataSubscription();
        });
    });

    this.setupDataSubscription();
  }

  private setupDataSubscription() {
    combineLatest([
      this.contractSrv.walletAddress$,
      this.route.paramMap,
      this.route.queryParamMap,
      this.userSrv.user$,
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(async ([walletAddr, params, queryParams, user]) => {
        try {
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

          this.walletAddr = walletAddr.toLowerCase();
          this.loaderSrv.show();

          const res = await firstValueFrom(
            this.nftSrv.getNFTOrVoucherDetail(id, itemType)
          );

          if (!res.body?.item) throw new Error('Item details not found');

          this.item = res.body.item;

          this.item.creator = this.item.creator.toLowerCase();
          this.item.owner = this.item.owner.toLowerCase();

          if (!user) {
            const res = await firstValueFrom(
              this.userSrv.getUserDetails(walletAddr)
            );

            if (!res.body?.userDetails) {
              throw new Error('User details could not be fetched');
            }
            user = res.body.userDetails;
            this.userSrv.updateUser(user);
          }

          this.user = user;

          this.bookmarked = this.user.bookmarkedNFTs.includes(this.item._id);
        } catch (err) {
          console.error(err);
          this.toastr.error('Error loading item details');
        } finally {
          this.loaderSrv.hide();
        }
      });
  }

  async toggleBookmark() {
    try {
      this.bookmarked = !this.bookmarked;
      const res = await firstValueFrom(
        this.nftSrv.toggleNFTBookmark(this.item._id, this.item.owner)
      );

      if (!res.body?.bookmarks) {
        throw new Error('Bookmarks not defined');
      }

      this.user.bookmarkedNFTs = res.body.bookmarks;

      this.userSrv.updateUser(this.user);

      const message = this.bookmarked ? 'added to' : 'removed from';

      this.toastr.success(`Item successfully ${message} bookmarks`);
    } catch (err) {
      const message = this.bookmarked ? 'adding item to' : 'removing item from';
      this.bookmarked = !this.bookmarked;

      console.error(err);
      this.toastr.error(`Error ${message} bookmarks`);
    }
  }

  async mint() {
    try {
      this.loaderSrv.show();
      if (this.isNFT(this.item)) {
        return console.error('Item has been minted');
      }

      await this.nftSrv.mint(this.item);
    } catch (err) {
      console.error(err);
    } finally {
      this.loaderSrv.hide();
    }
  }

  isNFT(item: NFT | Voucher): item is NFT {
    return this.nftSrv.isNFT(item);
  }

  weiToEth(wei: string) {
    return this.contractSrv.weiToEth(wei);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();

    this.onMintedSub.unsubscribe();
  }
}
