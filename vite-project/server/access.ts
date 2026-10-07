import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { dirname } from 'node:path';
import type { IncomingMessage } from 'node:http';
import type { Role } from '../src/shared/types.js';

interface Credential {
  salt: string;
  hash: string;
}

interface AccessFile {
  version: 1;
  roles: Partial<Record<Role,Credential>>;
  updatedAt: number;
}

const roles:Role[]=['control','caster','overlay'];

function validPassword(value:unknown):value is string {
  return typeof value==='string'&&value.length>=8&&value.length<=128&&!/[\r\n\0]/.test(value);
}

function credential(password:string):Credential {
  const salt=randomBytes(16);
  const hash=scryptSync(password,salt,32);
  return {salt:salt.toString('base64'),hash:hash.toString('base64')};
}

function verifyCredential(record:Credential|undefined,password:string) {
  if(!record||!password) return false;
  try{
    const salt=Buffer.from(record.salt,'base64');
    const expected=Buffer.from(record.hash,'base64');
    const actual=scryptSync(password,salt,expected.length);
    return actual.length===expected.length&&timingSafeEqual(actual,expected);
  }catch{return false;}
}

export function localTrustedRequest(req:Pick<IncomingMessage,'headers'|'socket'>) {
  const address=req.socket.remoteAddress;
  if(!['127.0.0.1','::1','::ffff:127.0.0.1'].includes(address||'')) return false;
  if(Object.keys(req.headers).some(key=>/^(forwarded|x-forwarded-|cf-)/.test(key))) return false;
  try{
    const host=new URL(`http://${req.headers.host}`).hostname;
    if(!['localhost','127.0.0.1','[::1]'].includes(host)) return false;
    if(!req.headers.origin) return true;
    return new URL(req.headers.origin).host===req.headers.host;
  }catch{return false;}
}

export class AccessManager {
  private data:AccessFile;

  constructor(private file:string,env:NodeJS.ProcessEnv=process.env){
    if(existsSync(file)){
      const parsed=JSON.parse(readFileSync(file,'utf8')) as AccessFile;
      if(parsed.version!==1||!parsed.roles||typeof parsed.roles!=='object') throw new Error('Access configuration is invalid');
      this.data=parsed;
      return;
    }

    const seeded:Partial<Record<Role,Credential>>={};
    const envValues:Record<Role,string|undefined>={
      control:env.CONTROL_TOKEN,
      caster:env.CASTER_TOKEN,
      overlay:env.OVERLAY_TOKEN,
    };
    const supplied=roles.filter(role=>!!envValues[role]);
    if(supplied.length){
      if(supplied.length!==roles.length||roles.some(role=>!validPassword(envValues[role]))) {
        throw new Error('Set all three remote access passwords (8-128 characters), or configure them from local Control.');
      }
      const values=roles.map(role=>envValues[role]!) as string[];
      if(new Set(values).size!==values.length) throw new Error('Control, Caster, and Overlay passwords must be distinct.');
      for(const role of roles) seeded[role]=credential(envValues[role]!);
    }
    this.data={version:1,roles:seeded,updatedAt:0};
  }

  configured(role?:Role){
    return role?!!this.data.roles[role]:roles.every(item=>!!this.data.roles[item]);
  }

  status(){
    return {
      configured:Object.fromEntries(roles.map(role=>[role,this.configured(role)])) as Record<Role,boolean>,
      updatedAt:this.data.updatedAt,
    };
  }

  verify(role:Role,password:string){
    return verifyCredential(this.data.roles[role],password);
  }

  roleForPassword(password:string):Role|undefined {
    return roles.find(role=>this.verify(role,password));
  }

  configure(input:unknown){
    if(!input||typeof input!=='object') throw new Error('accessConfigInvalid');
    const value=input as Record<string,unknown>;
    const passwords=roles.map(role=>value[role]);
    if(passwords.some(password=>!validPassword(password))) throw new Error('accessPasswordInvalid');
    if(new Set(passwords as string[]).size!==passwords.length) throw new Error('accessPasswordsMustDiffer');
    const next:AccessFile={
      version:1,
      roles:Object.fromEntries(roles.map((role,index)=>[role,credential(passwords[index] as string)])),
      updatedAt:Date.now(),
    };
    mkdirSync(dirname(this.file),{recursive:true});
    const temporary=`${this.file}.tmp`;
    writeFileSync(temporary,JSON.stringify(next));
    renameSync(temporary,this.file);
    this.data=next;
    return this.status();
  }
}
