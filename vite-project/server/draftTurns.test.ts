import test from 'node:test';
import assert from 'node:assert/strict';
import { draftTurnAtPhase, nextDraftTurn, previousDraftTurnStart } from '../src/shared/draftTurns.js';

test('match BP groups simultaneous same-team picks but keeps bans atomic',()=>{
  assert.deepEqual(draftTurnAtPhase('match','blue',0)?.phaseIndexes,[0]);
  assert.deepEqual(draftTurnAtPhase('match','blue',4)?.phaseIndexes,[4]);
  assert.deepEqual(draftTurnAtPhase('match','blue',5)?.phaseIndexes,[5,6]);
  assert.deepEqual(draftTurnAtPhase('match','blue',7)?.phaseIndexes,[7,8]);
  assert.deepEqual(draftTurnAtPhase('match','blue',9)?.phaseIndexes,[9]);
  assert.deepEqual(draftTurnAtPhase('match','blue',10)?.phaseIndexes,[10]);
  assert.deepEqual(draftTurnAtPhase('match','blue',14)?.phaseIndexes,[14]);
  assert.deepEqual(draftTurnAtPhase('match','blue',15)?.phaseIndexes,[15,16]);
  assert.deepEqual(draftTurnAtPhase('match','blue',17)?.phaseIndexes,[17]);
});

test('a partially consumed double-pick becomes a one-slot remainder',()=>{
  assert.deepEqual(draftTurnAtPhase('match','blue',6)?.phaseIndexes,[6]);
  assert.deepEqual(draftTurnAtPhase('match','blue',8)?.phaseIndexes,[8]);
  assert.deepEqual(draftTurnAtPhase('match','blue',16)?.phaseIndexes,[16]);
});

test('next and previous turn helpers jump over simultaneous groups',()=>{
  assert.equal(nextDraftTurn('match','blue',5)?.startPhase,7);
  assert.equal(nextDraftTurn('match','blue',15)?.startPhase,17);
  assert.equal(previousDraftTurnStart('match','blue',7),5);
  assert.equal(previousDraftTurnStart('match','blue',15),14);
});
