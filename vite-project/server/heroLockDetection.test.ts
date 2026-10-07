import test from 'node:test';
import assert from 'node:assert/strict';
import {
  freshHeroLockStability,
  updateHeroLockStability,
} from '../src/control/heroLockDetection.js';

test('hero lock detector learns preselect baseline and waits for persistent lock cue change',()=>{
  const phaseKey='1:4:blue:pick';
  let stability=freshHeroLockStability();

  let result=updateHeroLockStability(stability,{
    phaseKey,
    heroId:12,
    lockFingerprint:'0000000000000000',
    stabilityCount:1,
    requiredScans:2,
  });
  stability=result.stability;
  assert.equal(result.locked,false);

  result=updateHeroLockStability(stability,{
    phaseKey,
    heroId:12,
    lockFingerprint:'0000000000000000',
    stabilityCount:2,
    requiredScans:2,
  });
  stability=result.stability;
  assert.equal(result.locked,false);
  assert.equal(result.stability.baseline,'0000000000000000');

  result=updateHeroLockStability(stability,{
    phaseKey,
    heroId:12,
    lockFingerprint:'ffffffffffffffff',
    stabilityCount:3,
    requiredScans:2,
  });
  stability=result.stability;
  assert.equal(result.locked,false);
  assert.equal(result.stability.count,1);

  result=updateHeroLockStability(stability,{
    phaseKey,
    heroId:12,
    lockFingerprint:'ffffffffffffffff',
    stabilityCount:4,
    requiredScans:2,
  });
  assert.equal(result.locked,true);
});

test('hero lock detector resets baseline when the preselected hero changes',()=>{
  const phaseKey='1:4:blue:pick';
  let result=updateHeroLockStability(freshHeroLockStability(),{
    phaseKey,
    heroId:12,
    lockFingerprint:'0000000000000000',
    stabilityCount:2,
    requiredScans:2,
  });

  result=updateHeroLockStability(result.stability,{
    phaseKey,
    heroId:27,
    lockFingerprint:'ffffffffffffffff',
    stabilityCount:1,
    requiredScans:2,
  });
  assert.equal(result.locked,false);
  assert.equal(result.stability.heroId,27);
  assert.equal(result.stability.baseline,'ffffffffffffffff');
  assert.equal(result.stability.count,0);
});
