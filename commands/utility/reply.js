const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reply')
        .setDescription('Make me reply to a specific message!')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('The message you want me to reply with')
                .setRequired(true)
        ).addStringOption(option =>
            option
                .setName('message_id')
                .setDescription('The message ID you want me to reply to')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const userMessage = interaction.options.getString('message');
            const messageId = interaction.options.getString('message_id');
            const channel = interaction.channel;

            await channel.messages.fetch(messageId).then((message) => {
                if (!message) {
                    interaction.editReply("I couldn't find the message with the provided ID!");
                } else {
                    message.reply(userMessage);
                    interaction.deleteReply();
                }
            }).catch(() => throw new Error('Failed to fetch message'));
        } catch (error) {
            console.error(error);
            await interaction.editReply('Something went wrong while trying to reply to the message!');
        }
            await interaction.deleteReply();
        },
};