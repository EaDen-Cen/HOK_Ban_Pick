import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage } from 'node:http';
import heroes from '../src/components/HeroList.js';
import sharp from 'sharp';

async function features(source: string | Buffer) {
  const pixels: Buffer = await sharp(source).resize(32,32,{fit:'fill'}).toColourspace('srgb').removeAlpha().raw().toBuffer();
  const mean=pixels.reduce((sum,n)=>sum+n,0)/pixels.length;
  const values=Array.from(pixels,n=>n-mean), norm=Math.sqrt(values.reduce((sum,n)=>sum+n*n,0));
  return values.map(n=>n/Math.max(norm,1));
}
let templates: Promise<{heroId:number; values:number[]}[]> | undefined;
export async function recognizeImage(buffer: Buffer) {
  templates ??= Promise.all(heroes.map(async h=>({heroId:h.id,values:await features(fileURLToPath(new URL(`../public${h.imageLink}`,import.meta.url)))}))).catch(error=>{templates=undefined;throw error;});
  const values=await features(buffer);
  return (await templates).map(h=>({heroId:h.heroId,confidence:Math.max(0,Math.min(1,h.values.reduce((sum,n,i)=>sum+n*values[i],0)))})).sort((a,b)=>b.confidence-a.confidence).slice(0,3);
}

export function localCaptureRequest(req: Pick<IncomingMessage, 'headers' | 'socket'>) {
  const address = req.socket.remoteAddress;
  if (!['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address || '')) return false;
  if (Object.keys(req.headers).some(key => /^(forwarded|x-forwarded-|cf-)/.test(key))) return false;
  try {
    const host = new URL(`http://${req.headers.host}`).hostname;
    if (!['localhost', '127.0.0.1', '[::1]'].includes(host)) return false;
    return !req.headers.origin || new URL(req.headers.origin).host === req.headers.host;
  } catch { return false; }
}
export function captureRegion(value: unknown): { x: number; y: number; width: number; height: number } {
  const r = value as Record<string, number> | null;
  if (!r || !['x','y','width','height'].every(k => Number.isInteger(r[k])) || Math.abs(r.x) > 32768 || Math.abs(r.y) > 32768 || r.width < 32 || r.height < 32 || r.width > 1200 || r.height > 1200) throw new Error('Invalid capture region');
  return { x:r.x, y:r.y, width:r.width, height:r.height };
}
let busy = false;
export async function recognizeScreen(region: ReturnType<typeof captureRegion>) {
  if (busy) throw new Error('Capture busy');
  busy = true;
  try {
    const frame = await new Promise<{ preview:string }>((resolve, reject) => {
      const child = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('../scripts/capture/recognize.ps1', import.meta.url))], { timeout:20000, maxBuffer:4*1024*1024, windowsHide:true }, (error, stdout) => {
        if (error) { reject(new Error('Screen capture failed. Check the visible Windows desktop and region.')); return; }
        try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Invalid capture result')); }
      });
      child.stdin?.end(JSON.stringify({ region }));
    });
    return {preview:frame.preview, candidates:await recognizeImage(Buffer.from(frame.preview.split(',')[1],'base64'))};
  } finally { busy = false; }
}
