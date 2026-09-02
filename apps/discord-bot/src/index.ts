import path from 'node:path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import {Client,GatewayIntentBits,REST,Routes,SlashCommandBuilder} from 'discord.js';
const token=process.env.DISCORD_BOT_TOKEN;if(!token)throw new Error('DISCORD_BOT_TOKEN is required');
const api=process.env.API_INTERNAL_URL||'http://127.0.0.1:8100'; const secret=process.env.BOT_SHARED_SECRET||''; const guildId=process.env.DISCORD_GUILD_ID||''; const notificationChannelId=process.env.DISCORD_NOTIFICATION_CHANNEL_ID||'';
const client=new Client({intents:[GatewayIntentBits.Guilds]});
const defs=[['link','Connect the current Discord account using the 6-digit code from VoidCriptUI.'],['verify','Approve a VoidCriptUI security challenge.'],['status','Check bot status.']].map(([name,description])=>new SlashCommandBuilder().setName(name).setDescription(description).addStringOption(o=>o.setName('code').setDescription('6-digit code').setRequired(name!=='status'))).map(x=>x.toJSON());
async function post(path:string,body:any){const r=await fetch(`${api}${path}`,{method:'POST',headers:{'content-type':'application/json','x-bot-secret':secret},body:JSON.stringify(body)});return r.json()}
client.once('ready',async()=>{const rest=new REST({version:'10'}).setToken(token);const appId=client.user!.id;const guild=guildId;if(guild)await rest.put(Routes.applicationGuildCommands(appId,guild),{body:defs});else await rest.put(Routes.applicationCommands(appId),{body:defs});console.log(`Discord bot online as ${client.user?.tag}${notificationChannelId?` · notifications ${notificationChannelId}`:''}`)});
client.on('interactionCreate',async i=>{if(!i.isChatInputCommand())return;const code=i.options.getString('code')||'';if(i.commandName==='status')return i.reply({content:'VoidCriptUI Security Bot is online.',ephemeral:true});if(!/^\\d{6}$/.test(code))return i.reply({content:'Use a valid 6-digit code from VoidCriptUI.',ephemeral:true});if(i.commandName==='link'){const r:any=await post('/api/v1/2fa/bot/link',{provider:'DISCORD',externalId:i.user.id,username:i.user.username,code});return i.reply({content:r?.success?'Discord connected successfully.':'Could not link the account. The code may be invalid or expired.',ephemeral:true})}const r:any=await post('/api/v1/2fa/bot/approve',{provider:'DISCORD',externalId:i.user.id,code});return i.reply({content:r?.success?'Security challenge approved.':'Challenge rejected or expired.',ephemeral:true})});
client.login(token);
