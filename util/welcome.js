const { getWelcomeChannelIDs, getWelcomeMessage } = require('./sheet-getters.js');

module.exports = (client) => {
    client.on('guildMemberAdd', async (member) => {
        try {
            const channels = await getWelcomeChannelIDs();
            const rawMessage = await getWelcomeMessage();
            const welcomeMessage = rawMessage.replace('${member}', `<@${member.id}>`)
            if (channels.length === 0) {
                console.error('No channels found for welcoming new users.');
                return;
            }
            for (const channelId of channels) {
                try {
                    const channel = await client.channels.fetch(channelId);
                    if (!channel) {
                        console.error(`Channel with ID ${channelId} not found.`);
                        continue;
                    }
                    await channel.send(welcomeMessage);
                } catch (fetchError) {
                    console.error(`Failed to fetch or send message to channel ID: ${channelId}`, fetchError);
                }
            }
        } catch (error) {
            console.error('Error sending welcome messages:', error.message);
        }
    });
};
