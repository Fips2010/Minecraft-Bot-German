/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const { SlashCommandBuilder } = require('discord.js');
const store = require('../storage');
const rcon = require('../rcon');

function getConfig() { return store.read('gportal.json', null); }
function allowed(interaction, config) {
  return interaction.user.id === process.env.OWNER_DISCORD_ID ||
    (config?.roleIds || []).some(id => interaction.member?.roles?.cache?.has(id));
}
module.exports = {
  data: new SlashCommandBuilder().setName('whitelist').setDescription('Minecraft-Whitelist verwalten')
    .addSubcommand(s => s.setName('add').setDescription('Spieler zur Whitelist hinzufügen')
      .addStringOption(o => o.setName('minecraft_name').setDescription('Minecraft-Name').setRequired(true).setMaxLength(50)))
    .addSubcommand(s => s.setName('remove').setDescription('Spieler von der Whitelist entfernen')
      .addStringOption(o => o.setName('minecraft_name').setDescription('Minecraft-Name').setRequired(true).setMaxLength(50))),
  async execute(interaction) {
    const config = getConfig();
    if (!config) return interaction.reply({ content: 'G-Portal ist noch nicht mit `/config gportal` eingerichtet.', ephemeral: true });
    if (!allowed(interaction, config)) return interaction.reply({ content: 'Du hast keine Rolle für die G-Portal-Verwaltung.', ephemeral: true });
    const sub = interaction.options.getSubcommand();
    const name = interaction.options.getString('minecraft_name').trim();
    if (!/^[A-Za-z0-9_.-]{1,50}$/.test(name)) return interaction.reply({ content: 'Bitte einen gültigen Minecraft-Namen eingeben.', ephemeral: true });
    await interaction.deferReply({ ephemeral: true });
    try {
      const result = await rcon.execute(config.host, config.port, config.password, `whitelist ${sub} ${name}`);
      return interaction.editReply(`✅ Whitelist-Befehl für **${name}** ausgeführt.\n${result.slice(0, 1500) || 'RCON hat keine zusätzliche Rückmeldung gesendet.'}`);
    } catch (e) { return interaction.editReply(`❌ Whitelist-Aktion fehlgeschlagen: ${e.message}`); }
  }
};
