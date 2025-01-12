# Xia0lan Bot
Xia0lan Bot is a feature-rich Discord bot designed to help assist server staff, leveraging the Google Sheets API for no-code, dynamic configuration.
## Features (in progress)
- **Google Sheets Support**: Built-in integration with Google Sheets using the `google-spreadsheet` library, allowing for straightforward data management and configuration.
- **Rota Reminders**: Configure rotas in your Sheet and have the bot automatically ping selected IDs in specified channels.
- **Echo**: Simple echo command.

## Prerequisites
Before using this bot, ensure you:
1. Have installed Node.js.
2. Have access to a Discord server where you can add bots.
3. Have created a bot on the Discord Developer Portal.
4. Have a Google Service Account set up with access to the sheet you want to use for configuration.

## Getting Started
Follow these steps to set up and start the bot:
### Clone the repository
Begin by cloning the bot project:
``` bash
git clone <repository-url>
cd xiaolan-bot
```
### Install Dependencies
Install the required npm packages:
``` bash
npm install
```
### Configure Environment Variables
Create a `.env` file in the root directory of the project and provide the following environment variables:
``` plaintext
DISCORD_TOKEN=<your-discord-bot-token>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<your-service-account-email>
GOOGLE_PRIVATE_KEY=<your-service-account-private-key>
SPREADSHEET_ID=<your-google-spreadsheet-id>
```
## Scripts
- **`npm run deploy-commands`**: Deploys slash commands to Discord.
- **`npm run start-bot`**: Starts the bot.
