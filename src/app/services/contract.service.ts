import { Injectable } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { BrowserProvider, ethers } from 'ethers';
import { environment as env } from '../../environments/environment';
import { abi as contractAbi } from '../../assets/abi/NFT.json';
import { BehaviorSubject } from 'rxjs';
import { UnsignedVoucher, Voucher } from '../interfaces/interfaces';

declare let window: any;

@Injectable({
  providedIn: 'root',
})
export class ContractService {
  private contract: ethers.Contract | null = null;
  private provider!: ethers.BrowserProvider | null;
  private signer!: ethers.JsonRpcSigner | null;

  private readonly domain = {
    name: env.contractName,
    version: env.version,
    chainId: env.chainID,
    verifyingContract: env.contractAddress,
  };

  private readonly types = {
    NFTVoucher: [
      { name: 'creator', type: 'address' },
      { name: 'uri', type: 'string' },
      { name: 'price', type: 'uint256' },
    ],
  };

  private walletAddress = new BehaviorSubject<string | null>(null);
  walletAddress$ = this.walletAddress.asObservable();

  constructor(private toastr: ToastrService) {}

  async connectWallet() {
    try {
      if (!window.ethereum) {
        this.toastr.error('Please install MetaMask!');
        return;
      }

      if (!(window as any)._listenerRegistered) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            localStorage.removeItem('walletAddress');
            this.clearWalletAddress();
          } else {
            this.updateWalletAddress(accounts[0]);
            localStorage.setItem('walletAddress', accounts[0]);
          }
        });
        (window as any)._listenerRegistered = true;
      }

      this.provider = new BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();

      const address = await this.signer.getAddress();
      this.updateWalletAddress(address);
      this.contract = new ethers.Contract(
        env.contractAddress,
        contractAbi,
        this.signer
      );

      localStorage.setItem('walletAddress', address);

      await this.switchToHardhat();
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw new Error('Connection To MetaMask Failed');
    }
  }

  async signAuthMessage(
    message: string | UnsignedVoucher,
    useTypedData = false
  ) {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask not found');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      const currentAddress = accounts[0];

      const savedAddress = this.walletAddress.value;
      if (!savedAddress) {
        throw new Error('No wallet connected');
      }

      if (currentAddress.toLowerCase() !== savedAddress.toLowerCase()) {
        throw new Error('MetaMask account does not match logged-in address');
      }

      if (useTypedData && typeof message !== 'string') {
        const provider = new BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        const signature = await signer.signTypedData(
          this.domain,
          this.types,
          message
        );
        return signature;
      } else {
        if (typeof message !== 'string') {
          throw new Error('Message must be a string for personal_sign');
        }

        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, currentAddress],
        });

        return signature;
      }
    } catch (err: any) {
      console.error('Failed to sign message:', err);
      throw new Error('Failed to sign');
    }
  }

  async restoreWalletConnection() {
    const savedAddress = localStorage.getItem('walletAddress');
    if (savedAddress && window.ethereum) {
      await this.connectWallet();
    }
  }

  clearWalletAddress() {
    this.walletAddress.next(null);
  }

  updateWalletAddress(address: string) {
    this.walletAddress.next(address);
  }

  getWalletAddress() {
    return this.walletAddress.value?.toLowerCase();
  }

  weiToEth(wei: string) {
    return ethers.formatEther(wei);
  }

  ethToWei(eth: string) {
    return ethers.parseEther(eth).toString();
  }

  async switchToHardhat() {
    const hardhatChainId = '0x7A69';

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hardhatChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: hardhatChainId,
              chainName: 'Hardhat Local',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
            },
          ],
        });
      } else {
        console.error(switchError);
      }
    }
  }

  async mintVoucher(
    voucher: {
      creator: string;
      uri: string;
      price: string;
      expiry: Date;
      listItem: boolean;
    },
    signature: string
  ) {
    const contract = new ethers.Contract(
      this.domain.verifyingContract,
      contractAbi,
      this.signer
    );

    const price =
      voucher.creator.toLowerCase() === this.getWalletAddress()
        ? 0
        : voucher.price;

    const tx = await contract['lazyMint'](voucher, signature, {
      value: price,
    });

    const receipt = await tx.wait();
    return receipt;
  }
}
