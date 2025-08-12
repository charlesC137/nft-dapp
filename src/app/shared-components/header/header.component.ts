import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContractService } from '../../services/contract.service';
import { AuthService } from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';
import { LoaderService } from '../../services/loader.service';
import { Subscription } from 'rxjs';
import { ShortenAddressPipe } from '../../pipes/shorten-address.pipe';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule, ShortenAddressPipe],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  constructor(
    private contractSrv: ContractService,
    private authSrv: AuthService,
    private toastr: ToastrService,
    private loaderSrv: LoaderService,
    private cd: ChangeDetectorRef
  ) {}

  walletAddress!: string | null;
  addressSubscription!: Subscription;

  ngOnInit() {
    this.addressSubscription = this.contractSrv.walletAddress$.subscribe(
      (val) => {
        this.walletAddress = val;
        this.cd.detectChanges();
      }
    );
  }

  async login() {
    this.loaderSrv.show();

    try {
      await this.contractSrv.connectWallet();

      const nonce = await firstValueFrom(this.authSrv.getNonce());

      const signature = await this.contractSrv.signAuthMessage(
        nonce.messageToSign
      );

      const res = await firstValueFrom(this.authSrv.verifyUser(signature));
      if (res.status !== 200) {
        throw new Error('Error verifying user');
      }

      this.toastr.success(`Connected To Wallet: ${this.walletAddress}`);
    } catch (err) {
      this.toastr.error('Wallet connection failed');
      console.error('Error', err);
    } finally {
      this.loaderSrv.hide();
    }
  }

  ngOnDestroy() {
    if (this.addressSubscription) {
      this.addressSubscription.unsubscribe();
    }
  }
}
