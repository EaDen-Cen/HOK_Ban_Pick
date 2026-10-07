import test from 'node:test';
import assert from 'node:assert/strict';
import { freshPickTurnDimState, updatePickTurnDimState } from '../src/control/pickTurnDimDetection.js';

test('final pick dim detector freezes stable brightness then requires sustained darkening',()=>{
  const phaseKey='1:17:red:pick';
  let state=freshPickTurnDimState();

  let result=updatePickTurnDimState(state,{
    phaseKey,
    meanLumas:[120],
    candidatesStable:false,
  });
  state=result.state;
  assert.equal(result.locked,false);

  result=updatePickTurnDimState(state,{
    phaseKey,
    meanLumas:[118],
    candidatesStable:true,
  });
  state=result.state;
  assert.equal(result.locked,false);

  result=updatePickTurnDimState(state,{
    phaseKey,
    meanLumas:[104],
    candidatesStable:true,
  });
  state=result.state;
  assert.equal(result.locked,false);
  assert.equal(result.state.dimCount,1);

  result=updatePickTurnDimState(state,{
    phaseKey,
    meanLumas:[103],
    candidatesStable:true,
  });
  assert.equal(result.locked,true);
});

test('small brightness noise does not count as a final-pick lock',()=>{
  const phaseKey='1:17:red:pick';
  let result=updatePickTurnDimState(freshPickTurnDimState(),{
    phaseKey,
    meanLumas:[120],
    candidatesStable:true,
  });
  result=updatePickTurnDimState(result.state,{
    phaseKey,
    meanLumas:[114],
    candidatesStable:true,
  });
  assert.equal(result.locked,false);
  assert.equal(result.state.dimCount,0);
});
