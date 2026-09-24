import test from 'node:test';
import assert from 'node:assert/strict';
import { detectEmptyBan, fingerprintDistance, type EmptyBanStability } from '../src/control/emptyBanDetection.js';

const empty = (): EmptyBanStability => ({ phaseKey:'', fingerprint:'', count:0 });

test('fingerprint distance tolerates small stable-frame changes', () => {
  assert.equal(fingerprintDistance('0000000000000000','0000000000000000'),0);
  assert.equal(fingerprintDistance('0000000000000000','000000000000000f'),4);
});

test('empty ban requires a ban phase, low confidence and three stable frames', () => {
  let state=empty();
  for (let scan=1; scan<=3; scan++) {
    const result=detectEmptyBan(state,{phaseKey:'1:0:blue:ban',isBan:true,fingerprint:'0000000000000000',topConfidence:.2});
    state=result.stability;
    assert.equal(result.suspected,scan===3);
  }

  const hero=detectEmptyBan(state,{phaseKey:'1:0:blue:ban',isBan:true,fingerprint:'0000000000000000',topConfidence:.7});
  assert.equal(hero.suspected,false);
  assert.equal(hero.stability.count,0);

  const pick=detectEmptyBan(empty(),{phaseKey:'1:4:blue:pick',isBan:false,fingerprint:'0000000000000000',topConfidence:.1});
  assert.equal(pick.suspected,false);
});

test('phase changes reset empty-ban stability', () => {
  const previous:EmptyBanStability={phaseKey:'1:0:blue:ban',fingerprint:'0000000000000000',count:2};
  const result=detectEmptyBan(previous,{phaseKey:'1:1:red:ban',isBan:true,fingerprint:'0000000000000000',topConfidence:.1});
  assert.equal(result.stability.count,1);
  assert.equal(result.suspected,false);
});
