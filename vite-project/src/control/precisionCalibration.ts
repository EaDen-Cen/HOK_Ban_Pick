import { captureSlotKeys, type CaptureSlotKey } from './bpCaptureLayout.js';
import { normalizeCaptureRegion, type NormalizedCaptureRegion } from './windowCaptureGeometry.js';

export interface CalibrationDelta {
  dx?:number;
  dy?:number;
  dw?:number;
  dh?:number;
}

export function nudgeCaptureRegion(
  region:NormalizedCaptureRegion,
  sourceWidth:number,
  sourceHeight:number,
  delta:CalibrationDelta,
):NormalizedCaptureRegion {
  const pxX=1/Math.max(1,sourceWidth);
  const pxY=1/Math.max(1,sourceHeight);
  return normalizeCaptureRegion({
    x:region.x+(delta.dx??0)*pxX,
    y:region.y+(delta.dy??0)*pxY,
    width:region.width+(delta.dw??0)*pxX,
    height:region.height+(delta.dh??0)*pxY,
  });
}

export function nextCaptureSlotKey(current:CaptureSlotKey, direction:1|-1=1):CaptureSlotKey {
  const index=captureSlotKeys.indexOf(current);
  const next=(index+direction+captureSlotKeys.length)%captureSlotKeys.length;
  return captureSlotKeys[next];
}
