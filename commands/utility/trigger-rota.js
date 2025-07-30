const { sendDailyNotification } = require('../../util/rota-notif.js');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trigger-rota')
        .setDescription('Trigger the util reminder'),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await sendDailyNotification(interaction.client);
            await interaction.deleteReply();
        } catch (error) {
            console.error('Error in the remind-util command:', error);
            if(interaction.replied) await interaction.editReply('I think I messed up somewhere...');
        }
    },
};