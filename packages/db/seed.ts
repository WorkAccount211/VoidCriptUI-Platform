import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import {db} from './src';
import crypto from 'node:crypto';
import argon2 from 'argon2';
const permissions=['users.view','users.manage','roles.manage','issues.moderate','questions.moderate','suggestions.moderate','plugins.moderate','audit.view','health.view','github.manage','settings.manage','deployment.manage'];
const roleNames=['USER','VERIFIED_USER','CONTRIBUTOR','PLUGIN_DEVELOPER','MODERATOR','ADMIN','OWNER'];
async function main(){
 for(const key of permissions)await db.permission.upsert({where:{key},update:{},create:{key}});
 for(const name of roleNames)await db.role.upsert({where:{name},update:{},create:{name,system:true}});
 const ownerEmail=process.env.INITIAL_OWNER_EMAIL?.toLowerCase();
 const ownerPassword=process.env.INITIAL_OWNER_PASSWORD;
 if(ownerEmail){
  if(!ownerPassword && !process.env.INITIAL_OWNER_PASSWORD_HASH)throw new Error('INITIAL_OWNER_PASSWORD or INITIAL_OWNER_PASSWORD_HASH is required for owner bootstrap');
  const passwordHash=process.env.INITIAL_OWNER_PASSWORD_HASH||await argon2.hash(ownerPassword!);
  const user=await db.user.upsert({where:{email:ownerEmail},update:{emailVerifiedAt:new Date(),passwordHash},create:{uid:`VCU-${crypto.randomBytes(10).toString('hex').toUpperCase()}`,email:ownerEmail,username:(process.env.INITIAL_OWNER_USERNAME||'owner').replace(/[^A-Za-z0-9_]/g,'_').slice(0,32),displayName:'Owner',passwordHash,emailVerifiedAt:new Date(),profile:{create:{}}}});
  const role=await db.role.findUnique({where:{name:'OWNER'}});if(role)await db.userRole.upsert({where:{userId_roleId:{userId:user.id,roleId:role.id}},update:{},create:{userId:user.id,roleId:role.id}});
  console.log('Owner bootstrap UID:',user.uid);
 }
}
main().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>db.$disconnect());
