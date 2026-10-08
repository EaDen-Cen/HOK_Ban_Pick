import sharp from 'sharp';
import { resolve } from 'node:path';
import { PlayerRecognitionProvider } from '../server/playerRecognition.js';
import { solvePlayerSlots } from '../src/shared/playerSlots.js';
const directory=process.env.HOK_OCR_MODEL_DIR;
const provider=new PlayerRecognitionProvider(directory?resolve(directory):undefined,process.env.HOK_OCR_LANGUAGES||'eng+chi_sim');
const names=['Alpha','Bravo','Charlie','Delta','Echo'];
try {
  const preload=performance.now();await provider.prepare();
  if(provider.status!=='ready')throw new Error(provider.error);
  console.log(`Preload: ${Math.round(performance.now()-preload)} ms`);
  const order=[4,2,0,3,1];
  const images=await Promise.all([...order,...order].map(async(index)=>{
    const svg=`<svg width="420" height="60"><rect width="100%" height="100%" fill="white"/><text x="16" y="42" font-family="DejaVu Sans" font-size="36" fill="black">${names[index]}</text></svg>`;
    return 'data:image/png;base64,'+(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64');
  }));
  for(let i=0;i<3;i++){
    const result=await provider.recognize(images);
    console.log(JSON.stringify({iteration:i+1,elapsedMs:Math.round(result.elapsedMs),texts:result.texts,confidences:result.confidences,solution:solvePlayerSlots(result.texts.slice(0,5),names,result.confidences.slice(0,5))}));
  }
} finally {await provider.close();}
