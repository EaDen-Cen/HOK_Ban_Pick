export interface Hero {
  id: number;
  englishName: string;
  chineseName: string;
  imageLink: string;
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
