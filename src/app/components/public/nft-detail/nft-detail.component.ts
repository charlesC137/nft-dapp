import { Component } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';

@Component({
  selector: 'app-nft-detail',
  standalone: true,
  imports: [NftGridComponent],
  templateUrl: './nft-detail.component.html',
  styleUrl: './nft-detail.component.css',
})
export class NftDetailComponent {}
