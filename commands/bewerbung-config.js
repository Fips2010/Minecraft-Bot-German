/*
 * Minecraft Discord Manager
 * Original project author: Philip (Fips2010)
 * Discord user ID: 1312508991162683436
 * Please retain this attribution when redistributing or adapting this project.
 */

const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require("discord.js");
const store = require("../storage");
module.exports = {
 data: new SlashCommandBuilder().setName("bewerbung-config").setDescription("Stellt Kategorie und Teamrollen für Bewerbungen ein.").setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addChannelOption(o=>o.setName("kategorie").setDescription("Kategorie, in der Bewerber-Tickets erstellt werden").addChannelTypes(ChannelType.GuildCategory).setRequired(true))
  .addRoleOption(o=>o.setName("teamrolle1").setDescription("Teamrolle: wird gepingt und erhält Ticket-Zugriff").setRequired(true))

  .addRoleOption(o=>o.setName("teamrolle2").setDescription("Weitere Teamrolle (optional)"))
  .addRoleOption(o=>o.setName("teamrolle3").setDescription("Weitere Teamrolle (optional)"))
  .addRoleOption(o=>o.setName("teamrolle4").setDescription("Weitere Teamrolle (optional)"))
  .addRoleOption(o=>o.setName("teamrolle5").setDescription("Weitere Teamrolle (optional)"))
  .addRoleOption(o=>o.setName("teamrolle6").setDescription("Weitere Teamrolle (optional)"))
  .addRoleOption(o=>o.setName("teamrolle7").setDescription("Weitere Teamrolle (optional)"))
  .addRoleOption(o=>o.setName("teamrolle8").setDescription("Weitere Teamrolle (optional)")),
 async execute(interaction) {
  const category=interaction.options.getChannel("kategorie");
  const roles=["teamrolle1","teamrolle2","teamrolle3","teamrolle4","teamrolle5","teamrolle6","teamrolle7","teamrolle8"].map(n=>interaction.options.getRole(n)).filter(Boolean);
  store.write("settings.json", {ticketCategoryId:category.id, teamRoleIds:roles.map(r=>r.id)});
  await interaction.reply({content:`✅ Bewerbungs-Kategorie: ${category}\nTeamrollen (Zugriff + Ping): ${roles.map(r=>r.toString()).join(", ")}\nDie Einstellung gilt für neu erstellte Bewerbungen.`,ephemeral:true});
 }
};
