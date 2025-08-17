export interface Nft {
  id: string;
  name: string;
  imageUrl: string;
  hint?: string;
}

export interface Player {
  rank: number;
  address: string;
  score: number;
  characterImageUrl?: string;
}
