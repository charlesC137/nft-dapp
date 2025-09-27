import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './shared-components/footer/footer.component';
import { HeaderComponent } from './shared-components/header/header.component';
import { LoaderComponent } from './shared-components/loader/loader.component';
import { ContractService } from './services/contract.service';
import { LoaderService } from './services/loader.service';
import { ToastrService } from 'ngx-toastr';
import { NftService } from './services/nft.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FooterComponent, HeaderComponent, LoaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  constructor(
    private contractSrv: ContractService,
    private loaderSrv: LoaderService,
    private toastr: ToastrService,
    private nftSrv: NftService
  ) {}

  title = 'nft-dapp';

  async ngOnInit() {
    this.loaderSrv.show();
    try {
      window.onbeforeunload = () => {
        window.scrollTo(0, 0);
      };
      await this.contractSrv.restoreWalletConnection();
    } catch (error) {
      console.error('Error restoring wallet connection:', error);
      this.toastr.error('Error Initializing DAPP');
    } finally {
      this.loaderSrv.hide();
    }
  }
}
