const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-embed')
        .setDescription('Creates a rich embed')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed (hex code, e.g., #ff0000)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('The image of the embed')
                .setRequired(false)),

    async execute(interaction) {
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#000000';
        const image = interaction.options.getString('image');

        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(color);
        if (!isValidHex) {
            return interaction.reply({
                content: 'Invalid color! Please provide a valid hex color code (e.g., #ff0000).',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setImage(image)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};
