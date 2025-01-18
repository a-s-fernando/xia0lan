require('dotenv').config();
const fs = require('node:fs');
const path = require('node:path');
const { Client, Events, GatewayIntentBits, Collection, MessageFlags } = require('discord.js');
const { sendDailyNotification } = require('./util/rota-notif');
const moment = require('moment');
const { swapStatus } = require('./util/swap-status');
const initializeWelcomeEvent = require('./util/welcome');
const token = process.env.DISCORD_TOKEN;

// Initialize the Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildPresences] });
client.once(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${client.user.tag}`);

  // Schedule the daily notification at a specific time
  const now = moment();
  const nextRun = moment().set({ hour: 12, minute: 0, second: 0 });

  if (now > nextRun) {
    nextRun.add(1, 'day');
  }

  const msUntilNextRun = nextRun.diff(now);

  setTimeout(() => {
    sendDailyNotification(client); // Send the notification
    setInterval(async () => {
      try {
        await sendDailyNotification(client); // And schedule the next one
      } catch (error) {
        console.error('Error sending daily notification:', error);
      }
    }, 24 * 60 * 60 * 1000);
  }, msUntilNextRun);

  swapStatus(client);
  setInterval(async () => {
    try {
      await swapStatus(client);
    } catch (error) {
      console.error('Error swapping status:', error);
    }
  }, 30 * 60 * 1000);

});

client.login(token);


// Grab all slash commands from the files
client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`Loaded command ${command.data.name}`);
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}

// Handle slash commands
client.on(Events.InteractionCreate, async interaction => {
  console.log(`Received interaction: ${interaction.commandName}`);
  if (!interaction.isChatInputCommand()) {
    console.log('This is not a chat input command.');
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
    }
  }
});

initializeWelcomeEvent(client);
client.login(process.env.DISCORD_TOKEN);
