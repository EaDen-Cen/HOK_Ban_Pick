import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { PlayerRecognitionProvider } from './playerRecognition.js';
test('resident offline OCR batches ten names and ten numeric fields without model downloads',async()=>{
  const provider=new PlayerRecognitionProvider();
  try{
    await provider.prepare();assert.equal(provider.status,'ready',provider.error);
    const render=async(text:string)=>'data:image/png;base64,'+(await sharp(Buffer.from(`<svg width="420" height="60"><rect width="100%" height="100%" fill="white"/><text x="16" y="42" font-family="DejaVu Sans" font-size="36" fill="black">${text}</text></svg>`)).png().toBuffer()).toString('base64');
    const names=['Alpha','Bravo','Charlie','Delta','Echo','Fox','Golf','Hotel','India','Juliet'];
    const first=await provider.recognize(await Promise.all(names.map(render)));assert.deepEqual(first.texts,names);
    const values=['8','2','10','12.5','35','14000','72000','0','99','100'];
    const second=await provider.recognize(await Promise.all(values.map(render)));assert.deepEqual(second.texts,values);
    const renderDark=async(text:string)=>'data:image/png;base64,'+(await sharp(Buffer.from(`<svg width="420" height="60"><rect width="100%" height="100%" fill="#081522"/><text x="16" y="42" font-family="DejaVu Sans" font-size="36" font-weight="700" fill="white">${text}</text></svg>`)).png().toBuffer()).toString('base64');
    const dark=await provider.recognize(await Promise.all(names.map(renderDark)));assert.deepEqual(dark.texts,names);
    await assert.rejects(provider.recognize(['data:image/png;base64,AAAA']),/Ten small/);
    assert.equal(provider.status,'ready');
  }finally{await provider.close();}
});
