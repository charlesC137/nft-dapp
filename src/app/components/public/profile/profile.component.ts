import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  catchError,
  combineLatest,
  filter,
  finalize,
  firstValueFrom,
  map,
  Subscription,
  switchMap,
} from 'rxjs';
import { LoaderService } from '../../../services/loader.service';
import { ContractService } from '../../../services/contract.service';
import { ShortenAddressPipe } from '../../../pipes/shorten-address.pipe';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';
import { User } from '../../../interfaces/interfaces';
import { UserService } from '../../../services/user.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [NftGridComponent, FormsModule, CommonModule, ShortenAddressPipe],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  constructor(
    private loaderSrv: LoaderService,
    private contractSrv: ContractService,
    private toastrSrv: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private userSrv: UserService,
    private http: HttpClient
  ) {}

  selectedFilter: string = 'all';
  previewUrl: string | ArrayBuffer | null = null;
  isOwner: boolean = false;
  selectedAvatar!: Blob;

  walletAddressSub!: Subscription;
  profileSub!: Subscription;
  profile!: User;

  ngOnInit() {
    this.loaderSrv.show();

    const route$ = this.route.paramMap.pipe(
      map((params) => {
        const routeWalletAddress = params.get('walletAddress');
        if (!routeWalletAddress) {
          throw new Error('No Address Provided');
        }
        return routeWalletAddress;
      })
    );

    const wallet$ = this.contractSrv.walletAddress$;

    this.profileSub = combineLatest([route$, wallet$])
      .pipe(
        filter(([_, userWalletAddress]) => !!userWalletAddress),
        switchMap(async ([routeWalletAddress, userWalletAddress]) => {
          const isOwner =
            routeWalletAddress.toLowerCase() ===
            userWalletAddress?.toLowerCase();

          const res = await firstValueFrom(
            this.userSrv.getUserDetails(routeWalletAddress)
          );

          if (!res.body?.userDetails) {
            throw new Error('User Details Is Undefined');
          }

          const profile = res.body.userDetails;

          return { isOwner, profile };
        }),
        catchError((err) => {
          this.toastrSrv.error('Error Loading Profile Page');
          console.error(err);
          //this.router.navigate(['/']);
          return [];
        }),
        finalize(() => {
          this.loaderSrv.hide();
        })
      )
      .subscribe(({ isOwner, profile }) => {
        this.isOwner = isOwner;
        this.profile = profile;
        this.cdr.detectChanges();
      });
  }

  applyFilter() {}

  onFileSelected(event: Event) {
    if (!this.isOwner) {
      console.warn('Not authorized to upload image');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedAvatar = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.previewUrl = reader.result;
      };

      reader.readAsDataURL(this.selectedAvatar);

      this.uploadAvatar();

      input.value = '';
      this.profile.avatarUrl = '';
    }
  }

  async uploadAvatar() {
    this.loaderSrv.show();
    if (!this.selectedAvatar) return;

    const formData = new FormData();
    formData.append('image', this.selectedAvatar);

    try {
      await firstValueFrom(this.userSrv.updateUserAvatar(formData));

      this.toastrSrv.success('Avatar Successfully Updated');
    } catch (err) {
      console.error(err);
      this.toastrSrv.error('Error updating avatar');
    } finally {
      this.loaderSrv.hide();
    }
  }

  copyText(text: string) {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        this.toastrSrv.success('Text Copied Successfully');
      })
      .catch((err) => {
        this.toastrSrv.error('Failed to copy!');
      });
  }

  ngOnDestroy() {
    if (this.walletAddressSub) {
      this.walletAddressSub.unsubscribe();
    }
  }
}
