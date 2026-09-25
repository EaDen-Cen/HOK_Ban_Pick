import test from 'node:test';
import assert from 'node:assert/strict';
import heroes from '../src/components/HeroList.js';
import { enterTarget, heroMatchesSearch } from '../src/control/heroSearch.js';

const hero=(name:string)=>{
  const found=heroes.find(item=>item.chineseName===name);
  assert.ok(found,`missing hero ${name}`);
  return found;
};

test('Chinese hero search supports pinyin initials',()=>{
  assert.equal(heroMatchesSearch(hero('拉普拉普'),'lplp','zh'),true);
  assert.equal(heroMatchesSearch(hero('诸葛亮'),'zgl','zh'),true);
  assert.equal(heroMatchesSearch(hero('公孙离'),'gsl','zh'),true);
  assert.equal(heroMatchesSearch(hero('百里玄策'),'blxc','zh'),true);
  assert.equal(heroMatchesSearch(hero('拉普拉普'),'LPLP','zh'),true);
});

test('initial-only matching is limited to Chinese mode while normal text search still works',()=>{
  assert.equal(heroMatchesSearch(hero('诸葛亮'),'zgl','eng'),false);
  assert.equal(heroMatchesSearch(hero('诸葛亮'),'Kongming','eng'),true);
  assert.equal(heroMatchesSearch(hero('拉普拉普'),'Lapulapu','eng'),true);
});

test('Enter target is the first eligible filtered hero only when a query exists',()=>{
  const eligible=[{id:105},{id:54}];
  assert.equal(enterTarget(eligible,'lplp')?.id,105);
  assert.equal(enterTarget(eligible,'   '),undefined);
  assert.equal(enterTarget([],'lplp'),undefined);
});
