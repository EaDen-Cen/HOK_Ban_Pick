import sharp from 'sharp';
import { createWorker, OEM, PSM, type Worker } from 'tesseract.js';
import { resolve } from 'node:path';
import { existsSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';

const require=createRequire(import.meta.url);
function dirnameOfModel(code:string){
  if(!['eng','chi_sim'].includes(code))throw new Error('Use HOK_OCR_MODEL_DIR for additional languages');
  return resolve(require.resolve(`@tesseract.js-data/${code}/package.json`),'..');
}

export interface PlayerOcrCandidate {
  text:string;
  confidence:number;
  variant:'soft'|'threshold170'|'threshold190';
}

interface DecodedCrop {
  input:Buffer;
  darkBackground:boolean;
}

/** One resident offline worker; ten crops are batched into one OCR page. */
export class PlayerRecognitionProvider {
  readonly id='local-tesseract-player-v2';
  status:'disabled'|'loading'|'ready'|'error'='disabled';
  error='';
  private worker?:Worker;
  private loading?:Promise<void>;
  private busy=false;

  constructor(private modelDirectory?:string,private languages='eng') {}

  prepare() {
    if(this.loading)return this.loading;
    this.status='loading';
    this.loading=(async()=>{
      for(const language of this.languages.split('+')){
        if(!/^[a-z_]+$/.test(language))throw new Error('Invalid OCR language');
        if(!this.modelDirectory)continue;
        if(!existsSync(resolve(this.modelDirectory,`${language}.traineddata`)))throw new Error(`Missing local OCR model: ${language}.traineddata`);
      }
      const staging=this.modelDirectory?undefined:mkdtempSync(resolve(tmpdir(),'hok-ocr-'));
      try{
        if(staging)for(const code of this.languages.split('+')){
          copyFileSync(resolve(dirnameOfModel(code),'4.0.0_best_int',`${code}.traineddata.gz`),resolve(staging,`${code}.traineddata.gz`));
        }
        this.worker=await createWorker(this.languages,OEM.LSTM_ONLY,{
          langPath:resolve(this.modelDirectory||staging!),
          gzip:!this.modelDirectory,
          cacheMethod:'none',
          errorHandler:()=>{},
        });
      }finally{
        if(staging)rmSync(staging,{recursive:true,force:true});
      }
      await this.worker.setParameters({
        tessedit_pageseg_mode:PSM.SINGLE_BLOCK,
        preserve_interword_spaces:'1',
        user_defined_dpi:'150',
      });
      this.status='ready';
    })().catch(error=>{
      this.status='error';
      this.error=error instanceof Error?error.message:'OCR unavailable';
    });
    return this.loading;
  }

  private validate(images:unknown) {
    if(this.status!=='ready'||!this.worker)throw new Error('OCR provider is not ready');
    if(this.busy)throw new Error('OCR is busy');
    if(
      !Array.isArray(images)||
      images.length!==10||
      images.some(image=>typeof image!=='string'||image.length>180000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(image))
    )throw new Error('Ten small ID crops required');
    return images as string[];
  }

  private async decode(images:string[]):Promise<DecodedCrop[]> {
    return Promise.all(images.map(async image=>{
      const input=Buffer.from(image.split(',')[1],'base64');
      const meta=await sharp(input,{limitInputPixels:1000000}).metadata();
      if(!meta.width||!meta.height||meta.width>2048||meta.height>512)throw new Error('ID crop too large');
      const stats=await sharp(input)
        .flatten({background:'#fff'})
        .greyscale()
        .normalize()
        .stats();
      return {input,darkBackground:(stats.channels[0]?.mean??255)<135};
    }));
  }

  private async prepareDefault(crop:DecodedCrop,width:number) {
    const flattened=sharp(crop.input).flatten({background:'#fff'});
    const prepared=crop.darkBackground
      ? flattened.clone()
        .resize(width-32,40,{fit:'contain',background:'#000'})
        .greyscale()
        .normalize()
        .threshold(150)
        .negate({alpha:false})
      : flattened.clone()
        .resize(width-32,40,{fit:'contain',background:'#fff'})
        .greyscale()
        .normalize();
    return prepared.png().toBuffer();
  }

  private async preparePlayerVariant(
    crop:DecodedCrop,
    width:number,
    variant:PlayerOcrCandidate['variant'],
  ) {
    if(!crop.darkBackground)return sharp(crop.input)
      .flatten({background:'#fff'})
      .resize(width-32,40,{fit:'contain',background:'#fff'})
      .greyscale()
      .normalize()
      .png()
      .toBuffer();

    const base=sharp(crop.input)
      .flatten({background:'#000'})
      .resize(width-32,40,{fit:'contain',background:'#000'})
      .greyscale()
      .normalize();

    if(variant==='soft')return base
      .clone()
      .negate({alpha:false})
      .png()
      .toBuffer();

    const threshold=variant==='threshold170'?170:190;
    return base
      .clone()
      .threshold(threshold)
      .negate({alpha:false})
      .png()
      .toBuffer();
  }

  private async readPage(crops:Buffer[],rowHeight=64) {
    const width=640;
    const page=await sharp({
      create:{width,height:rowHeight*crops.length,channels:3,background:'#fff'},
    })
      .composite(crops.map((input,index)=>({input,left:16,top:index*rowHeight+12})))
      .png()
      .toBuffer();
    const result=await this.worker!.recognize(page,{}, {text:true,blocks:true});
    const texts=Array<string>(crops.length).fill('');
    const confidences=Array<number>(crops.length).fill(0);
    for(const block of result.data.blocks??[]){
      for(const paragraph of block.paragraphs){
        for(const line of paragraph.lines){
          const row=Math.floor((line.bbox.y0+line.bbox.y1)/2/rowHeight);
          if(row<0||row>=crops.length)continue;
          texts[row]+=(texts[row]?' ':'')+line.text.trim();
          confidences[row]=Math.max(confidences[row],line.confidence/100);
        }
      }
    }
    return {texts,confidences};
  }

  async recognize(images:unknown) {
    const source=this.validate(images);
    this.busy=true;
    const start=performance.now();
    try{
      const decoded=await this.decode(source);
      const crops=await Promise.all(decoded.map(crop=>this.prepareDefault(crop,640)));
      const result=await this.readPage(crops);
      return {...result,elapsedMs:performance.now()-start};
    }finally{
      this.busy=false;
    }
  }

  /**
   * Player IDs use a stylized light-on-dark esports font. Keep anti-aliased
   * strokes once and also try two high-contrast thresholds in the same OCR
   * page. The roster matcher chooses which candidate is actually useful.
   */
  async recognizePlayerIds(images:unknown) {
    const source=this.validate(images);
    this.busy=true;
    const start=performance.now();
    try{
      const decoded=await this.decode(source);
      const variants:PlayerOcrCandidate['variant'][]=['soft','threshold170','threshold190'];
      const crops:Buffer[]=[];
      for(const variant of variants){
        crops.push(...await Promise.all(decoded.map(crop=>this.preparePlayerVariant(crop,640,variant))));
      }
      const result=await this.readPage(crops);
      const candidates=Array.from({length:10},()=>[] as PlayerOcrCandidate[]);
      for(let variantIndex=0;variantIndex<variants.length;variantIndex++){
        for(let slot=0;slot<10;slot++){
          const index=variantIndex*10+slot;
          const text=result.texts[index]?.trim()||'';
          if(!text)continue;
          candidates[slot].push({
            text,
            confidence:result.confidences[index]??0,
            variant:variants[variantIndex],
          });
        }
      }
      const texts=Array<string>(10).fill('');
      const confidences=Array<number>(10).fill(0);
      for(let slot=0;slot<10;slot++){
        const best=[...candidates[slot]].sort((a,b)=>b.confidence-a.confidence)[0];
        if(!best)continue;
        texts[slot]=best.text;
        confidences[slot]=best.confidence;
      }
      return {
        texts,
        confidences,
        candidates,
        elapsedMs:performance.now()-start,
      };
    }finally{
      this.busy=false;
    }
  }

  async close(){
    await this.worker?.terminate();
  }
}
