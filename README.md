# Minecraft Discord Manager

A Discord bot for Minecraft community administration, application handling, and Minecraft server control through RCON.

> **Project author:** Philip (**Fips2010**)  
> **Discord user ID:** `1312508991162683436`  
> This attribution identifies the original project author. Please retain it when redistributing or adapting this repository.

## Features

- Discord slash commands
- Minecraft player application panel and private ticket workflow
- Java / Bedrock selection and two-part application form
- Configurable application ticket category and up to eight team roles
- Application review with accept / reject actions
- G-Portal Minecraft server control through RCON
- Whitelist add / remove commands
- Voice channel showing the server player count (periodic updates)
- Local JSON persistence for runtime settings and application data

## Requirements

- Node.js 22.x
- A Discord application and bot
- A Discord server where the bot is installed
- Minecraft server with RCON enabled and reachable from the bot host

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Fips2010/Minecraft-Bot-German/upload
cd YOUR-REPOSITORY
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your own values:

```env
DISCORD_TOKEN=YOUR_DISCORD_BOT_TOKEN
CLIENT_ID=YOUR_DISCORD_APPLICATION_ID
GUILD_ID=YOUR_DISCORD_SERVER_ID
OWNER_DISCORD_ID=YOUR_DISCORD_USER_ID
APPLICATIONS_CHANNEL_ID=YOUR_TEAM_APPLICATIONS_CHANNEL_ID
```

`APPLICATIONS_CHANNEL_ID` must point to the private team channel in which application submissions are reviewed.

**Never publish your real `.env` file, bot token, RCON password, or private application data.**

### 3. Install dependencies and start

```bash
npm install
npm start
```

Slash commands are registered in the configured Discord server when the bot starts.

## Slash commands

| Command | Description |
|---|---|
| `/bewerbung-panel` | Posts the Minecraft application panel in the current channel. Requires Manage Server. |
| `/bewerbung-config` | Configures the ticket category and team roles. Requires Manage Server. |
| `/config gportal` | Configures the G-Portal/RCON connection and allowed roles. Bot owner or Manage Server permission. |
| `/server stop` | Sends the Minecraft `stop` command through RCON. |
| `/server restart` | Sends `stop`; automatic restart depends on the host's restart behavior. |
| `/whitelist add` | Adds a Minecraft player to the whitelist through RCON. |
| `/whitelist remove` | Removes a Minecraft player from the whitelist through RCON. |
| `/voice-channel` | Creates or configures the voice channel used to display player count. |
| `/ping` | Not included in the current command set. |

## Application workflow

1. A player opens the application panel and starts an application.
2. The bot creates a private ticket.
3. The player selects Java or Bedrock and completes the two-part form.
4. The application is sent to the configured team review channel.
5. Team members accept or reject the application.
6. The decision message remains in the team channel with its decision buttons disabled.

For Bedrock players, a leading dot is added to the Minecraft username when needed.

When an application is accepted, the bot attempts to add the submitted Minecraft name to the configured server whitelist through G-Portal RCON. The RCON configuration must be set up correctly for this to work.

Ticket channels remain until an authorized team member closes them with **Ticket schließen**.

## Configuration

### Application configuration

Run `/bewerbung-config` to select:
- The category in which application tickets are created
- Up to eight team roles (team role 1 is required)

Configured team roles receive access to application tickets and are pinged for new submissions.

### G-Portal / RCON configuration

Run `/config gportal` and provide the Minecraft server address, RCON port, RCON password, and allowed Discord roles.

RCON must be enabled in the Minecraft server settings and reachable from the bot host. Do not expose the RCON port or password publicly.

### Player-count voice channel

Run `/voice-channel` and select a Discord category. The channel name can optionally be customized. The displayed player count is refreshed periodically while RCON is available.

## Runtime data

The bot stores application and configuration data in JSON files under `data/`. These are runtime files and are intentionally excluded from Git because they may contain private application details or server credentials.

Back up runtime data securely before updating or reinstalling the bot.

## Hosting

The project can run on a Node.js 22-compatible host, including Wispbyte. Configure the environment variables in the hosting panel and keep the existing private `.env` file when deploying updates.

## Security notes

- Do not commit `.env` or runtime `data/*.json` files.
- Do not share your Discord bot token or RCON password.
- Grant the bot only the Discord permissions it needs.
- Keep the application review channel private and accessible only to the team.
- Rotate credentials if they are accidentally published.

## Author

**Philip — Fips2010**  
Discord ID: `1312508991162683436`

This repository was created by Philip (Fips2010). The author attribution is included in the repository documentation and source headers.

## License

No open-source license is currently provided. Until a license is added, the code remains under the copyright of its author; public availability does not automatically grant permission to reuse, modify, or redistribute it.
