import test from 'node:test';
import assert from 'node:assert/strict';
import { updateHeroRecognitionStability } from '../src/control/heroRecognitionStability.js';

const fresh={phaseKey:'',heroId:null,count:0};

test('hero review requires the same separated candidate for two scans',()=>{
  const first=updateHeroRecognitionStability(fresh,'g1:p4',[
    {heroId:10,confidence:.72},
    {heroId:11,confidence:.61},
  ]);
  assert.equal(first.accepted,false);
  assert.equal(first.stability.count,1);

  const second=updateHeroRecognitionStability(first.stability,'g1:p4',[
    {heroId:10,confidence:.70},
    {heroId:11,confidence:.60},
  ]);
  assert.equal(second.accepted,true);
  assert.equal(second.stability.count,2);
});

test('ambiguous candidates and phase changes reset stable hero evidence',()=>{
  const ambiguous=updateHeroRecognitionStability(fresh,'g1:p4',[
    {heroId:10,confidence:.70},
    {heroId:11,confidence:.68},
  ]);
  assert.equal(ambiguous.accepted,false);
  assert.equal(ambiguous.stability.count,0);

  const previous={phaseKey:'g1:p4',heroId:10,count:1};
  const nextPhase=updateHeroRecognitionStability(previous,'g1:p5',[
    {heroId:10,confidence:.75},
    {heroId:11,confidence:.50},
  ]);
  assert.equal(nextPhase.accepted,false);
  assert.equal(nextPhase.stability.count,1);
});
