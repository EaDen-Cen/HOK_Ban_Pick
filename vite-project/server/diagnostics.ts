import { appendFileSync, existsSync, mkdirSync, renameSync, rmSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
/** Bounded local operational log. Never record request bodies, tokens, IDs or OCR text. */
export class Diagnostics {
  constructor(private directory:string){}
  record(event:string,details:Record<string,string|number|boolean>={}){
    try{
      mkdirSync(this.directory,{recursive:true});const file=resolve(this.directory,'operations.jsonl');
      if(existsSync(file)&&statSync(file).size>1024*1024){const old=file+'.1';rmSync(old,{force:true});renameSync(file,old);}
      appendFileSync(file,JSON.stringify({time:new Date().toISOString(),event,...details})+'\n',{mode:0o600});
    }catch{/* diagnostics must not stop a live broadcast */}
  }
}
