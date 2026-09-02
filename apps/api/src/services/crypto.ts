import crypto from 'node:crypto';
const key=()=>{const raw=process.env.ENCRYPTION_KEY||'';return crypto.createHash('sha256').update(raw||'dev-only-change-me').digest();};
export function encrypt(text:string){const iv=crypto.randomBytes(12);const c=crypto.createCipheriv('aes-256-gcm',key(),iv);const enc=Buffer.concat([c.update(text,'utf8'),c.final()]);return [iv.toString('base64url'),c.getAuthTag().toString('base64url'),enc.toString('base64url')].join('.');}
export function decrypt(value:string){const [ivS,tagS,dataS]=value.split('.');const d=crypto.createDecipheriv('aes-256-gcm',key(),Buffer.from(ivS,'base64url'));d.setAuthTag(Buffer.from(tagS,'base64url'));return Buffer.concat([d.update(Buffer.from(dataS,'base64url')),d.final()]).toString('utf8');}
