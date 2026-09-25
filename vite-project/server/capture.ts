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
export async function frameFingerprint(source: Buffer) {
  const pixels: Buffer = await sharp(source).resize(8,8,{fit:'fill'}).greyscale().raw().toBuffer();
  const mean = pixels.reduce((sum,n)=>sum+n,0) / pixels.length;
  let bits = '';
  for (const pixel of pixels) bits += pixel >= mean ? '1' : '0';
  return Array.from({length:16},(_,index)=>parseInt(bits.slice(index*4,index*4+4),2).toString(16)).join('');
}
let templates: Promise<{heroId:number; values:number[]}[]> | undefined;
export async function recognizeImage(buffer: Buffer, allowedHeroIds?: number[]) {
  templates ??= Promise.all(heroes.map(async h=>({heroId:h.id,values:await features(fileURLToPath(new URL(`../public${h.imageLink}`,import.meta.url)))}))).catch(error=>{templates=undefined;throw error;});
  const values=await features(buffer);
  const allowed = allowedHeroIds?.length ? new Set(allowedHeroIds) : undefined;
  return (await templates)
    .filter(hero => !allowed || allowed.has(hero.heroId))
    .map(h=>({heroId:h.heroId,confidence:Math.max(0,Math.min(1,h.values.reduce((sum,n,i)=>sum+n*values[i],0))) }))
    .sort((a,b)=>b.confidence-a.confidence)
    .slice(0,3);
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
export function captureRegions(value: unknown) {
  if (!Array.isArray(value) || value.length !== 10) throw new Error('Invalid lineup regions');
  return value.map(captureRegion);
}
let busy = false;
async function captureWindows(input: object) {
  return await new Promise<{ preview?: string; previews?: string[] }>((resolve, reject) => {
    const child = execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', fileURLToPath(new URL('../scripts/capture/recognize.ps1', import.meta.url))], { timeout:20000, maxBuffer:20*1024*1024, windowsHide:true }, (error, stdout) => {
      if (error) { reject(new Error('Screen capture failed. Check the visible Windows desktop and region.')); return; }
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error('Invalid capture result')); }
    });
    child.stdin?.end(JSON.stringify(input));
  });
}
export async function recognizeScreen(region: ReturnType<typeof captureRegion>) {
  if (busy) throw new Error('Capture busy');
  busy = true;
  try {
    const frame = await captureWindows({ region });
    if (!frame.preview) throw new Error('Invalid capture result');
    const buffer = Buffer.from(frame.preview.split(',')[1],'base64');
    return {
      preview: frame.preview,
      fingerprint: await frameFingerprint(buffer),
      candidates: await recognizeImage(buffer),
    };
  } finally { busy = false; }
}

export async function recognizeLineup(
  regions: ReturnType<typeof captureRegions>,
  allowedHeroIdsBySlot: number[][],
) {
  if (busy) throw new Error('Capture busy');
  if (allowedHeroIdsBySlot.length !== regions.length) throw new Error('Invalid lineup candidates');
  busy = true;
  try {
    const frame = await captureWindows({ regions });
    if (!frame.previews || frame.previews.length !== regions.length) throw new Error('Invalid capture result');
    return await Promise.all(frame.previews.map(async (preview, index) => ({
      preview,
      candidates: await recognizeImage(Buffer.from(preview.split(',')[1], 'base64'), allowedHeroIdsBySlot[index]),
    })));
  } finally { busy = false; }
}


export function decodeClientCapture(value: unknown) {
  if (typeof value !== 'string') throw new Error('Invalid client capture');
  const match=value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/);
  if(!match) throw new Error('Invalid client capture');
  const buffer=Buffer.from(match[2],'base64');
  if(!buffer.length||buffer.length>3*1024*1024) throw new Error('Invalid client capture');
  return buffer;
}

export async function recognizeClientFrame(value: unknown) {
  const buffer=decodeClientCapture(value);
  return {
    preview:value as string,
    fingerprint:await frameFingerprint(buffer),
    candidates:await recognizeImage(buffer),
  };
}
