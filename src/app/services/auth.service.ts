import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContractService } from './contract.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient, private contractSrv: ContractService) {}

  public isRefreshing = false;

  getNonce() {
    return this.http.get<{ nonce: string; messageToSign: string }>(
      `/api/auth/nonce/${this.contractSrv.getWalletAddress()}`
    );
  }

  verifyUser(signature: string) {
    return this.http.post(
      '/api/auth/verify',
      {
        wallet: this.contractSrv.getWalletAddress(),
        signature,
      },
      { observe: 'response' }
    );
  }

  refreshAccessToken() {
    return this.http.post('/api/auth/refresh', {}, { withCredentials: true });
  }

  logout() {
    // redirect to login or show toast
  }
}
