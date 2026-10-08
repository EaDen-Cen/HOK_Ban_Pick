export interface Hero {
  id: number;
  englishName: string;
  chineseName: string;
  imageLink: string;
  /**
   * Optional recognition-only portrait/template source. This is deliberately
   * separate from imageLink so a temporary OCR/template-friendly official
   * portrait never leaks into the user-facing hero icon.
   */
  recognitionImageLink?: string;
  /**
   * Optional icon-only crop for temporary portrait sources that are not already
   * authored as square in-game icons. Kept separate from broadcast art crops.
   */
  iconCrop?: { x: number; y: number; scale: number };
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
