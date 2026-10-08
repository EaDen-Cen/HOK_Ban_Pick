import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID, createHash } from 'node:crypto';
import { Store } from './store.js';
import { AccessStore } from './access.js';
import { archiveData, RecoveryManager, restoreArchive, validateArchive, acquireBackendLock } from './recovery.js';
function setup(){const root=mkdtempSync(join(tmpdir(),'hok-recovery-')),file=join(root,'match.json'),uploads=join(root,'uploads/player-portraits');const s=new Store(file);s.apply(randomUUID(),0,{type:'delay',seconds:10});new AccessStore(join(root,'access.json'));mkdirSync(uploads,{recursive:true});writeFileSync(join(uploads,'photo.png'),Buffer.from('portrait'));return {root,file,uploads,s};}
test('automatic backup retains snapshots, deduplicates unchanged data, restores stores and photos',()=>{
  const {root,file,uploads,s}=setup();
  try{
    const manager=new RecoveryManager(file,uploads,join(root,'backups'),2),first=manager.create()!;
    assert.equal(manager.create(),undefined);
    const archive=JSON.parse(readFileSync(join(root,'backups',first),'utf8'));
    s.apply(randomUUID(),s.data.revision,{type:'delay',seconds:20});manager.create();manager.create(true);
    assert.equal(manager.list().length,2);
    rmSync(join(uploads,'photo.png'));restoreArchive(archive,file,uploads);
    assert.equal(new Store(file).data.delay,10);assert.equal(readFileSync(join(uploads,'photo.png'),'utf8'),'portrait');
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('exports omit credentials; import preserves destination access; active backend prevents restore',()=>{
  const {root,file,uploads}=setup();
  try{
    const archive=archiveData(file,uploads,false);assert.equal(archive.entries.some(e=>e.path==='access.json'),false);
    const access=readFileSync(join(root,'access.json'),'utf8');
    const release=acquireBackendLock(root);
    assert.throws(()=>restoreArchive(archive,file,uploads),/Stop the broadcast/);release();
    restoreArchive(archive,file,uploads);assert.equal(readFileSync(join(root,'access.json'),'utf8'),access);
    assert.equal(existsSync(join(root,'.backend.lock')),false);
  }finally{rmSync(root,{recursive:true,force:true});}
});
test('tamper, traversal, duplicate entries and malformed stores leave original files unchanged',()=>{
  const {root,file,uploads}=setup();
  try{
    const archive=archiveData(file,uploads),before=readFileSync(file,'utf8');
    const badStore=structuredClone(archive),broken=JSON.parse(before);broken.state.liveGameStats={blueKills:-1};const content=Buffer.from(JSON.stringify(broken));badStore.entries[0].base64=content.toString('base64');badStore.entries[0].sha256=createHash('sha256').update(content).digest('hex');assert.throws(()=>restoreArchive(badStore,file,uploads));assert.equal(readFileSync(file,'utf8'),before);
    for(const mutate of [(a:typeof archive)=>a.entries[0].base64='AAAA',(a:typeof archive)=>a.entries[0].path='../outside.json',(a:typeof archive)=>a.entries.push(a.entries[0])]){
      const bad=structuredClone(archive);mutate(bad);assert.throws(()=>validateArchive(bad));assert.equal(readFileSync(file,'utf8'),before);
    }
  }finally{rmSync(root,{recursive:true,force:true});}
});
