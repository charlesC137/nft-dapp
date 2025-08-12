import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { LoaderService } from '../../../services/loader.service';
import { ContractService } from '../../../services/contract.service';
import { ShortenAddressPipe } from '../../../pipes/shorten-address.pipe';
import { ToastrService } from 'ngx-toastr';
import { ActivatedRoute, Router } from '@angular/router';

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
    private cdr: ChangeDetectorRef
  ) {}

  selectedFilter: string = 'all';
  previewUrl: string | ArrayBuffer | null = null;
  isOwner: boolean = false;

  walletAddressSub!: Subscription;
  userWalletAddress!: string | null;
  routeWalletAddress!: string;

  ngOnInit() {
    this.loaderSrv.show();

    try {
      this.route.paramMap.subscribe((params) => {
        const routeWalletAddress = params.get('walletAddress');

        if (!routeWalletAddress) {
          throw new Error('No Address Provided');
        }

        this.routeWalletAddress = routeWalletAddress;
      });

      this.walletAddressSub = this.contractSrv.walletAddress$.subscribe(
        (val) => {
          this.userWalletAddress = val;

          if (
            this.routeWalletAddress.toLowerCase() ===
            this.userWalletAddress?.toLowerCase()
          ) {
            this.isOwner = true;
          } else {
            this.isOwner = false;
          }

          this.cdr.detectChanges();
        }
      );
    } catch (err) {
      this.toastrSrv.error('Error Loading Profile Page');
      console.error(err);
      this.router.navigate(['/']);
    } finally {
      this.loaderSrv.hide();
    }
  }

  applyFilter() {}

  onFileSelected(event: Event) {
    if (!this.isOwner) {
      console.warn('Not authorized to upload image');
      return;
    }

    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.previewUrl = reader.result;
      };

      reader.readAsDataURL(file);
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
