const { getWelcomeChannelIDs, getWelcomeMessage, getNewRoles } = require('./sheet-getters.js');

module.exports = (client) => {
    client.on('guildMemberAdd', async (member) => {
        console.log('new member', member);
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

            const newRoles = await getNewRoles();
            if (!newRoles || newRoles.length === 0) {
                console.warn('No roles found to assign to the new user.');
            } else {
                const rolePromises = newRoles.map(async (roleId) => {
                    try {
                        const role = member.guild.roles.cache.get(roleId);
                        if (!role) {
                            console.error(`Role with ID ${roleId} not found in the guild.`);
                            return;
                        }
                        await member.roles.add(role);
                        console.log(`Assigned role ${role.name} to ${member.user.tag}.`);
                    } catch (err) {
                        console.error(`Failed to assign role with ID ${roleId} to ${member.user.tag}:`, err);
                    }
                });
                await Promise.all(rolePromises);
            }
        } catch (error) {
            console.error('Error processing new member', error.message);
        }
    });
};
