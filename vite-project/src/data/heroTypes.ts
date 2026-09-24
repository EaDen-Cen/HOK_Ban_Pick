export interface Hero {
  id: number;
  englishName: string;
  chineseName: string;
  imageLink: string;
  /** High-resolution character/key art used by flexible broadcast cards. Falls back to imageLink. */
  artLink?: string;
  /** Optional CSS object-position override for unusual compositions. */
  artPosition?: string;
  occupation: string;
  altOccupation?: string;
  aliases?: string[];
  combo?: number[];
  counter?: number[];
  beCountered?: number[];
  campId?: number;
  variantGroup?: 'flowborn';
  crossover?: 'aov';
  relationshipStatus?: 'unverified';
}
