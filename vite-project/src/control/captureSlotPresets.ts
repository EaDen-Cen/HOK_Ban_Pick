import { normalizeCaptureSlots, type CaptureSlots } from './bpCaptureLayout.js';

export const CAPTURE_PRESETS_STORAGE='hok-window-capture-presets-v1';

export interface CaptureSlotPreset {
  id:string;
  name:string;
  slots:CaptureSlots;
  sourceWidth?:number;
  sourceHeight?:number;
  createdAt:number;
  updatedAt:number;
}

export function cloneCaptureSlots(slots:CaptureSlots):CaptureSlots {
  return normalizeCaptureSlots(JSON.parse(JSON.stringify(slots)) as CaptureSlots);
}

export function readCaptureSlotPresets(raw:string|null):CaptureSlotPreset[] {
  if(!raw) return [];
  try {
    const parsed=JSON.parse(raw);
    if(!Array.isArray(parsed)) return [];
    return parsed.flatMap((item):CaptureSlotPreset[]=>{
      if(!item||typeof item!=='object') return [];
      const name=typeof item.name==='string'?item.name.trim():'';
      const id=typeof item.id==='string'?item.id.trim():'';
      if(!name||!id||!item.slots||typeof item.slots!=='object') return [];
      const createdAt=Number.isFinite(item.createdAt)?Number(item.createdAt):Date.now();
      const updatedAt=Number.isFinite(item.updatedAt)?Number(item.updatedAt):createdAt;
      const sourceWidth=Number.isFinite(item.sourceWidth)&&item.sourceWidth>0?Number(item.sourceWidth):undefined;
      const sourceHeight=Number.isFinite(item.sourceHeight)&&item.sourceHeight>0?Number(item.sourceHeight):undefined;
      return [{
        id,
        name,
        slots:normalizeCaptureSlots(item.slots),
        sourceWidth,
        sourceHeight,
        createdAt,
        updatedAt,
      }];
    }).sort((a,b)=>b.updatedAt-a.updatedAt);
  } catch {
    return [];
  }
}

export function createCaptureSlotPreset(input:{
  id:string;
  name:string;
  slots:CaptureSlots;
  sourceWidth?:number;
  sourceHeight?:number;
  now?:number;
}):CaptureSlotPreset {
  const now=input.now??Date.now();
  return {
    id:input.id,
    name:input.name.trim(),
    slots:cloneCaptureSlots(input.slots),
    sourceWidth:input.sourceWidth,
    sourceHeight:input.sourceHeight,
    createdAt:now,
    updatedAt:now,
  };
}

export function updateCaptureSlotPreset(
  preset:CaptureSlotPreset,
  input:{name?:string;slots?:CaptureSlots;sourceWidth?:number;sourceHeight?:number;now?:number},
):CaptureSlotPreset {
  return {
    ...preset,
    name:(input.name??preset.name).trim(),
    slots:input.slots?cloneCaptureSlots(input.slots):cloneCaptureSlots(preset.slots),
    sourceWidth:input.sourceWidth??preset.sourceWidth,
    sourceHeight:input.sourceHeight??preset.sourceHeight,
    updatedAt:input.now??Date.now(),
  };
}
