/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("bewerbung-panel")
    .setDescription("Erstellt das Panel für Minecraft-Spielerbewerbungen.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🌿 Bewerbung für unseren Minecraft-Server")
      .setDescription("Du möchtest auf unserem Server spielen? Dann starte hier deine Bewerbung!\n\nKlicke auf **Bewerbung starten**. Es wird ein privater Bewerbungsraum für dich erstellt.");
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("application:start").setLabel("Bewerbung starten").setEmoji("📝").setStyle(ButtonStyle.Success)
    );
    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: "Bewerbungs-Panel wurde erstellt. ✅", ephemeral: true });
  }
};