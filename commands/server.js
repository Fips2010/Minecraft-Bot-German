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
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Minecraft-Server über RCON verwalten')
    .addSubcommand(s => s.setName('stop').setDescription('Minecraft-Server stoppen'))
    .addSubcommand(s => s.setName('restart').setDescription('Minecraft-Server neustarten (Stop-Befehl; automatischer Neustart abhängig von G-Portal)')),
  async execute(interaction) {
    const config = getConfig();
    if (!config) return interaction.reply({ content: 'G-Portal ist noch nicht mit `/config gportal` eingerichtet.', ephemeral: true });
    if (!allowed(interaction, config)) return interaction.reply({ content: 'Du hast keine Rolle für die G-Portal-Verwaltung.', ephemeral: true });

    const sub = interaction.options.getSubcommand();
    await interaction.deferReply({ ephemeral: true });
    try {
      // Minecraft's standard console command is `stop`. RCON cannot start an offline server;
      // restart relies on the host's configured auto-restart behavior after stop.
      const result = await rcon.execute(config.host, config.port, config.password, 'stop');
      if (sub === 'stop') {
        return interaction.editReply(`🛑 Der Stop-Befehl wurde an den Minecraft-Server gesendet.${result ? `\n${result.slice(0, 1000)}` : ''}`);
      }
      return interaction.editReply(`🔄 Der Stop-Befehl für den Neustart wurde gesendet. Ob G-Portal den Server automatisch wieder startet, hängt von dessen Einstellung ab.${result ? `\n${result.slice(0, 1000)}` : ''}`);
    } catch (e) {
      return interaction.editReply(`❌ Server-Aktion fehlgeschlagen: ${e.message}`);
    }
  }
};
