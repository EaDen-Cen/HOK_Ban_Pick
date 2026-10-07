import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { performance } from 'node:perf_hooks';
import sharp from 'sharp';
import heroes from '../src/components/HeroList.js';
import * as current from '../server/capture.js';
const baseline=process.env.HOK_BASELINE_PATH ? await import(pathToFileURL(resolve(process.env.HOK_BASELINE_PATH,'server/capture.ts')).href) as typeof current : undefined;
const source=readFileSync('public'+heroes[0].imageLink);
const frames=await Promise.all(Array.from({length:12},(_,i)=>sharp(readFileSync('public'+heroes[(i*11)%heroes.length].imageLink)).resize(48+i,48+i).modulate({brightness:1-i*.02}).png().toBuffer()));
async function measure(module:typeof current) {
  await module.recognizeImage(source);
  const started=performance.now();
  const candidates=[];
  for(const frame of frames) candidates.push(await module.recognizeImage(frame,undefined,'circle'));
  const distinctMs=(performance.now()-started)/frames.length;
  const image='data:image/png;base64,'+source.toString('base64');
  await module.recognizeClientFrame(image);
  const repeatedStart=performance.now();
  for(let i=0;i<30;i++) await module.recognizeClientFrame(image);
  return {distinctMs,repeatedMs:(performance.now()-repeatedStart)/30,candidates};
}
const before=baseline ? await measure(baseline) : undefined;
const after=await measure(current);
const maxScoreDelta=before ? Math.max(...before.candidates.flatMap((items,index)=>items.map((item,j)=>Math.abs(item.confidence-after.candidates[index][j].confidence)))) : undefined;
const identicalHeroOrder=before ? JSON.stringify(before.candidates.map(items=>items.map(item=>item.heroId)))===JSON.stringify(after.candidates.map(items=>items.map(item=>item.heroId))) : undefined;
console.log(JSON.stringify({frames:frames.length,repeatedFrames:30,before:before&&{distinctMs:before.distinctMs,repeatedMs:before.repeatedMs},after:{distinctMs:after.distinctMs,repeatedMs:after.repeatedMs},identicalHeroOrder,maxScoreDelta},null,2));
