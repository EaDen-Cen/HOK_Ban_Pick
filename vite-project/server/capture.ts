import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import type { IncomingMessage } from 'node:http';
import heroes from '../src/components/HeroList.js';
import sharp from 'sharp';

type MatchShape = 'square' | 'circle';

async function features(source: string | Buffer, shape:MatchShape='square') {
  const size=32;
  const pixels: Buffer = await sharp(source).resize(size,size,{fit:'fill'}).toColourspace('srgb').removeAlpha().raw().toBuffer();
  const included:number[]=[];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const dx=(x+.5-size/2)/(size/2);
    const dy=(y+.5-size/2)/(size/2);
    if(shape==='circle' && dx*dx+dy*dy>1) continue;
    const base=(y*size+x)*3;
    included.push(pixels[base],pixels[base+1],pixels[base+2]);
  }
  const mean=included.reduce((sum,n)=>sum+n,0)/Math.max(included.length,1);
  const values:number[]=[];
  for(let y=0;y<size;y++) for(let x=0;x<size;x++) {
    const dx=(x+.5-size/2)/(size/2);
    const dy=(y+.5-size/2)/(size/2);
    const inside=shape!=='circle'||dx*dx+dy*dy<=1;
    const base=(y*size+x)*3;
    for(let channel=0;channel<3;channel++) {
      values.push(inside ? pixels[base+channel]-mean : 0);
    }
  }
  const norm=Math.sqrt(values.reduce((sum,n)=>sum+n*n,0));
  return values.map(n=>n/Math.max(norm,1));
}

async function perceptualFingerprint(source: Buffer, region?: {left:number;top:number;width:number;height:number}) {
  let image=sharp(source);
  if(region) image=image.extract(region);
  const pixels: Buffer = await image.resize(8,8,{fit:'fill'}).greyscale().raw().toBuffer();
  const mean = pixels.reduce((sum,n)=>sum+n,0) / pixels.length;
  let bits = '';
  for (const pixel of pixels) bits += pixel >= mean ? '1' : '0';
  return Array.from({length:16},(_,index)=>parseInt(bits.slice(index*4,index*4+4),2).toString(16)).join('');
}

export async function frameFingerprint(source: Buffer) {
  return perceptualFingerprint(source);
}

export async function frameMeanLuma(source: Buffer) {
  const stats=await sharp(source).greyscale().stats();
  return stats.channels[0]?.mean ?? 0;
}

export async function lockCueFingerprint(source: Buffer) {
  const meta=await sharp(source).metadata();
  const width=meta.width||0, height=meta.height||0;
  if(width<8||height<8) return '';
  // In the live HOK draft UI the locked/confirmed marker sits in the lower-right
  // corner of a Ban portrait. Use a compact cue crop so empty-ban detection does
  // not depend on the hero matcher accidentally returning a low-confidence hero.
  const cueWidth=Math.max(8,Math.floor(width*.42));
  const cueHeight=Math.max(8,Math.floor(height*.42));
  return perceptualFingerprint(source,{
    left:Math.max(0,width-cueWidth),
    top:Math.max(0,height-cueHeight),
    width:cueWidth,
    height:cueHeight,
  });
}

interface VariantSpec { scale:number; dx:number; dy:number }

const primaryVariantSpecs:VariantSpec[]=[
  {scale:1,dx:0,dy:0},
  {scale:.90,dx:0,dy:0},
  {scale:.82,dx:0,dy:0},
  {scale:.74,dx:0,dy:0},
];

const fallbackVariantSpecs:VariantSpec[]=[
  {scale:.82,dx:-.12,dy:0},
  {scale:.82,dx:.12,dy:0},
  {scale:.82,dx:0,dy:-.12},
  {scale:.82,dx:0,dy:.12},
  {scale:.74,dx:-.14,dy:-.08},
  {scale:.74,dx:.14,dy:-.08},
  {scale:.74,dx:-.14,dy:.08},
  {scale:.74,dx:.14,dy:.08},
];

async function captureFeatureVariants(
  source:Buffer,
  specs:VariantSpec[],
  shape:MatchShape='square',
  metadata?:{width?:number;height?:number},
) {
  const meta=metadata??await sharp(source).metadata();
  const width=meta.width||0, height=meta.height||0;
  if(width<8||height<8) return [await features(source,shape)];

  const minSide=Math.min(width,height);
  return await Promise.all(specs.map(async spec=>{
    const side=Math.max(8,Math.min(minSide,Math.floor(minSide*spec.scale)));
    const centerX=width/2 + spec.dx*Math.max(0,width-side);
    const centerY=height/2 + spec.dy*Math.max(0,height-side);
    const left=Math.max(0,Math.min(width-side,Math.round(centerX-side/2)));
    const top=Math.max(0,Math.min(height-side,Math.round(centerY-side/2)));
    const cropped=await sharp(source,{sequentialRead:true})
      .extract({left,top,width:side,height:side})
      .toBuffer();
    return await features(cropped,shape);
  }));
}

let templates: Promise<{heroId:number; square:number[]; circle:number[]}[]> | undefined;
const recognitionCache=new Map<string,{at:number;candidates:Array<{heroId:number;confidence:number}>}>();
const RECOGNITION_CACHE_TTL_MS=1800;
const RECOGNITION_CACHE_MAX=160;

function cacheKey(buffer:Buffer,allowedHeroIds:number[]|undefined,shape:MatchShape) {
  const digest=createHash('sha1').update(buffer).digest('base64url');
  const allowed=allowedHeroIds?.length?[...allowedHeroIds].sort((a,b)=>a-b).join(','):'*';
  return `${shape}:${allowed}:${digest}`;
}

