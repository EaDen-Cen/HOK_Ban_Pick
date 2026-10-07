import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Role } from '../src/shared/types.js';

const roles: Role[] = ['control', 'caster', 'overlay'];
interface AccessData { tokens: Record<Role,string>; salt?: string; passwordHash?: string }
export class AccessStore {
  private data: AccessData;
  constructor(private file: string) {
    this.data = existsSync(file) ? JSON.parse(readFileSync(file,'utf8')) : {
      tokens: Object.fromEntries(roles.map(role=>[role,randomBytes(32).toString('hex')])) as Record<Role,string>,
    };
    // Explicit environment tokens remain supported for existing deployments.
    for (const role of roles) {
      const configured = process.env[`${role.toUpperCase()}_TOKEN`];
      if (configured && configured !== `local-${role}` && !this.data.passwordHash) this.data.tokens[role] = configured;
    }
    if (new Set(Object.values(this.data.tokens)).size !== roles.length) throw new Error('Access tokens must be distinct');
    if(process.env.ACCESS_PASSWORD && !this.data.passwordHash) this.setPassword(process.env.ACCESS_PASSWORD);
    else this.save();
  }
  private save() {
    mkdirSync(dirname(this.file),{recursive:true});
    writeFileSync(this.file+'.tmp',JSON.stringify(this.data),{mode:0o600});
    renameSync(this.file+'.tmp',this.file);
  }
  token(role: Role) { return this.data.tokens[role]; }
  role(token: unknown) { return roles.find(role=>typeof token==='string' && token===this.data.tokens[role]); }
  get configured() { return !!this.data.passwordHash; }
  verify(password: unknown) {
    if(typeof password!=='string'||password.length>256||!this.data.passwordHash||!this.data.salt) return false;
    return timingSafeEqual(scryptSync(password,this.data.salt,32),Buffer.from(this.data.passwordHash,'hex'));
  }
  setPassword(password: unknown) {
    if(typeof password!=='string'||password.length<8||password.length>256) throw new Error('Password must contain 8–256 characters');
    const salt=randomBytes(16).toString('hex');
    const next:AccessData={salt,passwordHash:scryptSync(password,salt,32).toString('hex'),tokens:Object.fromEntries(roles.map(role=>[role,randomBytes(32).toString('hex')])) as Record<Role,string>};
    const previous=this.data;
    this.data=next;
    try { this.save(); } catch(error) { this.data=previous; throw error; }
  }
}
