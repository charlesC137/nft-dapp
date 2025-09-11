import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NftGridComponent, FormsModule],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css',
})
export class ExploreComponent {
  filter = 'explore asc';
}
