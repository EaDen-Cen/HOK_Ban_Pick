import test from 'node:test';
import assert from 'node:assert/strict';
import { captureTargetForState, defaultCaptureZones, slotInsideZone } from '../src/control/bpCaptureLayout.js';

test('match BP maps current phase to the correct team/action slot',()=>{
  const base={draftMode:'match' as const,firstPickSide:'blue' as const,currentPhase:0};
  const first=captureTargetForState(base,defaultCaptureZones)!;
  assert.equal(first.key,'blueBan');
  assert.equal(first.slotIndex,0);
  assert.equal(first.slotCount,4);

  const redSecond=captureTargetForState({...base,currentPhase:1},defaultCaptureZones)!;
  assert.equal(redSecond.key,'redBan');
  assert.equal(redSecond.slotIndex,0);

  const firstPick=captureTargetForState({...base,currentPhase:4},defaultCaptureZones)!;
  assert.equal(firstPick.key,'bluePick');
  assert.equal(firstPick.slotIndex,0);
  assert.equal(firstPick.slotCount,5);

  const redPick2=captureTargetForState({...base,currentPhase:6},defaultCaptureZones)!;
  assert.equal(redPick2.key,'redPick');
  assert.equal(redPick2.slotIndex,1);
});

test('red first-pick swaps capture sides but preserves per-side slot counts',()=>{
  const state={draftMode:'match' as const,firstPickSide:'red' as const,currentPhase:0};
  const first=captureTargetForState(state,defaultCaptureZones)!;
  assert.equal(first.key,'redBan');
  const firstPick=captureTargetForState({...state,currentPhase:4},defaultCaptureZones)!;
  assert.equal(firstPick.key,'redPick');
  assert.equal(firstPick.slotIndex,0);
});

test('Pick columns split vertically and Ban rows split horizontally',()=>{
  const zone={x:.1,y:.2,width:.5,height:.6};
  const pick0=slotInsideZone(zone,'pick',0,5);
  const pick4=slotInsideZone(zone,'pick',4,5);
  assert.ok(pick4.y>pick0.y);
  assert.ok(Math.abs(pick0.x-pick4.x)<1e-9);

  const ban0=slotInsideZone(zone,'ban',0,4);
  const ban3=slotInsideZone(zone,'ban',3,4);
  assert.ok(ban3.x>ban0.x);
  assert.ok(Math.abs(ban0.y-ban3.y)<1e-9);
});
