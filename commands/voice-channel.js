/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const store = require('../storage');
const rcon = require('../rcon');

function config() { return store.read('voice-channel.json', {}); }
function allowed(interaction, cfg) {
  return interaction.user.id === process.env.OWNER_DISCORD_ID ||
    interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild) ||
    (cfg.roleIds || []).some(id => interaction.member?.roles?.cache?.has(id));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('voice-channel')
    .setDescription('Minecraft-Spielerzahl als Discord-Voice-Channel anzeigen')
    .addChannelOption(o => o.setName('kategorie').setDescription('Discord-Kategorie für den Voice-Channel').addChannelTypes(ChannelType.GuildCategory).setRequired(true))
    .addStringOption(o => o.setName('name').setDescription('Channelname (Standard: Minecraft Server)').setMaxLength(90)),
  async execute(interaction) {
    const cfg = config();
    if (!allowed(interaction, cfg)) return interaction.reply({ content: 'Nur der Bot-Owner, Server-Admins oder konfigurierte Rollen dürfen den Voice-Channel einstellen.', ephemeral: true });
    const category = interaction.options.getChannel('kategorie', true);
    const name = interaction.options.getString('name')?.trim() || cfg.channelName || 'Minecraft Server';
    const old = cfg.channelId ? await interaction.guild.channels.fetch(cfg.channelId).catch(() => null) : null;
    await interaction.deferReply({ ephemeral: true });
    try {
      let channel = old;
      if (channel && channel.type === ChannelType.GuildVoice) {
        await channel.setParent(category.id);
        await channel.setName(name);
      } else {
        channel = await interaction.guild.channels.create({ name, type: ChannelType.GuildVoice, parent: category.id });
      }
      store.write('voice-channel.json', { ...cfg, enabled: true, guildId: interaction.guildId, channelId: channel.id, categoryId: category.id, channelName: name, updateInterval: cfg.updateInterval || 120 });
      return interaction.editReply(`✅ Voice-Channel ${channel} wurde eingerichtet. Die Spielerzahl wird alle ${cfg.updateInterval || 120} Sekunden aktualisiert.`);
    } catch (e) {
      return interaction.editReply(`❌ Voice-Channel konnte nicht eingerichtet werden: ${e.message}`);
    }
  }
};
