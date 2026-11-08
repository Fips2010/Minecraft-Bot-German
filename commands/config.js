/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const { SlashCommandBuilder, PermissionFlagsBits, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const store = require('../storage');
module.exports = {
 data: new SlashCommandBuilder().setName('config').setDescription('Konfiguration des Bots')
  .addSubcommand(s=>s.setName('gportal').setDescription('G-Portal/RCON-Zugang und erlaubte Rollen konfigurieren')
   .addRoleOption(o=>o.setName('rolle1').setDescription('Darf G-Portal-Funktionen nutzen').setRequired(true))
   .addRoleOption(o=>o.setName('rolle2').setDescription('Weitere erlaubte Rolle'))
   .addRoleOption(o=>o.setName('rolle3').setDescription('Weitere erlaubte Rolle'))
   .addRoleOption(o=>o.setName('rolle4').setDescription('Weitere erlaubte Rolle'))
   .addRoleOption(o=>o.setName('rolle5').setDescription('Weitere erlaubte Rolle'))),
 async execute(interaction){
  if(interaction.user.id!==process.env.OWNER_DISCORD_ID&&!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) return interaction.reply({content:'Nur der Bot-Owner oder Mitglieder mit Server verwalten dürfen das konfigurieren.',ephemeral:true});
  const roles=[1,2,3,4,5].map(n=>interaction.options.getRole(`rolle${n}`)).filter(Boolean).map(r=>r.id);
  const modal=new ModalBuilder().setCustomId(`gportal-config:${interaction.user.id}:${roles.join(',')}`).setTitle('G-Portal RCON konfigurieren');
  for(const [id,label,placeholder,max] of [['host','Minecraft-Server-IP','server.example.net',200],['port','RCON-Port','25575',10],['password','RCON-Passwort','Dein RCON-Passwort',200]]){
   const input=new TextInputBuilder().setCustomId(id).setLabel(label).setPlaceholder(placeholder).setRequired(true).setMaxLength(max).setStyle(id==='password'?TextInputStyle.Short:TextInputStyle.Short);
   if(id==='password')input.setMinLength(1);
   modal.addComponents(new ActionRowBuilder().addComponents(input));
  }
  await interaction.showModal(modal);
 }
};
