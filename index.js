/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const { Client, GatewayIntentBits, Partials, REST, Routes, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const store = require("./storage");
const rcon = require("./rcon");
const required=["DISCORD_TOKEN","CLIENT_ID","GUILD_ID","APPLICATIONS_CHANNEL_ID"];
for(const key of required){if(!process.env[key]||process.env[key].startsWith("HIER_")){console.error(`❌ Bitte ${key} in der .env eintragen.`);process.exit(1);}}
const client=new Client({intents:[GatewayIntentBits.Guilds],partials:[Partials.Channel]});
const commands=[],commandMap=new Map(),pendingForms=new Map();
const commandsPath=path.join(__dirname,"commands");
for(const file of fs.readdirSync(commandsPath).filter(f=>f.endsWith(".js"))){const command=require(path.join(commandsPath,file));commands.push(command.data.toJSON());commandMap.set(command.data.name,command);}
async function registerCommands(){const rest=new REST({version:"10"}).setToken(process.env.DISCORD_TOKEN);await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID,process.env.GUILD_ID),{body:commands});console.log(`✅ ${commands.length} Slash-Command(s) registriert.`);}
function row(...buttons){return new ActionRowBuilder().addComponents(...buttons);}
function settings(){return store.read("settings.json",{});}
async function updateVoicePlayerCount(){
 const cfg=store.read("voice-channel.json",{});if(!cfg.enabled||!cfg.channelId||!cfg.guildId)return;
 const gp=store.read("gportal.json",null);if(!gp)return;
 try{
  const output=await rcon.execute(gp.host,gp.port,gp.password,"list");
  const match=String(output||"").match(/There are\s+(\d+)\s+of a max of\s+(\d+)\s+players online/i)||String(output||"").match(/\b(\d+)\s*\/\s*(\d+)\s*players?\b/i);
  if(!match)return;
  const players=Number(match[1]),maxPlayers=Number(match[2]);
  const baseName=cfg.channelName||"Minecraft Server";let name=baseName.replace(/\{players\}/g,String(players)).replace(/\{maxPlayers\}/g,String(maxPlayers));if(!baseName.includes("{players}")&&!baseName.includes("{maxPlayers}"))name=`${name} · ${players}/${maxPlayers}`;
  const guild=client.guilds.cache.get(cfg.guildId);if(!guild)return;
  const channel=await guild.channels.fetch(cfg.channelId).catch(()=>null);if(channel&&channel.type===ChannelType.GuildVoice&&channel.name!==name)await channel.setName(name);
 }catch(e){console.error("❌ Voice-Channel-Spielerzahl konnte nicht aktualisiert werden:",e.message);}
}
function staffIds(){return settings().teamRoleIds||[];}
function appButtons(id,disabled=false){return row(new ButtonBuilder().setCustomId(`application:accept:${id}`).setLabel("Annehmen").setStyle(ButtonStyle.Success).setEmoji("✅").setDisabled(disabled),new ButtonBuilder().setCustomId(`application:reject:${id}`).setLabel("Ablehnen").setStyle(ButtonStyle.Danger).setEmoji("❌").setDisabled(disabled));}
function ticketControls(){return row(new ButtonBuilder().setCustomId("ticket:close").setLabel("Ticket schließen").setEmoji("🗑️").setStyle(ButtonStyle.Danger));}
function isStaff(member){return member.permissions.has(PermissionFlagsBits.ManageGuild)||member.id===process.env.OWNER_DISCORD_ID||staffIds().some(id=>member.roles.cache.has(id));}
async function createTicket(interaction){const guild=interaction.guild;const existing=guild.channels.cache.find(c=>c.type===ChannelType.GuildText&&c.topic===`Minecraft-Bewerbung von ${interaction.user.id}`);if(existing)return interaction.reply({content:`Du hast bereits einen Bewerbungsraum: ${existing}`,ephemeral:true});
 const config=settings();const overwrites=[{id:guild.roles.everyone.id,deny:[PermissionFlagsBits.ViewChannel]},{id:interaction.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]},{id:client.user.id,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory,PermissionFlagsBits.ManageChannels]}];
 for(const roleId of staffIds())overwrites.push({id:roleId,allow:[PermissionFlagsBits.ViewChannel,PermissionFlagsBits.SendMessages,PermissionFlagsBits.ReadMessageHistory]});
 const channel=await guild.channels.create({name:`bewerbung-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g,"").slice(0,80),type:ChannelType.GuildText,parent:config.ticketCategoryId||undefined,topic:`Minecraft-Bewerbung von ${interaction.user.id}`,permissionOverwrites:overwrites});
 const embed=new EmbedBuilder().setColor(0x3498db).setTitle("📝 Dein Bewerbungsraum").setDescription(`Hallo ${interaction.user}!\n\nWähle zuerst deine Minecraft-Version (**Java** oder **Bedrock**) aus. Danach kannst du das Bewerbungsformular ausfüllen. Das zuständige Team kann hier bei Rückfragen mit dir schreiben. Der Raum bleibt bestehen, bis ein Teammitglied ihn schließt.`);
 await channel.send({embeds:[embed],components:[row(new ButtonBuilder().setCustomId("application:form:java").setLabel("Java Edition").setEmoji("☕").setStyle(ButtonStyle.Primary),new ButtonBuilder().setCustomId("application:form:bedrock").setLabel("Bedrock Edition").setEmoji("🪨").setStyle(ButtonStyle.Success)),ticketControls()]});
 await interaction.reply({content:`Dein privater Bewerbungsraum wurde erstellt: ${channel}`,ephemeral:true});}
function firstModal(edition){const modal=new ModalBuilder().setCustomId(`application:step1:${edition}`).setTitle("Minecraft-Bewerbung · 1/2");const fields=[["age","Wie alt bist du?","z. B. 16",30],["source","Woher kennst du den Server?","z. B. Discord / Freunde",100],["reason","Warum möchtest du mitspielen?","Was reizt dich an unserem Server?",400],["activity","Wie aktiv wirst du ungefähr sein?","z. B. mehrmals pro Woche",150],["minecraft","Dein Ingame-Name","Dein Minecraft-Name",50]];for(const [id,label,placeholder,max] of fields)modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(placeholder).setStyle(id==="reason"?TextInputStyle.Paragraph:TextInputStyle.Short).setRequired(true).setMaxLength(max)));return modal;}
function secondModal(){const modal=new ModalBuilder().setCustomId("application:step2").setTitle("Minecraft-Bewerbung · 2/2");for(const [id,label,placeholder,max] of [["experience","Deine Minecraft-Erfahrung","Seit wann spielst du? Welche Modi (Survival, SMP, Creative, PvP) magst du?",300],["about","Erzähl etwas über dich","Hobbys, Interessen usw.",400]])modal.addComponents(new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(placeholder).setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(max)));return modal;}
client.once("ready",async()=>{console.log(`🤖 Eingeloggt als ${client.user.tag}`);try{await registerCommands();}catch(e){console.error("❌ Slash-Commands konnten nicht registriert werden:",e);}await updateVoicePlayerCount();setInterval(updateVoicePlayerCount,120000);});
client.on("interactionCreate",async interaction=>{try{
 if(interaction.isChatInputCommand()){const command=commandMap.get(interaction.commandName);if(command)await command.execute(interaction);return;}
 if(interaction.isButton()){
  if(interaction.customId==="application:start")return createTicket(interaction);
  if(interaction.customId==="application:form:java")return interaction.showModal(firstModal("java"));
  if(interaction.customId==="application:form:bedrock")return interaction.showModal(firstModal("bedrock"));
  if(interaction.customId==="application:continue"){const pending=pendingForms.get(interaction.user.id);if(!pending)return interaction.reply({content:"Dein Formular ist abgelaufen. Bitte starte die Bewerbung erneut.",ephemeral:true});return interaction.showModal(secondModal());}
  if(interaction.customId==="ticket:close"){
   const channel=interaction.channel;if(!channel||!channel.topic?.startsWith("Minecraft-Bewerbung von "))return interaction.reply({content:"Das ist kein Bewerbungs-Ticket.",ephemeral:true});
   if(!isStaff(interaction.member))return interaction.reply({content:"Nur das zuständige Team darf Tickets schließen.",ephemeral:true});
   await interaction.reply({content:"Ticket wird geschlossen und gelöscht.",ephemeral:true});return channel.delete().catch(console.error);
  }
  if(interaction.customId.startsWith("application:accept:")||interaction.customId.startsWith("application:reject:")){
   const isAccept=interaction.customId.startsWith("application:accept:");const id=interaction.customId.split(":")[2];const applications=store.read("applications.json",[]);const app=applications.find(a=>a.id===id);if(!app)return interaction.reply({content:"Diese Bewerbung wurde nicht gefunden.",ephemeral:true});if(app.status!=="pending")return interaction.reply({content:"Diese Bewerbung wurde bereits bearbeitet.",ephemeral:true});if(!isStaff(interaction.member))return interaction.reply({content:"Du hast keine Berechtigung, Bewerbungen zu bearbeiten.",ephemeral:true});
   app.status=isAccept?"accepted":"rejected";app.reviewedBy=interaction.user.id;app.reviewedAt=new Date().toISOString();store.write("applications.json",applications);await interaction.update({components:[appButtons(id,true)]});let whitelistNotice="";if(isAccept){const gp=store.read("gportal.json",null);if(gp&&app.answers?.minecraft){try{await new Promise(resolve=>setTimeout(resolve,20000));const result=await rcon.execute(gp.host,gp.port,gp.password,`whitelist add ${app.answers.minecraft}`);whitelistNotice=`\n\n⏳ Minecraft-Name **${app.answers.minecraft}** wurde nach 20 Sekunden zur Whitelist hinzugefügt.`;}catch(e){whitelistNotice=`\n\n⚠️ Automatische Whitelist für **${app.answers.minecraft}** fehlgeschlagen: ${e.message}`;}}else if(isAccept)whitelistNotice="\n\nℹ️ Automatische Whitelist übersprungen: G-Portal ist nicht konfiguriert.";}const ticket=interaction.guild.channels.cache.find(c=>c.type===ChannelType.GuildText&&c.topic===`Minecraft-Bewerbung von ${app.userId}`);if(ticket){await ticket.send({content:`<@${app.userId}>${whitelistNotice}\n${isAccept?"🎉 **Deine Bewerbung wurde angenommen!**\n\nHerzlichen Glückwunsch und herzlich willkommen auf unserem Minecraft-Server! Wir freuen uns sehr, dass du Teil unserer Community werden möchtest.\n\nBevor du dich ins Abenteuer stürzt, bitten wir dich, dir unsere Serverregeln aufmerksam durchzulesen. Sie helfen dabei, dass sich alle Spieler bei uns wohlfühlen und gemeinsam eine schöne Zeit verbringen können.\n\nWir wünschen dir viel Spaß beim Bauen, Erkunden, Spielen und natürlich beim Kennenlernen unserer Community. Wir freuen uns darauf, dich bald ingame zu sehen und wünschen dir viele tolle Momente auf unserem Server! 🌍⛏️":"💌 **Deine Bewerbung wurde leider abgelehnt.**\n\nVielen Dank, dass du dir die Zeit genommen hast, dich bei uns zu bewerben und Interesse an unserem Minecraft-Server gezeigt hast. Leider hat es diesmal nicht ganz gereicht. Bitte nimm diese Entscheidung nicht persönlich – sie bedeutet nicht, dass wir dich als Person nicht schätzen.\n\nFalls du Fragen zu unserer Entscheidung hast oder gerne genauer wissen möchtest, woran es gelegen hat, kannst du dich jederzeit gerne hier in diesem Ticket an unser Team wenden. Wir nehmen uns gerne die Zeit, dir unsere Entscheidung näher zu erklären.\n\nLass dich davon bitte nicht entmutigen! Vielleicht ergibt sich zu einem späteren Zeitpunkt eine neue Gelegenheit. Wir wünschen dir trotzdem alles Gute und weiterhin viel Spaß beim Minecraft-Spielen! 💚"}`});}return;
  }
 }
 if(interaction.isModalSubmit()&&interaction.customId.startsWith("gportal-config:")){
  const [,ownerId,roleCsv]=interaction.customId.split(":");
  if(interaction.user.id!==ownerId||(interaction.user.id!==process.env.OWNER_DISCORD_ID&&!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)))return interaction.reply({content:"Du darfst diese Konfiguration nicht speichern.",ephemeral:true});
  const host=interaction.fields.getTextInputValue("host").trim();const port=Number(interaction.fields.getTextInputValue("port").trim());const password=interaction.fields.getTextInputValue("password");
  if(!Number.isInteger(port)||port<1||port>65535)return interaction.reply({content:"Bitte einen gültigen RCON-Port (1–65535) eingeben.",ephemeral:true});
  await interaction.deferReply({ephemeral:true});
  try{await rcon.authenticate(host,port,password);store.write("gportal.json",{host,port,password,roleIds:roleCsv?roleCsv.split(",").filter(Boolean):[],configuredBy:interaction.user.id,configuredAt:new Date().toISOString()});return interaction.editReply("✅ RCON-Verbindung erfolgreich getestet. G-Portal-Konfiguration wurde gespeichert. Das Passwort wird lokal in data/gportal.json abgelegt; sichere den Datei-Zugriff und teile die Datei nicht.");}
  catch(e){return interaction.editReply(`❌ RCON-Test fehlgeschlagen: ${e.message}\nDie Konfiguration wurde nicht gespeichert. Prüfe IP, RCON-Port, Passwort und ob RCON am Server aktiv ist.`);}
 }
 if(interaction.isModalSubmit()&&(interaction.customId==="application:step1:java"||interaction.customId==="application:step1:bedrock")){
  const edition=interaction.customId.endsWith(":bedrock")?"bedrock":"java";const answers={edition};for(const id of ["age","source","reason","activity","minecraft"])answers[id]=interaction.fields.getTextInputValue(id);if(edition==="bedrock"&&!answers.minecraft.startsWith("."))answers.minecraft="."+answers.minecraft;pendingForms.set(interaction.user.id,answers);
  return interaction.reply({content:"Danke! Der erste Teil ist gespeichert. Klicke auf **Weiter**, um den zweiten Teil auszufüllen.",ephemeral:true,components:[row(new ButtonBuilder().setCustomId("application:continue").setLabel("Weiter").setEmoji("➡️").setStyle(ButtonStyle.Primary))]});
 }
 if(interaction.isModalSubmit()&&interaction.customId==="application:step2"){
  const firstAnswers=pendingForms.get(interaction.user.id);if(!firstAnswers)return interaction.reply({content:"Der erste Formularteil ist nicht mehr vorhanden. Bitte starte die Bewerbung erneut.",ephemeral:true});pendingForms.delete(interaction.user.id);
  const id=`${Date.now()}-${interaction.user.id}`;const app={id,userId:interaction.user.id,username:interaction.user.username,createdAt:new Date().toISOString(),status:"pending",answers:{...firstAnswers,experience:interaction.fields.getTextInputValue("experience"),about:interaction.fields.getTextInputValue("about")}};
  const applications=store.read("applications.json",[]);applications.push(app);store.write("applications.json",applications);const target=await client.channels.fetch(process.env.APPLICATIONS_CHANNEL_ID);if(!target||!target.isTextBased())throw new Error("APPLICATIONS_CHANNEL_ID ist kein Textkanal.");
  const embed=new EmbedBuilder().setColor(0xf1c40f).setTitle("📨 Neue Minecraft-Bewerbung").setDescription(`Bewerber: <@${app.userId}> (${app.username})\nEdition: **${app.answers.edition==="bedrock"?"Bedrock":"Java"}**\nMinecraft-Name: **${app.answers.minecraft}**`).addFields({name:"Alter",value:app.answers.age,inline:true},{name:"Woher kennt der Server?",value:app.answers.source,inline:true},{name:"Aktivität",value:app.answers.activity,inline:true},{name:"Minecraft-Erfahrung",value:app.answers.experience,inline:true},{name:"Warum möchtest du spielen?",value:app.answers.reason},{name:"Über die Person",value:app.answers.about}).setFooter({text:`Bewerbungs-ID: ${id}`}).setTimestamp();
  const roleMentions=staffIds().map(r=>`<@&${r}>`).join(" ");await target.send({content:roleMentions||undefined,allowedMentions:{roles:staffIds()},embeds:[embed],components:[appButtons(id)]});const ticket=interaction.channel;await interaction.reply({content:"Danke! Deine Bewerbung wurde an das Team gesendet. Dieser Raum bleibt für Rückfragen offen, bis das Team ihn schließt.",ephemeral:true});await ticket.send({content:"✅ Deine Bewerbung wurde erfolgreich übermittelt. Das Team kann hier bei Rückfragen schreiben. Bitte warte auf die Entscheidung."});
 }
 }catch(error){console.error(error);if(interaction.isRepliable()&&!interaction.replied&&!interaction.deferred){const msg=error?.code===50013?"Dem Bot fehlen Berechtigungen zum Ändern der Ticket-Rechte. Bitte gib seiner Serverrolle **Kanäle verwalten** und prüfe die Rollen-/Kanalhierarchie.":"Es ist ein Fehler aufgetreten. Bitte prüfe die Bot-Konsole oder wende dich ans Team.";await interaction.reply({content:msg,ephemeral:true}).catch(()=>{});}}});
client.login(process.env.DISCORD_TOKEN);
