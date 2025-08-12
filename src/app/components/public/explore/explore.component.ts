import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NftGridComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css',
})
export class ExploreComponent {
  @Input() nft: any;
  isLoading: boolean = false;
  hasError: boolean = false;
  nfts: number[] = [1, 2];
  skeletons = Array(3);
}
