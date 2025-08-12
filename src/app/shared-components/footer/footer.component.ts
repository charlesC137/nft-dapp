import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContractService } from '../../services/contract.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, AsyncPipe],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.css',
})
export class FooterComponent {
  constructor(public contractSrv: ContractService) {}

  currentYear: number = new Date().getFullYear();
}
