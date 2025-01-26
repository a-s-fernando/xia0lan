const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('update-embed')
        .setDescription('Updates an existing rich embed by message ID')
        .addStringOption(option =>
            option.setName('messageid')
                .setDescription('The ID of the message containing the embed to update')
                .setRequired(true))
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
        .addBooleanOption(option =>
            option.setName('timestamp')
                .setDescription('Whether to include a timestamp in the embed')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const messageID = interaction.options.getString('messageid');
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const color = interaction.options.getString('color');
        const image = interaction.options.getString('image');
        const timestamp = interaction.options.getBoolean('timestamp');

        const isValidHex = color ? /^#([0-9A-F]{3}){1,2}$/i.test(color) : true;
        if (color && !isValidHex) {
            await interaction.editReply({
                content: 'Invalid color! Please provide a valid hex color code (e.g., #ff0000).',
            });
            return;
        }

        try {
            const message = await interaction.channel.messages.fetch(messageID);

            if (!message.embeds || message.embeds.length === 0) {
                await interaction.editReply({
                    content: 'No embed found in the specified message.',
                });
                return;
            }

            const embed = EmbedBuilder.from(message.embeds[0]);

            if (title) embed.setTitle(title);
            if (description) embed.setDescription(description);
            if (color) embed.setColor(color);
            if (image) embed.setImage(image);
            if (timestamp) embed.setTimestamp();

            await message.edit({ embeds: [embed] });
            await interaction.editReply({
                content: 'Embed updated successfully!',
            });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: 'Failed to update the embed. Please make sure the message ID is correct and try again.',
            });
        }
    }
};
