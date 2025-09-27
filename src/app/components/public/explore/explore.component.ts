import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NftGridComponent } from '../../../shared-components/nft-grid/nft-grid.component';
import { FormsModule } from '@angular/forms';
import { Category } from '../../../interfaces/interfaces';
import { NftService } from '../../../services/nft.service';
import { ContractService } from '../../../services/contract.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, NftGridComponent, FormsModule],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.css',
})
export class ExploreComponent implements OnInit {
  constructor(
    private nftSrv: NftService,
    private contractSrv: ContractService,
    private toastr: ToastrService
  ) {}

  order = 'explore asc';
  nftsFound = 0;

  filters: Category[] = [];

  activeFilters = ['all'];
  searchTerm = '';

  showCategoriesModal = false;

  ngOnInit() {
    this.contractSrv.walletAddress$.subscribe(async (addr) => {
      if (addr) {
        try {
          this.filters = !this.nftSrv.categories
            ? await this.nftSrv.loadNftCategories()
            : this.nftSrv.categories;
        } catch (error) {
          console.error(error);
          this.toastr.error('Error Loading Categories');
        }
      }
    });
  }

  onNftsFound(count: number) {
    this.nftsFound = count;
  }

  replaceDashWithSpace(str: string) {
    return str.replace(/-/g, ' ');
  }

  checkFilterIsActive(filter: string) {
    return this.activeFilters.includes(filter);
  }

  toggleCategoriesModal() {
    this.showCategoriesModal = !this.showCategoriesModal;
  }

  toggleFilter(filter: string) {
    const isActive = this.activeFilters.includes(filter);

    if (!isActive) {
      if (filter === 'all') {
        this.activeFilters = ['all'];
      } else {
        this.activeFilters = [
          filter,
          ...this.activeFilters.filter((f) => f !== 'all' && f !== filter),
        ];
      }
    } else {
      this.activeFilters = this.activeFilters.filter((f) => f !== filter);
      if (this.activeFilters.length === 0) {
        this.activeFilters = ['all'];
      }
    }
  }

  isSeeMoreActive() {
    return this.filters
      .slice(7)
      .some((f) => this.activeFilters.includes(f.value));
  }

  getModalFilters() {
    const modalFilters = this.filters.slice(7);
    return modalFilters.sort((a, b) => {
      const aActive = this.activeFilters.includes(a.value) ? -1 : 1;
      const bActive = this.activeFilters.includes(b.value) ? -1 : 1;
      return aActive - bActive;
    });
  }
}
