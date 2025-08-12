import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-nft-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './nft-grid.component.html',
  styleUrl: './nft-grid.component.css',
})
export class NftGridComponent {
  onSale: boolean = false;
  profile: boolean = true;
}
