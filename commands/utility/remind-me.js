const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind-me')
        .setDescription('Set a reminder for a specific message')
        .addStringOption(option =>
            option
                .setName('message_id')
                .setDescription('The ID of the message you want to be reminded about')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('hours')
                .setDescription('Number of hours to wait')
                .setRequired(true)
        )
        .addIntegerOption(option =>
            option
                .setName('minutes')
                .setDescription('Number of minutes to wait')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const messageId = interaction.options.getString('message_id');
        const hours = interaction.options.getInteger('hours');
        const minutes = interaction.options.getInteger('minutes');

        if (hours < 0 || minutes < 0) {
            return await interaction.editReply('Hours and minutes must be positive values.');
        }

        const totalMilliseconds = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);

        try {
            const message = await interaction.channel.messages.fetch(messageId);

            if (!message) {
                return await interaction.editReply('Could not find a message with the provided ID.');
            }

            await interaction.editReply(`Reminder set! I will remind you about that message in ${hours} hours and ${minutes} minutes.`);

            setTimeout(async () => {
                try {
                    await interaction.followUp({
                        content: `Here is your reminder for this message: ${message.url}`,
                        flags: MessageFlags.Ephemeral
                    });
                } catch (err) {
                    console.error('Failed to send reminder:', err);
                }
            }, totalMilliseconds);
        } catch (error) {
            console.error('Error fetching message:', error);
            await interaction.editReply('An error occurred while trying to fetch the message. Make sure the message ID is valid and in this channel.');
        }
    },
};
