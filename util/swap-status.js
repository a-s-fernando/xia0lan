const { getStatuses } = require('./sheet-getters.js');
const { ActivityType } = require('discord.js');

async function swapStatus(client) {
    console.log('Attempting to swap status...');
    try {
        const statuses = await getStatuses();

        if (statuses.length > 0) {
            const randomIndex = Math.floor(Math.random() * statuses.length); // Select a random index
            const selected = statuses[randomIndex];
            const status = selected.status;
            const emoji = selected.emoji;
            const type = ActivityType.Custom
            client.user.setPresence({
                activities: [{
                    type: type,
                    name: "custom", // name is exposed through the API but not shown in the client for ActivityType.Custom
                    state: `${emoji} ${status}`

                }]
            })        }

    } catch (error) {
        console.error("Error in swapStatus function:", error.message);
    }
}

module.exports = { swapStatus };