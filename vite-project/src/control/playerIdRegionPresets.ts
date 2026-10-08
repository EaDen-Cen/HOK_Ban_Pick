import { normalizeCaptureRegion, type NormalizedCaptureRegion } from './windowCaptureGeometry.js';

export const PLAYER_ID_REGION_PRESETS_STORAGE='hok-player-id-region-presets-v1';

export type PlayerIdRegionKey =
  | 'blue1' | 'blue2' | 'blue3' | 'blue4' | 'blue5'
  | 'red1' | 'red2' | 'red3' | 'red4' | 'red5';

export type PlayerIdRegions=Partial<Record<PlayerIdRegionKey,NormalizedCaptureRegion>>;

export interface PlayerIdRegionPreset {
  id:string;
  name:string;
  regions:PlayerIdRegions;
  sourceWidth?:number;
  sourceHeight?:number;
  createdAt:number;
  updatedAt:number;
}

export const PLAYER_ID_REGION_KEYS:PlayerIdRegionKey[]=[
  'blue1','blue2','blue3','blue4','blue5',
  'red1','red2','red3','red4','red5',
];

function cloneRegions(regions:PlayerIdRegions):PlayerIdRegions {
  const next:PlayerIdRegions={};
  for(const key of PLAYER_ID_REGION_KEYS) {
    const region=regions[key];
    if(region) next[key]=normalizeCaptureRegion({...region});
  }
  return next;
}

export function readPlayerIdRegionPresets(raw:string|null):PlayerIdRegionPreset[] {
  if(!raw)return [];
  try{
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed))return [];
    return parsed.flatMap((item):PlayerIdRegionPreset[]=>{
      if(!item||typeof item!=='object')return [];
      const id=typeof item.id==='string'?item.id.trim():'';
      const name=typeof item.name==='string'?item.name.trim():'';
      if(!id||!name||!item.regions||typeof item.regions!=='object')return [];
      const regions=cloneRegions(item.regions as PlayerIdRegions);
      if(!Object.keys(regions).length)return [];
      const createdAt=Number.isFinite(item.createdAt)?Number(item.createdAt):Date.now();
      const updatedAt=Number.isFinite(item.updatedAt)?Number(item.updatedAt):createdAt;
      const sourceWidth=Number.isFinite(item.sourceWidth)&&item.sourceWidth>0?Number(item.sourceWidth):undefined;
      const sourceHeight=Number.isFinite(item.sourceHeight)&&item.sourceHeight>0?Number(item.sourceHeight):undefined;
      return [{id,name,regions,sourceWidth,sourceHeight,createdAt,updatedAt}];
    }).sort((a,b)=>b.updatedAt-a.updatedAt);
  }catch{return [];}
}

export function createPlayerIdRegionPreset(input:{
  id:string;
  name:string;
  regions:PlayerIdRegions;
  sourceWidth?:number;
  sourceHeight?:number;
  now?:number;
}):PlayerIdRegionPreset {
  const now=input.now??Date.now();
  return {
    id:input.id,
    name:input.name.trim(),
    regions:cloneRegions(input.regions),
    sourceWidth:input.sourceWidth,
    sourceHeight:input.sourceHeight,
    createdAt:now,
    updatedAt:now,
  };
}

export function updatePlayerIdRegionPreset(
  preset:PlayerIdRegionPreset,
  input:{
    name?:string;
    regions?:PlayerIdRegions;
    sourceWidth?:number;
    sourceHeight?:number;
    now?:number;
  },
):PlayerIdRegionPreset {
  return {
    ...preset,
    name:(input.name??preset.name).trim(),
    regions:input.regions?cloneRegions(input.regions):cloneRegions(preset.regions),
    sourceWidth:input.sourceWidth??preset.sourceWidth,
    sourceHeight:input.sourceHeight??preset.sourceHeight,
    updatedAt:input.now??Date.now(),
  };
}
