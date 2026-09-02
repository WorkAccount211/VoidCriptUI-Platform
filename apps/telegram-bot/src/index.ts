import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import {Bot} from 'grammy';
const token=process.env.TELEGRAM_BOT_TOKEN;
const api=process.env.API_INTERNAL_URL||'http://127.0.0.1:8100';
const secret=process.env.BOT_SHARED_SECRET||'';
if(!token) throw new Error('TELEGRAM_BOT_TOKEN is required');
const bot=new Bot(token);
async function post(path:string,body:any){const r=await fetch(`${api}${path}`,{method:'POST',headers:{'content-type':'application/json','x-bot-secret':secret},body:JSON.stringify(body)});return r.json()}
bot.command('start',ctx=>ctx.reply('VoidCriptUI Security Bot\n\nUse /link CODE to connect your account.\nUse /verify CODE to approve a security challenge.\nNever send passwords, TOTP secrets or recovery codes.'));
bot.command('help',ctx=>ctx.reply('Commands:\n/link CODE — connect your VoidCriptUI account\n/verify CODE — approve a one-time security challenge\n/status — check bot connectivity'));
bot.command('link',async ctx=>{if(!ctx.from)return ctx.reply('Unable to identify the Telegram account. Please try again.');const code=ctx.match.trim();if(!/^\\d{6}$/.test(code))return ctx.reply('Send the 6-digit linking code from VoidCriptUI Settings → Security.');const r:any=await post('/api/v1/2fa/bot/link',{provider:'TELEGRAM',externalId:String(ctx.from.id),username:ctx.from.username,code});return ctx.reply(r?.success?'Telegram connected successfully.':'Could not link the account. The code may be invalid or expired.');});
bot.command('verify',async ctx=>{if(!ctx.from)return ctx.reply('Unable to identify the Telegram account. Please try again.');const code=ctx.match.trim();if(!/^\\d{6}$/.test(code))return ctx.reply('Send the 6-digit security code shown by VoidCriptUI.');const r:any=await post('/api/v1/2fa/bot/approve',{provider:'TELEGRAM',externalId:String(ctx.from.id),code});return ctx.reply(r?.success?'Security challenge approved. You can return to VoidCriptUI.':'Challenge rejected or expired.');});
bot.command('status',ctx=>ctx.reply('Bot is online. Identity and permissions are resolved by the VoidCriptUI API.'));
bot.catch(err=>console.error('Telegram bot error',err));
bot.start();
