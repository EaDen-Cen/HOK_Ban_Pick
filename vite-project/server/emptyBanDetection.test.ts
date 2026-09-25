import test from 'node:test';
import assert from 'node:assert/strict';
import { detectEmptyBan, EMPTY_BAN_GRACE_MS, fingerprintDistance, type EmptyBanStability } from '../src/control/emptyBanDetection.js';

const empty = (): EmptyBanStability => ({ phaseKey:'', fingerprint:'', count:0 });

test('fingerprint distance tolerates small stable-frame changes', () => {
  assert.equal(fingerprintDistance('0000000000000000','0000000000000000'),0);
  assert.equal(fingerprintDistance('0000000000000000','000000000000000f'),4);
});

test('empty ban waits through grace period, then requires three stable low-confidence frames', () => {
  let state=empty();
  const waiting=detectEmptyBan(state,{
    phaseKey:'1:0:blue:ban',
    isBan:true,
    fingerprint:'0000000000000000',
    topConfidence:.2,
    elapsedMs:EMPTY_BAN_GRACE_MS-1,
  });
  assert.equal(waiting.suspected,false);
  assert.equal(waiting.waitingForGracePeriod,true);
  assert.equal(waiting.stability.count,0);

  state=waiting.stability;
  for (let scan=1; scan<=3; scan++) {
    const result=detectEmptyBan(state,{
      phaseKey:'1:0:blue:ban',
      isBan:true,
      fingerprint:'0000000000000000',
      topConfidence:.2,
      elapsedMs:EMPTY_BAN_GRACE_MS+1000,
    });
    state=result.stability;
    assert.equal(result.suspected,scan===3);
  }

  const hero=detectEmptyBan(state,{
    phaseKey:'1:0:blue:ban',
    isBan:true,
    fingerprint:'0000000000000000',
    topConfidence:.7,
    elapsedMs:EMPTY_BAN_GRACE_MS+2000,
  });
  assert.equal(hero.suspected,false);
  assert.equal(hero.stability.count,0);
});

test('empty-ban prompt can be suppressed for the rest of a phase without affecting later phases', () => {
  const suppressed=detectEmptyBan(
    {phaseKey:'1:0:blue:ban',fingerprint:'0000000000000000',count:9},
    {
      phaseKey:'1:0:blue:ban',
      isBan:true,
      fingerprint:'0000000000000000',
      topConfidence:.1,
      elapsedMs:30000,
      suppressed:true,
    },
  );
  assert.equal(suppressed.suspected,false);
  assert.equal(suppressed.stability.count,0);

  const next=detectEmptyBan(suppressed.stability,{
    phaseKey:'1:1:red:ban',
    isBan:true,
    fingerprint:'0000000000000000',
    topConfidence:.1,
    elapsedMs:30000,
  });
  assert.equal(next.stability.count,1);
  assert.equal(next.suspected,false);
});

test('pick phases never trigger empty-ban detection', () => {
  const pick=detectEmptyBan(empty(),{
    phaseKey:'1:4:blue:pick',
    isBan:false,
    fingerprint:'0000000000000000',
    topConfidence:.1,
    elapsedMs:30000,
  });
  assert.equal(pick.suspected,false);
  assert.equal(pick.waitingForGracePeriod,false);
});
