import test from 'node:test';
import assert from 'node:assert/strict';
import { freshPickSlotActivationState, updatePickSlotActivation } from '../src/control/pickSlotActivation.js';

test('empty-slot hero-like matches cannot activate the next opponent Pick',()=>{
  const phaseKey='1:4:blue:pick';
  const slotKey='redPick1';
  let state=freshPickSlotActivationState();

  let result=updatePickSlotActivation(state,{
    phaseKey,slotKey,fingerprint:'0000000000000000',heroId:12,confidence:.81,
  });
  state=result.state;
  assert.equal(result.active,false);

  result=updatePickSlotActivation(state,{
    phaseKey,slotKey,fingerprint:'0000000000000001',heroId:12,confidence:.83,
  });
  assert.equal(result.active,false);
  assert.equal(result.state.count,0);
});

test('next opponent Pick activates only after a visible slot change and repeated strong hero',()=>{
  const phaseKey='1:4:blue:pick';
  const slotKey='redPick1';
  let result=updatePickSlotActivation(freshPickSlotActivationState(),{
    phaseKey,slotKey,fingerprint:'0000000000000000',
  });

  result=updatePickSlotActivation(result.state,{
    phaseKey,slotKey,fingerprint:'ffffffffffffffff',heroId:27,confidence:.86,
  });
  assert.equal(result.active,false);
  assert.equal(result.state.count,1);

  result=updatePickSlotActivation(result.state,{
    phaseKey,slotKey,fingerprint:'ffffffffffffffff',heroId:27,confidence:.88,
  });
  assert.equal(result.active,true);
});

test('weak or changing hero candidates do not activate the probe',()=>{
  const phaseKey='1:5:red:pick';
  const slotKey='bluePick2';
  let result=updatePickSlotActivation(freshPickSlotActivationState(),{
    phaseKey,slotKey,fingerprint:'0000000000000000',
  });
  result=updatePickSlotActivation(result.state,{
    phaseKey,slotKey,fingerprint:'ffffffffffffffff',heroId:5,confidence:.6,
  });
  assert.equal(result.active,false);
  result=updatePickSlotActivation(result.state,{
    phaseKey,slotKey,fingerprint:'ffffffffffffffff',heroId:6,confidence:.9,
  });
  assert.equal(result.active,false);
  result=updatePickSlotActivation(result.state,{
    phaseKey,slotKey,fingerprint:'ffffffffffffffff',heroId:7,confidence:.9,
  });
  assert.equal(result.active,false);
});
