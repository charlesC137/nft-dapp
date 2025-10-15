export interface UnsignedVoucher {
  creator: string;
  price: string;
  image: string;
}

export interface SignedVoucher extends UnsignedVoucher {
  signature: string;
  name: string;
  categories: string[];
  description: string;
  isListed: boolean;
}

export interface Voucher {
  _id: string;
  creator: string;
  owner: string;
  uri: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    categories: [string];
    createdAt: Date;
    //attributes: [{ trait_type: string; value: string }];
    itemId: string;
  };
  price: string;
  signature: string;
  isListed: boolean;
  createdAt: Date;
  modifiedAt: Date;
  expiry: Date;
}

export interface NFT {
  _id: string;
  tokenId: number;
  creator: string;
  owner: string;
  uri: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    categories: [string];
    createdAt: Date;
    //attributes: [{ trait_type: string; value: string }];
    itemId: string;
  };
  price: string;
  isListed: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface Category {
  value: string;
  icon: string;
}

export interface User {
  walletAddress: string;
  avatarUrl: string;
  bio: string;
  private: boolean;
  username: string;
  ownedNFTs: string[];
  bookmarkedNFTs: string[];
}