function trimRecognitionCache(now=Date.now()) {
  for(const [key,value] of recognitionCache){
    if(now-value.at>RECOGNITION_CACHE_TTL_MS) recognitionCache.delete(key);
  }
  while(recognitionCache.size>RECOGNITION_CACHE_MAX){
    const first=recognitionCache.keys().next().value as string|undefined;
    if(!first) break;
    recognitionCache.delete(first);
  }
}

function scoreRecognition(
  heroTemplates:Array<{heroId:number;square:number[];circle:number[]}>,
  variants:number[][],
  shape:MatchShape,
) {
  return heroTemplates.map(hero=>{
    let confidence=0;
    const template=shape==='circle'?hero.circle:hero.square;
    for(const values of variants){
      let score=0;
      for(let index=0;index<template.length;index++) score+=template[index]*values[index];
      if(score>confidence) confidence=score;
    }
    return {heroId:hero.heroId,confidence:Math.max(0,Math.min(1,confidence))};
  }).sort((a,b)=>b.confidence-a.confidence);
}

export async function recognizeImage(buffer: Buffer, allowedHeroIds?: number[], shape:MatchShape='square') {
  const key=cacheKey(buffer,allowedHeroIds,shape);
  const now=Date.now();
  const cached=recognitionCache.get(key);
  if(cached&&now-cached.at<=RECOGNITION_CACHE_TTL_MS){
    recognitionCache.delete(key);
    recognitionCache.set(key,cached);
    return cached.candidates.map(candidate=>({...candidate}));
  }

  templates ??= Promise.all(heroes.map(async h=>{
    const source=fileURLToPath(new URL(`../public${h.imageLink}`,import.meta.url));
    const [square,circle]=await Promise.all([features(source,'square'),features(source,'circle')]);
    return {heroId:h.id,square,circle};
  })).catch(error=>{templates=undefined;throw error;});

  const allowed = allowedHeroIds?.length ? new Set(allowedHeroIds) : undefined;
  const heroTemplates=(await templates).filter(hero => !allowed || allowed.has(hero.heroId));
  const metadata=await sharp(buffer,{sequentialRead:true}).metadata();

  // Most well-calibrated slots now match >=85%. Start with centered scale
  // variants only; the offset search is reserved for harder crops.
  const primary=await captureFeatureVariants(buffer,primaryVariantSpecs,shape,metadata);
  let scored=scoreRecognition(heroTemplates,primary,shape);
  const fastAccept=shape==='circle'?.78:.82;
  if((scored[0]?.confidence??0)<fastAccept){
    const fallback=await captureFeatureVariants(buffer,fallbackVariantSpecs,shape,metadata);
    scored=scoreRecognition(heroTemplates,[...primary,...fallback],shape);
  }

  const candidates=scored.slice(0,5);
  recognitionCache.set(key,{at:now,candidates});
  trimRecognitionCache(now);
  return candidates.map(candidate=>({...candidate}));
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
      lockFingerprint: await lockCueFingerprint(buffer),
      meanLuma: await frameMeanLuma(buffer),
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

const clientAnalysisCache=new Map<string,{at:number;fingerprint:string;lockFingerprint:string;meanLuma:number;candidates:Array<{heroId:number;confidence:number}>}>();
const CLIENT_ANALYSIS_TTL_MS=900;
const CLIENT_ANALYSIS_CACHE_MAX=96;

export async function recognizeClientFrame(value: unknown, allowedHeroIds?: unknown, shape:unknown='square') {
  const buffer=decodeClientCapture(value);
  const allowed=Array.isArray(allowedHeroIds)
    ? allowedHeroIds.filter((id):id is number=>Number.isInteger(id)&&heroes.some(hero=>hero.id===id)).slice(0,10)
    : undefined;
  const matchShape:MatchShape=shape==='circle'?'circle':'square';
  const key=cacheKey(buffer,allowed,matchShape);
  const now=Date.now();
  const cached=clientAnalysisCache.get(key);
  if(cached&&now-cached.at<=CLIENT_ANALYSIS_TTL_MS){
    clientAnalysisCache.delete(key);
    clientAnalysisCache.set(key,cached);
    return {
      preview:value as string,
      fingerprint:cached.fingerprint,
      lockFingerprint:cached.lockFingerprint,
      meanLuma:cached.meanLuma,
      candidates:cached.candidates.map(candidate=>({...candidate})),
    };
  }

  const [fingerprint,lockFingerprint,meanLuma,candidates]=await Promise.all([
    frameFingerprint(buffer),
    lockCueFingerprint(buffer),
    frameMeanLuma(buffer),
    recognizeImage(buffer,allowed,matchShape),
  ]);
  const analysis={at:now,fingerprint,lockFingerprint,meanLuma,candidates};
  clientAnalysisCache.set(key,analysis);
  for(const [cacheKey,value] of clientAnalysisCache){
    if(now-value.at>CLIENT_ANALYSIS_TTL_MS) clientAnalysisCache.delete(cacheKey);
  }
  while(clientAnalysisCache.size>CLIENT_ANALYSIS_CACHE_MAX){
    const first=clientAnalysisCache.keys().next().value as string|undefined;
    if(!first) break;
    clientAnalysisCache.delete(first);
  }
  return {
    preview:value as string,
    fingerprint,
    lockFingerprint,
    meanLuma,
    candidates:candidates.map(candidate=>({...candidate})),
  };
}
