import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import heroes from '../src/components/HeroList.js';
import { recognizeImage } from './capture.js';
import { readFile } from 'node:fs/promises';
test('Windows native recognizer ranks a known image without capturing the desktop', {skip:process.platform!=='win32'},async()=>{
  const sample=heroes[0];
  const candidates=heroes.map(h=>({id:h.id,path:fileURLToPath(new URL(`../public${h.imageLink}`,import.meta.url))}));
  const output=await new Promise<string>((resolve,reject)=>{
    const child=execFile('powershell.exe',['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',fileURLToPath(new URL('../scripts/capture/recognize.ps1',import.meta.url)),'-Fixture',candidates[0].path],{timeout:20000,windowsHide:true},(error,stdout,stderr)=>error?reject(new Error(stderr)):resolve(stdout));
    child.stdin?.end(JSON.stringify({region:{x:0,y:0,width:100,height:100},heroes:candidates}));
  });
  const result=JSON.parse(output);
  const matches=await recognizeImage(Buffer.from(result.preview.split(',')[1],'base64'));
  assert.equal(matches[0].heroId,sample.id);
  assert.ok(matches[0].confidence>.99);
  assert.ok(result.preview.startsWith('data:image/png;base64,'));
});
test('recognizer decodes and correctly matches every roster portrait',async()=>{
  for (const hero of heroes) {
    const matches=await recognizeImage(await readFile(fileURLToPath(new URL(`../public${hero.imageLink}`,import.meta.url))));
    assert.ok(matches.some(match=>match.heroId===hero.id && match.confidence>.99),hero.englishName);
  }
});
