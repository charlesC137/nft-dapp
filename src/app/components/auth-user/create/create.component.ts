import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { ethers } from 'ethers';

import { NftService } from '../../../services/nft.service';
import { ContractService } from '../../../services/contract.service';
import { LoaderService } from '../../../services/loader.service';
import { UnsignedVoucher } from '../../../interfaces/interfaces';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './create.component.html',
  styleUrl: './create.component.css',
})
export class CreateComponent implements OnInit {
  nftForm: FormGroup;
  selectedFile: File | null = null;
  imagePreview: string | ArrayBuffer | null = null;
  categories!: string[];

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  constructor(
    private fb: FormBuilder,
    private nftSrv: NftService,
    private toastr: ToastrService,
    private contractSrv: ContractService,
    private loaderSrv: LoaderService
  ) {
    this.nftForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      price: [{ value: '', disabled: true }, [Validators.min(0.001)]],
      categories: this.fb.array([]),
      listForSale: [false],
      createAndMint: [false],
    });

    this.nftForm.get('listForSale')?.valueChanges.subscribe((listForSale) => {
      const priceControl = this.nftForm.get('price');
      if (listForSale) {
        priceControl?.enable();
        priceControl?.setValidators([
          Validators.required,
          Validators.min(0.001),
        ]);
      } else {
        priceControl?.reset();
        priceControl?.disable();
        priceControl?.clearValidators();
      }
      priceControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.contractSrv.walletAddress$.subscribe(async (addr) => {
      if (addr) {
        try {
          this.categories = (
            !this.nftSrv.categories
              ? await this.nftSrv.loadNftCategories()
              : this.nftSrv.categories
          )
            .filter((category) => {
              return (
                category.value !== 'all' &&
                category.value !== 'for-sale' &&
                category.value !== 'sold'
              );
            })
            .map((category) => category.value);
        } catch (error) {
          console.error(error);
          this.toastr.error('Error Loading Categories.');
        }
      }
    });
  }

  triggerFileInput() {
    this.fileInput.nativeElement.click();
  }

  replaceDashWithSpace(str: string) {
    return str.replace(/-/g, ' ');
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      this.toastr.error('Please select a valid image file');
      return;
    }

    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = () => (this.imagePreview = reader.result);
    reader.readAsDataURL(file);
  }

  onCheckboxChange(event: Event) {
    const checkbox = event.target as HTMLInputElement;
    const categoriesArray = this.nftForm.get('categories') as FormArray;

    if (checkbox.checked) {
      categoriesArray.push(this.fb.control(checkbox.value));
    } else {
      const index = categoriesArray.controls.findIndex(
        (ctrl) => ctrl.value === checkbox.value
      );
      categoriesArray.removeAt(index);
    }
  }

  isCategorySelected(category: string): boolean {
    return (this.nftForm.get('categories') as FormArray).value.includes(
      category
    );
  }

  async createVoucher() {
    if (!this.nftForm.valid || !this.selectedFile) {
      this.toastr.error('Please fill all required fields and select an image');
      return;
    }

    this.loaderSrv.show();
    try {
      const {
        name,
        description,
        price,
        categories,
        listForSale,
        createAndMint,
      } = this.nftForm.value;

      const formattedPrice = Number(price).toLocaleString('fullwide', {
        useGrouping: false,
      });

      const ethPrice = listForSale
        ? ethers.parseEther(formattedPrice).toString()
        : '0';

      const formData = new FormData();
      formData.append('price', ethPrice);
      formData.append('image', this.selectedFile);
      formData.append('name', name);
      formData.append('isListed', listForSale);

      if (categories.length > 0) formData.append('categories', categories);
      if (description) formData.append('description', description);

      const res = await firstValueFrom(this.nftSrv.createVoucher(formData));
      if (res.status !== 200 || !res.body?.voucher)
        throw new Error('Voucher creation failed');

      const { voucher } = res.body;

      const expiryTimestamp = Math.floor(
        new Date(voucher.expiry).getTime() / 1000
      );

      const unsignedVoucher: UnsignedVoucher = {
        uri: voucher.uri,
        price: BigInt(ethPrice),
        listItem: listForSale,
        creator: voucher.creator,
        expiry: BigInt(expiryTimestamp),
      };

      console.log(unsignedVoucher);

      const signature = await this.contractSrv.signAuthMessage(
        unsignedVoucher,
        true
      );

      const svRes = await firstValueFrom(
        this.nftSrv.saveSignature(signature, voucher._id)
      );

      if (svRes.status !== 200) throw new Error('Error saving signature');

      if (createAndMint) {
        await this.nftSrv.mint({ ...voucher, signature });
      }

      this.resetForm();
      this.toastr.success('NFT successfully created');
    } catch (err) {
      console.error(err);
      this.toastr.error('Error creating voucher for NFT');
    } finally {
      this.loaderSrv.hide();
    }
  }

  private resetForm() {
    this.selectedFile = null;
    this.imagePreview = null;
    this.nftForm.reset({ listForSale: false });
  }
}
