import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { archiveData, RecoveryManager, restoreArchive, validateArchive } from '../server/recovery.js';
const dataFile=resolve(process.env.DATA_FILE||'data/match.json');
const uploads=resolve(process.env.UPLOAD_DIR||resolve(dirname(dataFile),'uploads/player-portraits'));
const [command,path]=process.argv.slice(2);
try {
  if(command==='backup')console.log(new RecoveryManager(dataFile,uploads).create(true));
  else if(command==='verify'&&path){validateArchive(JSON.parse(readFileSync(path,'utf8')));console.log('Archive checksums and paths verified');}
  else if((command==='restore'||command==='import')&&path){restoreArchive(JSON.parse(readFileSync(path,'utf8')),dataFile,uploads);console.log('Recovery complete; start the backend');}
  else if(command==='export'&&path){writeFileSync(path,JSON.stringify(archiveData(dataFile,uploads,false)),{mode:0o600});console.log('Match exported');}
  else throw new Error('Usage: recovery.ts backup | verify <file> | restore <file> | export <file> | import <file>');
}catch(error){console.error(error instanceof Error?error.message:'Recovery failed');process.exitCode=1;}
