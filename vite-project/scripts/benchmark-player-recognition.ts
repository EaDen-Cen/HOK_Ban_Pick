import sharp from 'sharp';
import { resolve } from 'node:path';
import { PlayerRecognitionProvider } from '../server/playerRecognition.js';
import { solvePlayerSlotCandidates } from '../src/shared/playerSlots.js';
const directory=process.env.HOK_OCR_MODEL_DIR;
const provider=new PlayerRecognitionProvider(directory?resolve(directory):undefined,process.env.HOK_OCR_LANGUAGES||'chi_sim+eng');
const names=['Alpha','Bravo','Charlie','Delta','Echo'];
try {
  const preload=performance.now();await provider.prepare();
  if(provider.status!=='ready')throw new Error(provider.error);
  console.log(`Preload: ${Math.round(performance.now()-preload)} ms`);
  const order=[4,2,0,3,1];
  const images=await Promise.all([...order,...order].map(async(index)=>{
    const svg=`<svg width="570" height="90"><rect width="100%" height="100%" fill="#291d30"/><text x="550" y="53" text-anchor="end" font-family="DejaVu Sans" font-size="20" font-weight="700" fill="#88818b">${names[index]}</text></svg>`;
    return 'data:image/png;base64,'+(await sharp(Buffer.from(svg)).png().toBuffer()).toString('base64');
  }));
  for(let i=0;i<3;i++){
    const result=await provider.recognizePlayerIds(images,[names,names]);
    const solutions=[0,5].map(offset=>solvePlayerSlotCandidates(result.candidates.slice(offset,offset+5),names));
    console.log(JSON.stringify({iteration:i+1,elapsedMs:Math.round(result.elapsedMs),texts:result.texts,solutions}));
    if(solutions.some(solution=>!solution?.automatic||solution.order.some((value,index)=>value!==order[index])))throw new Error('Player OCR did not recover the expected automatic mapping');
  }
} finally {await provider.close();}
