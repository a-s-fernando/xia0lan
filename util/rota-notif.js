const { getRotaChannelIDs, getIDForToday } = require('./sheet-getters.js');

async function sendDailyNotification(client) {
    try {
        const channels = await getRotaChannelIDs();
        const idObject = await getIDForToday();
        const id = idObject.id;
        const type = idObject.type;

        if (channels.length === 0) {
            return;
        }

        for (const channelId of channels) {
            try {
                const channel = await client.channels.fetch(channelId); // Fetch each channel dynamically

                if (id) {
                    await channel.send(
                        `<@${type === 'Role' ? '&' : ''}${id}>, It is your Question of the Day today! If you are unable, please let someone else on the staff team know :)`
                    );
                } else {
                    await channel.send("I can't find an ID for the QOTD util today...");
                }
            } catch (fetchError) {
                console.error(`Failed to fetch or send message to channel ID: ${channelId}`, fetchError);
            }
        }
    } catch (error) {
        console.error("Error in sendDailyNotification function:", error.message);
    }
}

module.exports = { sendDailyNotification };