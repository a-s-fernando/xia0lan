const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editmessage')
        .setDescription('Edit a specific message sent by me!')
        .addStringOption(option =>
            option
                .setName('message_id')
                .setDescription('The message ID of the message you want me to edit')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('new_content')
                .setDescription('The new content for the message')
                .setRequired(true)
        ),
    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const messageId = interaction.options.getString('message_id');
            const newContent = interaction.options.getString('new_content');
            const channel = interaction.channel;

            const message = await channel.messages.fetch(messageId);

            if (!message) {
                await interaction.editReply("I couldn't find the message with the provided ID!");
                return;
            }

            if (message.author.id !== interaction.client.user.id) {
                await interaction.editReply("I can only edit messages that I sent!");
                return;
            }

            // Edit the message with the new content
            await message.edit(newContent);
            await interaction.editReply('Message successfully edited!');

        } catch (error) {
            console.error(error);
            await interaction.editReply('Something went wrong while trying to edit the message!');
        }
    },
};
