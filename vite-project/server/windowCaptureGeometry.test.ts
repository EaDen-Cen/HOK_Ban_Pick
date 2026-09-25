import test from 'node:test';
import assert from 'node:assert/strict';
import {
  defaultNormalizedCaptureRegion,
  normalizeCaptureRegion,
  regionFromDrag,
  regionToPixels,
} from '../src/control/windowCaptureGeometry.js';

test('normalized capture region scales with source resolution',()=>{
  const region={x:.1,y:.2,width:.25,height:.3};
  assert.deepEqual(regionToPixels(region,1920,1080),{x:192,y:216,width:480,height:324});
  assert.deepEqual(regionToPixels(region,1280,720),{x:128,y:144,width:320,height:216});
});

test('drag calibration works in either direction and stays inside the window',()=>{
  const region=regionFromDrag({x:.8,y:.7},{x:.2,y:.1});
  assert.deepEqual(region,{x:.2,y:.1,width:.6000000000000001,height:.6});
  const clamped=normalizeCaptureRegion({x:-.2,y:.95,width:2,height:.5});
  assert.equal(clamped.x,0);
  assert.equal(clamped.y,.95);
  assert.equal(clamped.width,1);
  assert.ok(clamped.height<=.05);
});

test('default region is a valid visible relative crop',()=>{
  const pixels=regionToPixels(defaultNormalizedCaptureRegion,1600,900);
  assert.ok(pixels.width>=32);
  assert.ok(pixels.height>=32);
  assert.ok(pixels.x>=0&&pixels.y>=0);
  assert.ok(pixels.x+pixels.width<=1600);
  assert.ok(pixels.y+pixels.height<=900);
});
