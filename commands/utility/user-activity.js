const { SlashCommandBuilder, EmbedBuilder, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user-activity')
        .setDescription('Analyze user activity and find users with low message counts')
        .addIntegerOption(option =>
            option
                .setName('threshold')
                .setDescription('Maximum number of messages to include users (e.g., 10 = users with 0-9 messages)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(1000)
        )
        .addBooleanOption(option =>
            option
                .setName('include-bots')
                .setDescription('Whether to include bot accounts in the analysis')
                .setRequired(false)
        ),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const threshold = interaction.options.getInteger('threshold');
        const includeBots = interaction.options.getBoolean('include-bots') ?? false;
        
        try {
            // Get all members in the guild
            const guild = interaction.guild;
            const members = await guild.members.fetch();
            
            // Get all text channels the bot can access
            const textChannels = guild.channels.cache.filter(channel => 
                channel.type === ChannelType.GuildText && 
                channel.permissionsFor(guild.members.me).has('ViewChannel') &&
                channel.permissionsFor(guild.members.me).has('ReadMessageHistory')
            );
            
            if (textChannels.size === 0) {
                return await interaction.editReply('No accessible text channels found to analyze.');
            }
            
            await interaction.editReply(`🔍 Analyzing ${members.size} members across ${textChannels.size} channels. This may take a while...`);
            
            const userActivity = new Map();
            let processedChannels = 0;
            
            // Initialize all members
            members.forEach(member => {
                if (!includeBots && member.user.bot) return;
                userActivity.set(member.id, {
                    user: member.user,
                    messageCount: 0,
                    lastMessageAt: null
                });
            });
            
            // Process each channel
            for (const [channelId, channel] of textChannels) {
                try {
                    let lastMessageId = null;
                    let messagesProcessed = 0;
                    
                    while (true) {
                        // Fetch messages in batches
                        const options = { limit: 100 };
                        if (lastMessageId) {
                            options.before = lastMessageId;
                        }
                        
                        const messages = await channel.messages.fetch(options);
                        
                        if (messages.size === 0) break;
                        
                        messages.forEach(message => {
                            const userId = message.author.id;
                            if (userActivity.has(userId)) {
                                const activity = userActivity.get(userId);
                                activity.messageCount++;
                                
                                // Update last message time if this is more recent
                                if (!activity.lastMessageAt || message.createdAt > activity.lastMessageAt) {
                                    activity.lastMessageAt = message.createdAt;
                                }
                            }
                        });
                        
                        lastMessageId = messages.last().id;
                        messagesProcessed += messages.size;
                        
                        // Rate limit protection
                        await new Promise(resolve => setTimeout(resolve, 100));
                        
                        // Stop after processing a reasonable amount (to prevent timeout)
                        if (messagesProcessed >= 10000) break;
                    }
                } catch (error) {
                    console.error(`Error processing channel ${channel.name}:`, error);
                }
                
                processedChannels++;
                
                // Update progress every 5 channels
                if (processedChannels % 5 === 0) {
                    await interaction.editReply(`🔍 Analyzed ${processedChannels}/${textChannels.size} channels...`);
                }
            }
            
            // Filter users with less than threshold messages
            const lowActivityUsers = Array.from(userActivity.values())
                .filter(activity => activity.messageCount < threshold)
                .sort((a, b) => a.messageCount - b.messageCount);
            
            if (lowActivityUsers.length === 0) {
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('📊 User Activity Analysis')
                    .setDescription(`✅ All users have sent ${threshold} or more messages!`)
                    .addFields(
                        { name: 'Threshold', value: `${threshold} messages`, inline: true },
                        { name: 'Total Members Analyzed', value: userActivity.size.toString(), inline: true },
                        { name: 'Channels Analyzed', value: processedChannels.toString(), inline: true }
                    )
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // Create embed with results
            const embed = new EmbedBuilder()
                .setColor(0xff9900)
                .setTitle('📊 User Activity Analysis')
                .setDescription(`Found ${lowActivityUsers.length} users with less than ${threshold} messages`)
                .addFields(
                    { name: 'Threshold', value: `${threshold} messages`, inline: true },
                    { name: 'Total Members Analyzed', value: userActivity.size.toString(), inline: true },
                    { name: 'Channels Analyzed', value: processedChannels.toString(), inline: true }
                )
                .setTimestamp();
            
            // Add user details (limit to prevent embed overflow)
            const displayLimit = Math.min(lowActivityUsers.length, 25);
            let description = `**Users with less than ${threshold} messages:**\n\n`;
            
            for (let i = 0; i < displayLimit; i++) {
                const activity = lowActivityUsers[i];
                const lastMessageText = activity.lastMessageAt 
                    ? `<t:${Math.floor(activity.lastMessageAt.getTime() / 1000)}:R>`
                    : 'No messages found';
                
                description += `**${activity.user.displayName || activity.user.username}** (${activity.user.tag})\n`;
                description += `└ Messages: ${activity.messageCount} | Last: ${lastMessageText}\n\n`;
            }
            
            if (lowActivityUsers.length > displayLimit) {
                description += `\n*... and ${lowActivityUsers.length - displayLimit} more users*`;
            }
            
            // Split into multiple embeds if too long
            if (description.length > 4096) {
                const chunks = [];
                const users = lowActivityUsers.slice(0, displayLimit);
                const chunkSize = 10;
                
                for (let i = 0; i < users.length; i += chunkSize) {
                    const chunk = users.slice(i, i + chunkSize);
                    let chunkDescription = '';
                    
                    chunk.forEach(activity => {
                        const lastMessageText = activity.lastMessageAt 
                            ? `<t:${Math.floor(activity.lastMessageAt.getTime() / 1000)}:R>`
                            : 'No messages found';
                        
                        chunkDescription += `**${activity.user.displayName || activity.user.username}** (${activity.user.tag})\n`;
                        chunkDescription += `└ Messages: ${activity.messageCount} | Last: ${lastMessageText}\n\n`;
                    });
                    
                    chunks.push(chunkDescription);
                }
                
                // Send first embed with summary
                await interaction.editReply({ embeds: [embed] });
                
                // Send additional embeds with user lists
                for (let i = 0; i < chunks.length; i++) {
                    const chunkEmbed = new EmbedBuilder()
                        .setColor(0xff9900)
                        .setTitle(`📊 Low Activity Users (${i + 1}/${chunks.length})`)
                        .setDescription(chunks[i]);
                    
                    await interaction.followUp({ embeds: [chunkEmbed] });
                }
            } else {
                embed.setDescription(description);
                await interaction.editReply({ embeds: [embed] });
            }
            
        } catch (error) {
            console.error('Error in user-activity command:', error);
            await interaction.editReply('❌ An error occurred while analyzing user activity. Please try again later.');
        }
    },
}; 