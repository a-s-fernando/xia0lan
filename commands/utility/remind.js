const { sendDailyNotification } = require('../../rota/rota.js');
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Trigger the rota reminder'),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            await sendDailyNotification(interaction.client);
            await interaction.deleteReply();
        } catch (error) {
            console.error('Error in the remind-rota command:', error);
            if(interaction.replied) await interaction.editReply('I think I messed up somewhere...');
        }
    },
};