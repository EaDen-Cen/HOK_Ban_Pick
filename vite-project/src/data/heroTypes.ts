export interface Hero {
  id: number;
  englishName: string;
  chineseName: string;
  imageLink: string;
  /** High-resolution character/key art used by flexible broadcast cards. Falls back to imageLink. */
  artLink?: string;
  /** Optional CSS object-position override for unusual compositions. */
  artPosition?: string;
  /** Global/live release date in ISO YYYY-MM-DD format when verified. */
  releaseDate?: string;
  /** Official HOK ranked pick rate percentage when available, e.g. 12.34 means 12.34%. */
  officialPickRate?: number;
  /** Source-data timestamp for officialPickRate. */
  officialPickRateUpdatedAt?: string;
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
