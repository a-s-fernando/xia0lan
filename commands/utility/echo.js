const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Speak through me!')
        .addStringOption(option =>
            option
                .setName('message')
                .setDescription('The message you want me to echo')
                .setRequired(true)
        ),
    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });
        const userMessage = interaction.options.getString('message');
        await interaction.channel.send(userMessage);
        await interaction.deleteReply();
    },
};