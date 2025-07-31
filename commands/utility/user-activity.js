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
        .addStringOption(option =>
            option
                .setName('channel-ids')
                .setDescription('Comma-separated list of channel IDs to analyze (leave empty to analyze all channels)')
                .setRequired(false)
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
        const channelIdsInput = interaction.options.getString('channel-ids');
        const includeBots = interaction.options.getBoolean('include-bots') ?? false;
        
        try {
            // Get all members in the guild
            const guild = interaction.guild;
            const members = await guild.members.fetch();
            
            let textChannels;
            
            if (channelIdsInput) {
                // Parse and validate specific channel IDs
                const channelIds = channelIdsInput.split(',').map(id => id.trim()).filter(id => id.length > 0);
                
                if (channelIds.length === 0) {
                    return await interaction.editReply('❌ No valid channel IDs provided. Use comma-separated channel IDs or leave empty to analyze all channels.');
                }
                
                textChannels = new Map();
                const invalidChannels = [];
                const inaccessibleChannels = [];
                
                for (const channelId of channelIds) {
                    const channel = guild.channels.cache.get(channelId);
                    
                    if (!channel) {
                        invalidChannels.push(channelId);
                        continue;
                    }
                    
                    if (channel.type !== ChannelType.GuildText) {
                        invalidChannels.push(`${channelId} (not a text channel)`);
                        continue;
                    }
                    
                    if (!channel.permissionsFor(guild.members.me).has('ViewChannel') ||
                        !channel.permissionsFor(guild.members.me).has('ReadMessageHistory')) {
                        inaccessibleChannels.push(`<#${channelId}>`);
                        continue;
                    }
                    
                    textChannels.set(channelId, channel);
                }
                
                if (invalidChannels.length > 0) {
                    return await interaction.editReply(`❌ Invalid channel IDs found: ${invalidChannels.join(', ')}`);
                }
                
                if (inaccessibleChannels.length > 0) {
                    return await interaction.editReply(`❌ Cannot access these channels (missing permissions): ${inaccessibleChannels.join(', ')}`);
                }
                
                if (textChannels.size === 0) {
                    return await interaction.editReply('❌ No valid accessible text channels found from the provided IDs.');
                }
            } else {
                // Get all text channels the bot can access
                textChannels = guild.channels.cache.filter(channel => 
                    channel.type === ChannelType.GuildText && 
                    channel.permissionsFor(guild.members.me).has('ViewChannel') &&
                    channel.permissionsFor(guild.members.me).has('ReadMessageHistory')
                );
            }
            
            if (textChannels.size === 0) {
                return await interaction.editReply('No accessible text channels found to analyze.');
            }
            
            const channelList = channelIdsInput 
                ? Array.from(textChannels.values()).map(c => `<#${c.id}>`).join(', ')
                : `${textChannels.size} channels`;
            
            await interaction.editReply(`🔍 Analyzing ${members.size} members across ${channelList}. This may take a while...`);
            
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
                const channelsAnalyzedText = channelIdsInput 
                    ? `${processedChannels} specific channels`
                    : `${processedChannels} channels`;
                
                const embed = new EmbedBuilder()
                    .setColor(0x00ff00)
                    .setTitle('📊 User Activity Analysis')
                    .setDescription(`✅ All users have sent ${threshold} or more messages!`)
                    .addFields(
                        { name: 'Threshold', value: `${threshold} messages`, inline: true },
                        { name: 'Total Members Analyzed', value: userActivity.size.toString(), inline: true },
                        { name: 'Channels Analyzed', value: channelsAnalyzedText, inline: true }
                    )
                    .setTimestamp();
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // Create embed with results
            const channelsAnalyzedText = channelIdsInput 
                ? `${processedChannels} specific channels`
                : `${processedChannels} channels`;
            
            const embed = new EmbedBuilder()
                .setColor(0xff9900)
                .setTitle('📊 User Activity Analysis')
                .setDescription(`Found ${lowActivityUsers.length} users with less than ${threshold} messages`)
                .addFields(
                    { name: 'Threshold', value: `${threshold} messages`, inline: true },
                    { name: 'Total Members Analyzed', value: userActivity.size.toString(), inline: true },
                    { name: 'Channels Analyzed', value: channelsAnalyzedText, inline: true }
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