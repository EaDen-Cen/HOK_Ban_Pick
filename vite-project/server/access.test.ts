import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AccessManager, localTrustedRequest } from './access.js';

test('access manager starts without default remote passwords and persists configured roles',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hok-access-'));
  try{
    const file=join(dir,'access.json');
    const access=new AccessManager(file,{});
    assert.equal(access.configured(),false);
    assert.equal(access.verify('control','anything'),false);

    access.configure({
      control:'control-pass-123',
      caster:'caster-pass-123',
      overlay:'overlay-pass-123',
    });
    assert.equal(access.configured(),true);
    assert.equal(access.verify('control','control-pass-123'),true);
    assert.equal(access.verify('caster','caster-pass-123'),true);
    assert.equal(access.verify('overlay','overlay-pass-123'),true);
    assert.equal(access.verify('control','caster-pass-123'),false);

    const reloaded=new AccessManager(file,{});
    assert.equal(reloaded.verify('control','control-pass-123'),true);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('access manager supports partial password changes and rejects shared role passwords',()=>{
  const dir=mkdtempSync(join(tmpdir(),'hok-access-'));
  try{
    const access=new AccessManager(join(dir,'access.json'),{});
    access.configure({
      control:'control-pass-123',
      caster:'caster-pass-123',
      overlay:'overlay-pass-123',
    });
    access.configure({caster:'caster-new-456'});
    assert.equal(access.verify('caster','caster-new-456'),true);
    assert.equal(access.verify('control','control-pass-123'),true);
    assert.throws(()=>access.configure({overlay:'control-pass-123'}),/accessPasswordsMustDiffer/);
    assert.throws(()=>access.configure({control:'short'}),/accessPasswordInvalid/);
  } finally { rmSync(dir,{recursive:true,force:true}); }
});

test('local trust requires loopback, local host, and no forwarding headers',()=>{
  type LocalRequest=Parameters<typeof localTrustedRequest>[0];
  const request=(headers:Record<string,string>,remoteAddress:string)=>({
    headers,
    socket:{remoteAddress},
  } as unknown as LocalRequest);
  assert.equal(localTrustedRequest(request({host:'127.0.0.1:3001',origin:'http://127.0.0.1:3001'},'127.0.0.1')),true);
  assert.equal(localTrustedRequest(request({host:'127.0.0.1:3001',origin:'http://127.0.0.1:3001','x-forwarded-for':'1.2.3.4'},'127.0.0.1')),false);
  assert.equal(localTrustedRequest(request({host:'example.com',origin:'https://example.com'},'127.0.0.1')),false);
  assert.equal(localTrustedRequest(request({host:'127.0.0.1:3001',origin:'http://127.0.0.1:3001'},'10.0.0.5')),false);
});
