import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import Fastify, {FastifyRequest} from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import argon2 from 'argon2';
import {authenticator} from 'otplib';
import QRCode from 'qrcode';
import {PrismaClient} from '@prisma/client';
import {z} from 'zod';
import {sendMail} from './services/mailer';
import {encrypt,decrypt} from './services/crypto';

const db=new PrismaClient();
const app=Fastify({logger:true,trustProxy:true});
const COOKIE=process.env.SESSION_COOKIE_NAME||'vcu_session';
const SESSION_TTL=Number(process.env.SESSION_TTL_DAYS||30)*86400000;
const sha=(v:string)=>crypto.createHash('sha256').update(v).digest('hex');
const randomToken=(n=32)=>crypto.randomBytes(n).toString('base64url');
const makeUid=()=>`VCU-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
const rid=()=>crypto.randomUUID();
const roles=(u:any)=>((u?.roles||[]) as any[]).map(r=>r.role.name);

async function verifyTurnstile(token:string|undefined,req:FastifyRequest){
 if(process.env.NODE_ENV!=='production' || process.env.DEV_BYPASS_CAPTCHA==='true') return true;
 if(!token||!process.env.TURNSTILE_SECRET_KEY) return false;
 try{const body=new URLSearchParams({secret:process.env.TURNSTILE_SECRET_KEY,response:token});const r=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body});if(!r.ok)return false;const j=await r.json() as any;return j.success===true;}catch(err){req.log.error(err,'turnstile verification failed');return false;}
}
async function audit(actorUid:string|undefined,action:string,category:string,result='success',targetUid?:string,metadata?:Record<string,unknown>,requestId?:string){
  await db.auditLog.create({data:{actorUid,action,category,result,targetUid,metadata:metadata as any,requestId}});
}

function ipHash(req:FastifyRequest){return sha(String(req.ip||''));}

async function getUser(req:FastifyRequest){
  const token=(req.cookies as any)[COOKIE]; if(!token)return null;
  const s=await db.session.findUnique({where:{tokenHash:sha(token)},include:{user:{include:{roles:{include:{role:true}},profile:true,telegram:true,discord:true,totp:true}}}});
  if(!s)return null;
  if(s.expiresAt<=new Date()){await db.session.delete({where:{id:s.id}}).catch(()=>{});return null;}
  await db.session.update({where:{id:s.id},data:{lastSeenAt:new Date()}});
  return s.user;
}
function guard(...allowed:string[]){return async(req:FastifyRequest,reply:any)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});if(!roles(u).some(r=>allowed.includes(r)))return reply.code(403).send({success:false,error:{code:'FORBIDDEN',message:'Insufficient permissions.'}});(req as any).user=u;};}

async function bootstrap(){
  await app.register(cors,{origin:process.env.WEB_URL||'http://localhost:4080',credentials:true});
  await app.register(cookie);
  await app.register(rateLimit,{global:true,max:Number(process.env.RATE_LIMIT_MAX||120),timeWindow:Number(process.env.RATE_LIMIT_WINDOW_MS||60000)});
  await app.register(swagger,{openapi:{info:{title:'VoidCriptUI API',version:'1.0.0'},servers:[{url:process.env.API_PUBLIC_URL||'http://localhost:8100'}]}});
  await app.register(swaggerUi,{routePrefix:'/api-docs'});

  app.get('/api/v1/health',async()=>({success:true,data:{status:'ok',service:'api',timestamp:new Date().toISOString()}}));
  app.get('/api/v1/health/ready',async()=>{await db.$queryRaw`SELECT 1`;return {success:true,data:{database:'ok'}}});

  app.post('/api/v1/auth/signup',async(req,reply)=>{
   const requestId=rid();
   const p=z.object({email:z.string().email(),username:z.string().min(3).max(32).regex(/^[A-Za-z0-9_]+$/),displayName:z.string().min(1).max(64),password:z.string().min(10),captchaToken:z.string().nullable().optional()}).parse(req.body);
   if(!(await verifyTurnstile(p.captchaToken||undefined,req)))return reply.code(400).send({success:false,error:{code:p.captchaToken?'CAPTCHA_FAILED':'CAPTCHA_REQUIRED',message:'Please verify the captcha.'}});
   const existing=await db.user.findFirst({where:{OR:[{email:p.email.toLowerCase()},{username:p.username}]}});if(existing)return reply.code(409).send({success:false,error:{code:'ACCOUNT_EXISTS',message:'An account with these credentials already exists.'}});
   const passScore=[p.password.length>=12,p.password.length>=16,/[A-Z]/.test(p.password),/[a-z]/.test(p.password),/\d/.test(p.password),/[^A-Za-z0-9]/.test(p.password)].filter(Boolean).length;
   if(passScore<4)return reply.code(400).send({success:false,error:{code:'WEAK_PASSWORD',message:'Choose a stronger password.'}});
   const user=await db.user.create({data:{uid:makeUid(),email:p.email.toLowerCase(),username:p.username,displayName:p.displayName,passwordHash:await argon2.hash(p.password),profile:{create:{}}}});
   const role=await db.role.findUnique({where:{name:'USER'}});if(role)await db.userRole.create({data:{userId:user.id,roleId:role.id}});
   const token=randomToken(32);await db.emailVerification.create({data:{userId:user.id,tokenHash:sha(token),expiresAt:new Date(Date.now()+24*3600000)}});
   const verifyUrl=`${process.env.WEB_URL||'http://localhost:4080'}/verify-email?token=${encodeURIComponent(token)}`;
   try{await sendMail(user.email,'Verify your VoidCriptUI account',`Open this link to verify your account: ${verifyUrl}`,`<p>Verify your VoidCriptUI account.</p><p><a href=\"${verifyUrl}\">Verify email</a></p>`)}catch(err){req.log.error(err,'verification email failed')}
   await audit(user.uid,'USER_REGISTERED','AUTH','success',undefined,undefined,requestId);
   return reply.code(201).send({success:true,data:{uid:user.uid,email:user.email,username:user.username,verified:false}});
  });

  app.get('/api/v1/auth/verify-email',async(req,reply)=>{const p=z.object({token:z.string()}).parse(req.query);const v=await db.emailVerification.findUnique({where:{tokenHash:sha(p.token)}});if(!v||v.usedAt||v.expiresAt<new Date())return reply.code(400).send({success:false,error:{code:'INVALID_TOKEN',message:'Verification link is invalid or expired.'}});const u=await db.user.update({where:{id:v.userId},data:{emailVerifiedAt:new Date()}});await db.emailVerification.update({where:{id:v.id},data:{usedAt:new Date()}});const verified=await db.role.findUnique({where:{name:'VERIFIED_USER'}});if(verified)await db.userRole.upsert({where:{userId_roleId:{userId:u.id,roleId:verified.id}},update:{},create:{userId:u.id,roleId:verified.id}});await audit(u.uid,'EMAIL_VERIFIED','AUTH');return {success:true,data:{verified:true}}});
  app.post('/api/v1/auth/resend-verification',async(req,reply)=>{const p=z.object({email:z.string().email()}).parse(req.body);const u=await db.user.findUnique({where:{email:p.email.toLowerCase()}});if(u&&!u.emailVerifiedAt){const token=randomToken(32);await db.emailVerification.create({data:{userId:u.id,tokenHash:sha(token),expiresAt:new Date(Date.now()+24*3600000)}});const verifyUrl=`${process.env.WEB_URL||'http://localhost:4080'}/verify-email?token=${encodeURIComponent(token)}`;try{await sendMail(u.email,'Verify your VoidCriptUI account',`Verify: ${verifyUrl}`)}catch(e){req.log.error(e,'verification email failed')}}return {success:true,data:{accepted:true}}});

  app.post('/api/v1/auth/login',async(req,reply)=>{
   const requestId=rid();
   const p=z.object({login:z.string(),password:z.string()}).parse(req.body);
   const u=await db.user.findFirst({where:{OR:[{email:p.login.toLowerCase()},{username:p.login}]},include:{roles:{include:{role:true}},totp:true,telegram:true,discord:true,profile:true}});
   if(!u||!(await argon2.verify(u.passwordHash,p.password))){
     await audit(undefined,'LOGIN_FAILED','AUTH','failure',undefined,{method:p.login.includes('@')?'email':'username'},requestId);
     return reply.code(401).send({success:false,error:{code:'INVALID_CREDENTIALS',message:'Invalid credentials.'}});
   }
   if(u.suspendedUntil && u.suspendedUntil>new Date())return reply.code(403).send({success:false,error:{code:'ACCOUNT_SUSPENDED',message:'Account is suspended.'}});
   if(!u.emailVerifiedAt && process.env.ALLOW_UNVERIFIED_LOGIN!=='true')return reply.code(403).send({success:false,error:{code:'ACCOUNT_UNVERIFIED',message:'Verify your email before signing in.'}});

   const methods:string[]=[];
   if(u.totp?.enabled)methods.push('TOTP');
   if(u.telegram)methods.push('TELEGRAM');
   if(u.discord)methods.push('DISCORD');
   if(roles(u).some(r=>['OWNER','ADMIN'].includes(r))&&!methods.includes('TOTP'))methods.push('TOTP');

   if(methods.length){
     const challenges:Record<string,{challenge:string;expiresIn:number;code?:string}>={};
     const expiresAt=new Date(Date.now()+5*60000);
     for(const method of methods){
       const challenge=randomToken(32);
       const needsCode=method==='TELEGRAM'||method==='DISCORD';
       const code=needsCode?String(crypto.randomInt(100000,1000000)):undefined;
       await db.authChallenge.create({data:{tokenHash:sha(challenge),userId:u.id,type:method as any,codeHash:code?sha(code):undefined,expiresAt,metadata:{method}}});
       challenges[method]={challenge,expiresIn:300,...(code?{code}: {})};
     }
     await audit(u.uid,'MFA_CHALLENGE_CREATED','AUTH','success',undefined,{methods},requestId);
     return {success:true,data:{mfaRequired:true,methods,challenges}};
   }

   return await issueSession(req,reply,u,requestId);
  });

  async function issueSession(req:FastifyRequest,reply:any,u:any,requestId?:string){const raw=randomToken(48);await db.session.create({data:{tokenHash:sha(raw),userId:u.id,expiresAt:new Date(Date.now()+SESSION_TTL),userAgent:req.headers['user-agent'],ipHash:ipHash(req)}});reply.setCookie(COOKIE,raw,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:SESSION_TTL/1000});await audit(u.uid,'LOGIN_SUCCESS','AUTH','success',undefined,undefined,requestId);return reply.send({success:true,data:{mfaRequired:false,user:{uid:u.uid,username:u.username,displayName:u.displayName,roles:roles(u)}}})}

  app.post('/api/v1/auth/mfa/verify',async(req,reply)=>{
   const requestId=rid();const p=z.object({challenge:z.string(),method:z.enum(['TOTP','TELEGRAM','DISCORD','RECOVERY']),code:z.string().min(3).max(128)}).parse(req.body);
   const c=await db.authChallenge.findUnique({where:{tokenHash:sha(p.challenge)},include:{user:{include:{totp:true,recoveryCodes:true,roles:{include:{role:true}}}}}});
   if(!c||c.consumedAt||c.expiresAt<new Date())return reply.code(401).send({success:false,error:{code:'CHALLENGE_EXPIRED',message:'Challenge expired.'}});
   if(c.attempts>=Number(process.env.MFA_MAX_ATTEMPTS||5))return reply.code(429).send({success:false,error:{code:'RATE_LIMITED',message:'Too many verification attempts.'}});
   let ok=false;
   if(p.method==='TOTP'&&c.user.totp?.enabled){ok=authenticator.check(p.code,decrypt(c.user.totp.secretEncrypted));}
   else if(p.method==='RECOVERY'){const rec=await db.recoveryCode.findFirst({where:{userId:c.user.id,codeHash:sha(p.code),usedAt:null}});if(rec){ok=true;await db.recoveryCode.update({where:{id:rec.id},data:{usedAt:new Date()}})}}
   else if(c.approvedAt && c.type===p.method)ok=true;
   if(!ok){await db.authChallenge.update({where:{id:c.id},data:{attempts:{increment:1}}});await audit(c.user.uid,'MFA_FAILED','AUTH','failure',undefined,{method:p.method},requestId);return reply.code(401).send({success:false,error:{code:'INVALID_MFA_CODE',message:'Invalid verification.'}})}
   await db.authChallenge.update({where:{id:c.id},data:{consumedAt:new Date()}});return issueSession(req,reply,c.user,requestId);
  });

  app.post('/api/v1/auth/logout',async(req,reply)=>{const token=(req.cookies as any)[COOKIE];if(token)await db.session.deleteMany({where:{tokenHash:sha(token)}});reply.clearCookie(COOKIE,{path:'/'});return {success:true,data:null}});

  app.patch('/api/v1/profile',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({displayName:z.string().min(1).max(64).optional(),bio:z.string().max(1000).optional(),language:z.enum(['en','ru']).optional(),theme:z.enum(['dark','light','system']).optional(),timezone:z.string().max(64).optional(),publicProfile:z.boolean().optional()}).parse(req.body);await db.user.update({where:{id:u.id},data:{displayName:p.displayName}});await db.profile.update({where:{userId:u.id},data:{bio:p.bio,language:p.language,theme:p.theme,timezone:p.timezone,publicProfile:p.publicProfile}});await audit(u.uid,'PROFILE_UPDATED','ACCOUNT');return {success:true,data:{ok:true}}});
  app.post('/api/v1/profile/media',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({kind:z.enum(['avatar','banner']),dataUrl:z.string().regex(/^data:image\/(png|jpeg|webp);base64,/)}).parse(req.body);const m=p.dataUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);if(!m)return reply.code(400).send({success:false,error:{code:'INVALID_FILE',message:'Invalid image data.'}});const buf=Buffer.from(m[2],'base64');const limit=p.kind==='avatar'?2*1024*1024:5*1024*1024;if(buf.byteLength>limit)return reply.code(413).send({success:false,error:{code:'FILE_TOO_LARGE',message:'Image is too large.'}});const dir=path.resolve(process.env.UPLOAD_DIR||'./uploads');await fs.mkdir(dir,{recursive:true});const name=`${u.uid}-${p.kind}-${crypto.randomBytes(8).toString('hex')}.${m[1]==='jpeg'?'jpg':m[1]}`;await fs.writeFile(path.join(dir,name),buf);const url=`${process.env.API_PUBLIC_URL||'http://localhost:8100'}/uploads/${encodeURIComponent(name)}`;await db.profile.update({where:{userId:u.id},data:p.kind==='avatar'?{avatarUrl:url}:{bannerUrl:url}});return {success:true,data:{url}}});
  app.get('/uploads/:name',async(req,reply)=>{const name=path.basename(String((req.params as any).name));const full=path.resolve(process.env.UPLOAD_DIR||'./uploads',name);try{const buf=await fs.readFile(full);const ext=path.extname(full).toLowerCase();const types:any={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};return reply.type(types[ext]||'application/octet-stream').send(buf)}catch{return reply.code(404).send({success:false,error:{code:'NOT_FOUND',message:'File not found.'}})}});
  app.get('/api/v1/me',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});return {success:true,data:{uid:u.uid,email:u.email,username:u.username,displayName:u.displayName,emailVerified:!!u.emailVerifiedAt,roles:roles(u),profile:u.profile,telegram:!!u.telegram,discord:!!u.discord,totp:!!u.totp?.enabled}}});

  app.post('/api/v1/auth/forgot-password',async(req,reply)=>{const p=z.object({email:z.string().email()}).parse(req.body);const u=await db.user.findUnique({where:{email:p.email.toLowerCase()}});if(u){const token=randomToken(32);await db.passwordReset.create({data:{userId:u.id,tokenHash:sha(token),expiresAt:new Date(Date.now()+30*60000)}});await audit(u.uid,'PASSWORD_RESET_REQUESTED','AUTH');try{await sendMail(u.email,'Reset your VoidCriptUI password',`Reset your password: ${process.env.WEB_URL||'http://localhost:4080'}/reset-password?token=${encodeURIComponent(token)}`)}catch(e){req.log.error(e,'password reset email failed')}}return {success:true,data:{accepted:true}}});
  app.post('/api/v1/auth/reset-password',async(req,reply)=>{const p=z.object({token:z.string(),password:z.string().min(10)}).parse(req.body);const r=await db.passwordReset.findUnique({where:{tokenHash:sha(p.token)},include:{user:true}});if(!r||r.usedAt||r.expiresAt<new Date())return reply.code(400).send({success:false,error:{code:'INVALID_TOKEN',message:'Reset token is invalid or expired.'}});await db.user.update({where:{id:r.userId},data:{passwordHash:await argon2.hash(p.password)}});await db.passwordReset.update({where:{id:r.id},data:{usedAt:new Date()}});await db.session.deleteMany({where:{userId:r.userId}});await audit(r.user.uid,'PASSWORD_CHANGED','SECURITY');return {success:true,data:{reset:true}}});

  app.post('/api/v1/2fa/totp/setup',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const secret=authenticator.generateSecret();await db.totpCredential.upsert({where:{userId:u.id},update:{secretEncrypted:encrypt(secret),enabled:false},create:{userId:u.id,secretEncrypted:encrypt(secret),enabled:false}});const uri=authenticator.keyuri(u.username,'VoidCriptUI',secret);await audit(u.uid,'TOTP_SETUP_STARTED','SECURITY');return {success:true,data:{otpauth:uri,qrDataUrl:await QRCode.toDataURL(uri)}}});
  app.post('/api/v1/2fa/totp/enable',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({code:z.string().length(6)}).parse(req.body);const t=await db.totpCredential.findUnique({where:{userId:u.id}});if(!t||!authenticator.check(p.code,decrypt(t.secretEncrypted)))return reply.code(400).send({success:false,error:{code:'INVALID_MFA_CODE',message:'Invalid TOTP code.'}});await db.totpCredential.update({where:{userId:u.id},data:{enabled:true}});await db.recoveryCode.deleteMany({where:{userId:u.id,usedAt:null}});const codes=Array.from({length:8},()=>crypto.randomBytes(6).toString('hex').toUpperCase());for(const code of codes)await db.recoveryCode.create({data:{userId:u.id,codeHash:sha(code)}});await audit(u.uid,'TOTP_ENABLED','SECURITY');return {success:true,data:{recoveryCodes:codes}}});
  app.post('/api/v1/2fa/challenge',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({method:z.enum(['TELEGRAM','DISCORD'])}).parse(req.body);if(p.method==='TELEGRAM'&&!u.telegram)return reply.code(400).send({success:false,error:{code:'NOT_LINKED',message:'Telegram is not linked.'}});if(p.method==='DISCORD'&&!u.discord)return reply.code(400).send({success:false,error:{code:'NOT_LINKED',message:'Discord is not linked.'}});const challenge=randomToken(32);const code=String(crypto.randomInt(100000,1000000));await db.authChallenge.create({data:{tokenHash:sha(challenge),userId:u.id,type:p.method,codeHash:sha(code),expiresAt:new Date(Date.now()+5*60000)}});return {success:true,data:{challenge,code,expiresIn:300,provider:p.method}}});
  app.post('/api/v1/2fa/bot/approve',async(req,reply)=>{const secret=req.headers['x-bot-secret'];if(!process.env.BOT_SHARED_SECRET||secret!==process.env.BOT_SHARED_SECRET)return reply.code(401).send({success:false,error:{code:'UNAUTHORIZED_BOT',message:'Unauthorized bot.'}});const p=z.object({provider:z.enum(['TELEGRAM','DISCORD']),externalId:z.string(),code:z.string().length(6)}).parse(req.body);const link=p.provider==='TELEGRAM'?await db.telegramLink.findUnique({where:{telegramUserId:p.externalId}}):await db.discordLink.findUnique({where:{discordUserId:p.externalId}});if(!link)return reply.code(404).send({success:false,error:{code:'NOT_LINKED',message:'Account is not linked.'}});const c=await db.authChallenge.findFirst({where:{userId:link.userId,type:p.provider,codeHash:sha(p.code),consumedAt:null,expiresAt:{gt:new Date()}}});if(!c)return reply.code(400).send({success:false,error:{code:'INVALID_CHALLENGE',message:'Challenge is invalid or expired.'}});await db.authChallenge.update({where:{id:c.id},data:{approvedAt:new Date()}});const user=await db.user.findUnique({where:{id:link.userId}});if(user)await db.notification.create({data:{userId:user.id,kind:'SECURITY',title:`${p.provider} verification confirmed`,body:'Your security challenge has been approved.'}});return {success:true,data:{approved:true}}});
  app.post('/api/v1/2fa/link/start',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({provider:z.enum(['TELEGRAM','DISCORD'])}).parse(req.body);const code=String(crypto.randomInt(100000,1000000));const token=randomToken(24);await db.authChallenge.create({data:{tokenHash:sha(token),userId:u.id,type:'ACCOUNT_LINK',codeHash:sha(code),expiresAt:new Date(Date.now()+10*60000),metadata:{provider:p.provider}}});return {success:true,data:{token,code,expiresIn:600,provider:p.provider}}});

  app.post('/api/v1/2fa/bot/link',async(req,reply)=>{const secret=req.headers['x-bot-secret'];if(!process.env.BOT_SHARED_SECRET||secret!==process.env.BOT_SHARED_SECRET)return reply.code(401).send({success:false,error:{code:'UNAUTHORIZED_BOT',message:'Unauthorized bot.'}});const p=z.object({provider:z.enum(['TELEGRAM','DISCORD']),externalId:z.string(),username:z.string().optional(),code:z.string().length(6)}).parse(req.body);const candidates=await db.authChallenge.findMany({where:{type:'ACCOUNT_LINK',codeHash:sha(p.code),consumedAt:null,expiresAt:{gt:new Date()}},take:20});const c=candidates.find((x: typeof candidates[number])=>(x.metadata as any)?.provider===p.provider);if(!c)return reply.code(400).send({success:false,error:{code:'INVALID_CHALLENGE',message:'Link code is invalid or expired.'}});if(p.provider==='TELEGRAM')await db.telegramLink.upsert({where:{userId:c.userId},update:{telegramUserId:p.externalId,username:p.username},create:{userId:c.userId,telegramUserId:p.externalId,username:p.username}});else await db.discordLink.upsert({where:{userId:c.userId},update:{discordUserId:p.externalId,username:p.username},create:{userId:c.userId,discordUserId:p.externalId,username:p.username}});await db.authChallenge.update({where:{id:c.id},data:{consumedAt:new Date()}});const u=await db.user.findUnique({where:{id:c.userId}});if(u){await db.notification.create({data:{userId:u.id,kind:'SECURITY',title:`${p.provider} connected`,body:`Your ${p.provider.toLowerCase()} account has been linked successfully.`}});await audit(u.uid,`${p.provider}_LINKED`,'SECURITY');}return {success:true,data:{linked:true}}});
  app.post('/api/v1/2fa/link/confirm',async(req,reply)=>{const p=z.object({token:z.string(),provider:z.enum(['TELEGRAM','DISCORD']),externalId:z.string(),username:z.string().optional(),code:z.string().length(6)}).parse(req.body);const c=await db.authChallenge.findUnique({where:{tokenHash:sha(p.token)}});if(!c||c.type!=='ACCOUNT_LINK'||c.consumedAt||c.expiresAt<new Date()||c.codeHash!==sha(p.code))return reply.code(400).send({success:false,error:{code:'INVALID_CHALLENGE',message:'Invalid link challenge.'}});if(p.provider==='TELEGRAM')await db.telegramLink.upsert({where:{userId:c.userId},update:{telegramUserId:p.externalId,username:p.username},create:{userId:c.userId,telegramUserId:p.externalId,username:p.username}});else await db.discordLink.upsert({where:{userId:c.userId},update:{discordUserId:p.externalId,username:p.username},create:{userId:c.userId,discordUserId:p.externalId,username:p.username}});await db.authChallenge.update({where:{id:c.id},data:{consumedAt:new Date()}});const u=await db.user.findUnique({where:{id:c.userId}});if(u)await audit(u.uid,`${p.provider}_LINKED`,'SECURITY');return {success:true,data:{linked:true}}});


  app.get('/api/v1/sessions',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});return {success:true,data:await db.session.findMany({where:{userId:u.id,expiresAt:{gt:new Date()}},select:{id:true,createdAt:true,lastSeenAt:true,expiresAt:true,userAgent:true},orderBy:{lastSeenAt:'desc'}})}});
  app.delete('/api/v1/sessions/:id',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});await db.session.deleteMany({where:{id:(req.params as any).id,userId:u.id}});await audit(u.uid,'SESSION_REVOKED','SECURITY');return {success:true,data:{revoked:true}}});
  app.post('/api/v1/sessions/revoke-all',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});await db.session.deleteMany({where:{userId:u.id}});reply.clearCookie(COOKIE,{path:'/'});await audit(u.uid,'ALL_SESSIONS_REVOKED','SECURITY');return {success:true,data:{revoked:true}}});
  app.get('/api/v1/bookmarks',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});return {success:true,data:await db.bookmark.findMany({where:{userId:u.id},orderBy:{createdAt:'desc'}})}});
  app.post('/api/v1/bookmarks',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({kind:z.string().max(32),target:z.string().max(500),title:z.string().max(200)}).parse(req.body);const b=await db.bookmark.upsert({where:{userId_kind_target:{userId:u.id,kind:p.kind,target:p.target}},update:{title:p.title},create:{userId:u.id,kind:p.kind,target:p.target,title:p.title}});return {success:true,data:b}});
  app.delete('/api/v1/bookmarks',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({kind:z.string(),target:z.string()}).parse(req.body);await db.bookmark.deleteMany({where:{userId:u.id,kind:p.kind,target:p.target}});return {success:true,data:{deleted:true}}});
  app.get('/api/v1/notifications',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});return {success:true,data:await db.notification.findMany({where:{userId:u.id},orderBy:{createdAt:'desc'},take:50})}});
  app.post('/api/v1/notifications/read',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({id:z.string().optional(),all:z.boolean().optional()}).parse(req.body);if(p.all)await db.notification.updateMany({where:{userId:u.id,readAt:null},data:{readAt:new Date()}});else if(p.id)await db.notification.updateMany({where:{id:p.id,userId:u.id},data:{readAt:new Date()}});return {success:true,data:{ok:true}}});

  app.get('/api/v1/community/threads',async(req)=>{const q=req.query as any;const types=['ISSUE','QUESTION','SUGGESTION'];const type=types.includes(q.type)?q.type:undefined;const threads=await db.thread.findMany({where:{type,status:q.status||undefined},include:{author:{select:{uid:true,username:true,displayName:true,profile:{select:{avatarUrl:true}}}},tags:{include:{tag:true}},votes:true,replies:true},orderBy:{createdAt:'desc'},take:100});return {success:true,data:threads.map((t: typeof threads[number])=>({...t,score:t.votes.reduce((a: number,v: typeof t.votes[number])=>a+v.value,0),replyCount:t.replies.length}))}});
  app.post('/api/v1/community/threads',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({type:z.enum(['ISSUE','QUESTION','SUGGESTION']),title:z.string().min(5).max(180),body:z.string().min(10),version:z.string().max(32).optional(),severity:z.string().max(32).optional(),tags:z.array(z.string().min(1).max(32)).max(8).default([])}).parse(req.body);const thread=await db.thread.create({data:{type:p.type,title:p.title,body:p.body,authorId:u.id,version:p.version,severity:p.severity}});for(const tagName of p.tags){const tag=await db.tag.upsert({where:{name:tagName},update:{},create:{name:tagName}});await db.threadTag.create({data:{threadId:thread.id,tagId:tag.id}})}await audit(u.uid,`${p.type}_CREATED`,'COMMUNITY');return reply.code(201).send({success:true,data:thread})});
  app.post('/api/v1/community/threads/:id/replies',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({body:z.string().min(2).max(20000)}).parse(req.body);const t=await db.thread.findUnique({where:{id:(req.params as any).id}});if(!t)return reply.code(404).send({success:false,error:{code:'NOT_FOUND',message:'Thread not found.'}});const r=await db.reply.create({data:{threadId:t.id,authorId:u.id,body:p.body}});if(t.authorId!==u.id)await db.notification.create({data:{userId:t.authorId,kind:'COMMUNITY',title:'New reply',body:`${u.displayName} replied to “${t.title}”.`}});return reply.code(201).send({success:true,data:r})});
  app.post('/api/v1/community/threads/:id/vote',async(req,reply)=>{const u=await getUser(req);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const p=z.object({value:z.union([z.literal(-1),z.literal(0),z.literal(1)])}).parse(req.body);const threadId=(req.params as any).id;if(p.value===0)await db.vote.deleteMany({where:{userId:u.id,threadId}});else await db.vote.upsert({where:{userId_threadId:{userId:u.id,threadId}},update:{value:p.value},create:{userId:u.id,threadId,value:p.value}});return {success:true,data:{ok:true}}});

  app.get('/api/v1/admin/roles',{preHandler:guard('OWNER','ADMIN')},async()=>({success:true,data:await db.role.findMany({include:{permissions:{include:{permission:true}},_count:{select:{users:true}}},orderBy:{name:'asc'}})}));
  app.post('/api/v1/admin/roles',{preHandler:guard('OWNER')},async(req,reply)=>{const actor=(req as any).user;const p=z.object({name:z.string().min(2).max(32),description:z.string().max(200).optional()}).parse(req.body);const role=await db.role.create({data:{name:p.name.toUpperCase().replace(/[^A-Z0-9_]/g,'_'),description:p.description,system:false}});await audit(actor.uid,'ROLE_CREATED','ADMIN','success',undefined,{role:role.name});return reply.code(201).send({success:true,data:role})});
  app.get('/api/v1/admin/users',{preHandler:guard('OWNER','ADMIN','MODERATOR')},async()=>({success:true,data:await db.user.findMany({select:{uid:true,username:true,displayName:true,email:true,emailVerifiedAt:true,createdAt:true,suspendedUntil:true,roles:{include:{role:true}}},orderBy:{createdAt:'desc'},take:200})}));
  app.post('/api/v1/admin/users/:uid/role',{preHandler:guard('OWNER')},async(req,reply)=>{const actor=(req as any).user;const target=await db.user.findUnique({where:{uid:(req.params as any).uid}});if(!target)return reply.code(404).send({success:false,error:{code:'NOT_FOUND',message:'User not found.'}});const p=z.object({role:z.string()}).parse(req.body);const role=await db.role.findUnique({where:{name:p.role.toUpperCase()}});if(!role)return reply.code(404).send({success:false,error:{code:'NOT_FOUND',message:'Role not found.'}});await db.userRole.upsert({where:{userId_roleId:{userId:target.id,roleId:role.id}},update:{},create:{userId:target.id,roleId:role.id}});await audit(actor.uid,'USER_ROLE_CHANGED','ADMIN','success',target.uid,{role:role.name});await db.notification.create({data:{userId:target.id,kind:'SECURITY',title:'Role updated',body:`Your role was updated to ${role.name}.`}});return {success:true,data:{uid:target.uid,role:role.name}}});
  app.get('/api/v1/admin/audit',{preHandler:guard('OWNER','ADMIN')},async()=>({success:true,data:await db.auditLog.findMany({orderBy:{createdAt:'desc'},take:300})}));
  app.get('/api/v1/admin/health',{preHandler:guard('OWNER','ADMIN')},async()=>{const dbOk=await db.$queryRaw`SELECT 1`.then(()=>true).catch(()=>false);const latestQa=await db.qaRun.findFirst({orderBy:{createdAt:'desc'}});return {success:true,data:{api:'ok',database:dbOk?'ok':'error',latestQa,now:new Date().toISOString()}}});
  app.get('/api/v1/qa/latest',async()=>({success:true,data:await db.qaRun.findFirst({orderBy:{createdAt:'desc'}})}));
  app.get('/api/v1/performance',async()=>({success:true,data:await db.performanceSample.findMany({orderBy:{createdAt:'asc'},take:1000})}));

  app.post('/api/v1/runtime/reports',async(req,reply)=>{const u=await getUser(req);const p=z.object({libraryVersion:z.string().optional(),commitSha:z.string().optional(),environment:z.record(z.string(),z.any()).optional(),results:z.array(z.record(z.string(),z.any())).min(1)}).parse(req.body);if(!u)return reply.code(401).send({success:false,error:{code:'AUTH_REQUIRED',message:'Authentication required.'}});const r=await db.runtimeReport.create({data:{userId:u.id,libraryVersion:p.libraryVersion,commitSha:p.commitSha,environment:p.environment as any,results:p.results as any}});return reply.code(201).send({success:true,data:r})});

  const port=Number(process.env.API_PORT||8100);
    await app.listen({port,host:'0.0.0.0'});
    app.log.info({port}, 'VoidCriptUI API listening');

}

bootstrap().catch((error)=>{
  app.log.error(error,'API bootstrap failed');
  process.exit(1);
});
