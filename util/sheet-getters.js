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
                return {id: row.get('ID'), type: row.get('Type')};
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

async function getStatuses() {
    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[3];
        const rows = await sheet.getRows();

        const statusWithEmojiPairs = rows
            .map(row => {
                const status = row.get('Status')?.trim();
                const emoji = row.get('Emoji')?.trim();
                if (status && emoji) {
                    return { status, emoji }; // Return as object pair
                }
                return null;
            })
            .filter(pair => pair !== null); // Filter out invalid pairs

        if (statusWithEmojiPairs.length === 0) {
            console.warn("No valid statuses and types found...");
        }

        return statusWithEmojiPairs; // Return the array of pairs
    } catch (error) {
        console.error("Error retrieving statuses and types:", error.message);
        return [];
    }
}


module.exports = { getChannelIDs, getIDForToday, getStatuses };