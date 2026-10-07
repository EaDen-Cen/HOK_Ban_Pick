import test from 'node:test';
import assert from 'node:assert/strict';
import { detectEmptyBan, EMPTY_BAN_GRACE_MS, fingerprintDistance, type EmptyBanStability } from '../src/control/emptyBanDetection.js';

const empty = (): EmptyBanStability => ({ phaseKey:'', fingerprint:'', count:0 });

test('fingerprint distance tolerates small stable-frame changes', () => {
  assert.equal(fingerprintDistance('0000000000000000','0000000000000000'),0);
  assert.equal(fingerprintDistance('0000000000000000','000000000000000f'),4);
});

test('low hero confidence alone can never become an empty ban',()=>{
  let state=empty();
  for(let scan=0;scan<6;scan++){
    const result=detectEmptyBan(state,{
      phaseKey:'1:0:blue:ban',
      isBan:true,
      fingerprint:'0000000000000000',
      topConfidence:.20,
      elapsedMs:EMPTY_BAN_GRACE_MS+5000,
      lockCueDistance:2,
    });
    state=result.stability;
    assert.equal(result.lockCueDetected,false);
    assert.equal(result.suspected,false);
    assert.equal(result.stability.count,0);
  }
});

test('empty ban waits about 4.5 seconds then requires lock cue plus two stable low-confidence frames', () => {
  let state=empty();
  const waiting=detectEmptyBan(state,{
    phaseKey:'1:0:blue:ban',
    isBan:true,
    fingerprint:'0000000000000000',
    topConfidence:.2,
    elapsedMs:EMPTY_BAN_GRACE_MS-1,
    lockCueDistance:20,
  });
  assert.equal(waiting.suspected,false);
  assert.equal(waiting.waitingForGracePeriod,true);
  assert.equal(waiting.stability.count,0);

  state=waiting.stability;
  for (let scan=1; scan<=2; scan++) {
    const result=detectEmptyBan(state,{
      phaseKey:'1:0:blue:ban',
      isBan:true,
      fingerprint:'0000000000000000',
      topConfidence:.35,
      elapsedMs:EMPTY_BAN_GRACE_MS+1000,
      lockCueDistance:20,
    });
    state=result.stability;
    assert.equal(result.lockCueDetected,true);
    assert.equal(result.suspected,scan===2);
  }

  const hero=detectEmptyBan(state,{
    phaseKey:'1:0:blue:ban',
    isBan:true,
    fingerprint:'0000000000000000',
    topConfidence:.8,
    elapsedMs:EMPTY_BAN_GRACE_MS+2000,
    lockCueDistance:20,
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
      lockCueDistance:20,
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
    lockCueDistance:20,
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
    lockCueDistance:20,
  });
  assert.equal(pick.suspected,false);
  assert.equal(pick.waitingForGracePeriod,false);
});


test('35 percent hero-like false match is still eligible for empty Ban after lock cue',()=>{
  let state=empty();
  for(let scan=1;scan<=2;scan++){
    const result=detectEmptyBan(state,{
      phaseKey:'1:10:red:ban',
      isBan:true,
      fingerprint:'1111111111111111',
      topConfidence:.35,
      elapsedMs:EMPTY_BAN_GRACE_MS+500,
      lockCueDistance:18,
    });
    state=result.stability;
    assert.equal(result.suspected,scan===2);
  }
});

test('strong real Ban portrait never becomes an empty Ban',()=>{
  const result=detectEmptyBan(empty(),{
    phaseKey:'1:10:red:ban',
    isBan:true,
    fingerprint:'1111111111111111',
    topConfidence:.82,
    elapsedMs:EMPTY_BAN_GRACE_MS+500,
    lockCueDistance:18,
  });
  assert.equal(result.suspected,false);
  assert.equal(result.stability.count,0);
});
