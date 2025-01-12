const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const moment = require('moment'); // Ensure this is included as it was used in the ES6 snippet

// Config and constants
const SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive.file',
];
const jwt = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY,
    scopes: SCOPES,
});
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, jwt);

async function getIDForToday() {
    try {
        await doc.loadInfo();

        const sheet = doc.sheetsByIndex[0];
        const rows = await sheet.getRows();

        const today = moment().format('dddd');

        for (let row of rows) {
            if (row.get('Day') === today) {
                return row.get('ID');
            }
        }
        return null;
    } catch (error) {
        console.error("Error retrieving ID for today:", error.message);
        return null;
    }
}

async function getChannelIDs() {
    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[2];
        const rows = await sheet.getRows();

        const channelIDs = rows
            .map((row) => row.get('Discord Channel ID'))
            .filter((id) => id && id.trim()); // Filter out empty or invalid IDs
        if (channelIDs.length === 0) {
            console.warn("No channel IDs found...");
        }

        return channelIDs;
    } catch (error) {
        console.error("Error retrieving channel IDs:", error.message);
        return [];
    }
}

async function sendDailyNotification(client) {
    try {
        const channels = await getChannelIDs();
        const id = await getIDForToday();

        if (channels.length === 0) {
            return;
        }

        for (const channelId of channels) {
            try {
                const channel = await client.channels.fetch(channelId); // Fetch each channel dynamically

                if (id) {
                    await channel.send(
                        `<@${id}>, It is your Question of the Day today! If you are unable, please let someone else on the staff team know :)`
                    );
                } else {
                    await channel.send("I can't find an ID for the QOTD rota today...");
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