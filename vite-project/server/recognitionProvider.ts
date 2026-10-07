/** Versioned boundary for a future local or remote AI recognizer. */
export interface RecognitionRequest {
  image: string;
  allowedHeroIds?: number[];
  shape?: 'square' | 'circle';
}
export interface RecognitionEvidence {
  preview: string;
  fingerprint: string;
  lockFingerprint: string;
  meanLuma: number;
  candidates: {heroId:number;confidence:number}[];
}
export interface HeroRecognitionProvider {
  readonly id: string;
  recognize(request: RecognitionRequest): Promise<RecognitionEvidence>;
}
