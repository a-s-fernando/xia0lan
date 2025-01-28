const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('create-embed')
        .setDescription('Creates a rich embed')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('The title of the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('The description of the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('The color of the embed (hex code, e.g., #ff0000)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('image')
                .setDescription('The image of the embed')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('author-name')
                .setDescription('The name of the author')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('author-icon')
                .setDescription('The icon URL of the author')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('author-url')
                .setDescription('The URL of the author')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('thumbnail')
                .setDescription('The URL of the thumbnail image')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('timestamp')
                .setDescription('Whether to include a timestamp in the embed')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color') || '#000000';
        const image = interaction.options.getString('image');
        const authorName = interaction.options.getString('author-name');
        const authorIcon = interaction.options.getString('author-icon');
        const authorUrl = interaction.options.getString('author-url');
        const thumbnail = interaction.options.getString('thumbnail');
        const timestamp = interaction.options.getBoolean('timestamp') || false;

        const isValidHex = /^#([0-9A-F]{3}){1,2}$/i.test(color);
        if (!isValidHex) {
            await interaction.editReply({
                content: 'Invalid color! Please provide a valid hex color code (e.g., #ff0000).',
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setColor(color)
            .setImage(image)
            .setThumbnail(thumbnail)

        if (authorName) {
            embed.setAuthor({
                name: authorName,
                iconURL: authorIcon,
                url: authorUrl,
            });
        }
        if (timestamp) {
            embed.setTimestamp();
        }

        await interaction.channel.send({ embeds: [embed] });
        await interaction.deleteReply();
    }
};
