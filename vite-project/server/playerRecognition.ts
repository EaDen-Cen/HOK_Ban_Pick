import sharp from 'sharp';
import { createWorker, OEM, PSM, type Worker } from 'tesseract.js';
import { resolve } from 'node:path';
import { existsSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
const require=createRequire(import.meta.url);
function dirnameOfModel(code:string){if(!['eng','chi_sim'].includes(code))throw new Error('Use HOK_OCR_MODEL_DIR for additional languages');return resolve(require.resolve(`@tesseract.js-data/${code}/package.json`),'..');}

/** One resident offline worker; ten crops are batched into one OCR page. */
export class PlayerRecognitionProvider {
  readonly id = 'local-tesseract-player-v1';
  status: 'disabled' | 'loading' | 'ready' | 'error' = 'disabled';
  error = '';
  private worker?: Worker;
  private loading?: Promise<void>;
  private busy = false;
  constructor(private modelDirectory?: string, private languages = 'eng') {}
  prepare() {
    if (this.loading) return this.loading;
    this.status='loading';
    this.loading=(async()=>{
      for (const language of this.languages.split('+')) {
        if(!/^[a-z_]+$/.test(language))throw new Error('Invalid OCR language');
        if(!this.modelDirectory)continue;
        if (!existsSync(resolve(this.modelDirectory!,`${language}.traineddata`))) throw new Error(`Missing local OCR model: ${language}.traineddata`);
      }
      const staging=this.modelDirectory?undefined:mkdtempSync(resolve(tmpdir(),'hok-ocr-'));
      try {
        if(staging)for(const code of this.languages.split('+'))copyFileSync(resolve(dirnameOfModel(code),'4.0.0_best_int',`${code}.traineddata.gz`),resolve(staging,`${code}.traineddata.gz`));
        this.worker=await createWorker(this.languages,OEM.LSTM_ONLY,{langPath:resolve(this.modelDirectory||staging!),gzip:!this.modelDirectory,cacheMethod:'none',errorHandler:()=>{}});
      } finally {if(staging)rmSync(staging,{recursive:true,force:true});}
      await this.worker.setParameters({tessedit_pageseg_mode:PSM.SINGLE_BLOCK,preserve_interword_spaces:'1',user_defined_dpi:'150'});
      this.status='ready';
    })().catch(error=>{this.status='error';this.error=error instanceof Error?error.message:'OCR unavailable';});
    return this.loading;
  }
  async recognize(images: unknown) {
    if (this.status!=='ready' || !this.worker) throw new Error('OCR provider is not ready');
    if (this.busy) throw new Error('OCR is busy');
    if (!Array.isArray(images) || images.length!==10 || images.some(image=>typeof image!=='string' || image.length>180000 || !/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(image))) throw new Error('Ten small ID crops required');
    this.busy=true;
    const start=performance.now();
    try {
      const width=640, rowHeight=64;
      const crops:Buffer[]=await Promise.all((images as string[]).map(async(image:string)=>{
        const input=Buffer.from(image.split(',')[1],'base64');
        const meta=await sharp(input,{limitInputPixels:1000000}).metadata();
        if (!meta.width || !meta.height || meta.width>2048 || meta.height>512) throw new Error('ID crop too large');

        // Preserve the proven light-background pipeline exactly. For HOK's
        // normal dark UI, only flip polarity before the same final resize so
        // Tesseract receives dark glyphs on a light field.
        const flattened=sharp(input).flatten({background:'#fff'});
        const stats=await flattened.clone().greyscale().normalize().stats();
        const darkBackground=(stats.channels[0]?.mean??255)<135;
        const prepared=darkBackground
          ? flattened.clone().greyscale().normalize().negate().resize(width-32,40,{fit:'contain',background:'#fff'})
          : flattened.clone().resize(width-32,40,{fit:'contain',background:'#fff'}).greyscale().normalize();
        return prepared.png().toBuffer();
      }));
      const page=await sharp({create:{width,height:rowHeight*10,channels:3,background:'#fff'}})
        .composite(crops.map((input,i)=>({input,left:16,top:i*rowHeight+12})))
        .png()
        .toBuffer();
      const result=await this.worker.recognize(page,{}, {text:true,blocks:true});
      const texts=Array<string>(10).fill(''), confidences=Array<number>(10).fill(0);
      for (const block of result.data.blocks??[]) for (const paragraph of block.paragraphs) for (const line of paragraph.lines) {
        const row=Math.floor((line.bbox.y0+line.bbox.y1)/2/rowHeight);
        if (row<0 || row>=10) continue;
        texts[row]+=(texts[row]?' ':'')+line.text.trim();
        confidences[row]=Math.max(confidences[row],line.confidence/100);
      }
      return {texts,confidences,elapsedMs:performance.now()-start};
    } finally {this.busy=false;}
  }
  async close() { await this.worker?.terminate(); }
}
