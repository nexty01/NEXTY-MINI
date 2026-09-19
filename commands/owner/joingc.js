'use strict';

module.exports = {
    name: 'joingc',
    aliases: ['join', 'entry'],
    category: 'owner',
    desc: 'Join a group via WhatsApp invite link',
    ownerOnly: true,
    reactions: {
        start: '👣',
        success: '🫂'
    },

    execute: async (context) => {
        const { sock, msg, from, args, reply } = context;

        try {
            // Get text from args or quoted message
            let text = args.join(' ').trim();
            
            if (!text && msg.quoted) {
                text = msg.quoted?.text?.trim() || 
                       msg.quoted?.caption?.trim() || '';
            }

            if (!text) {
                return reply(
                    `JOIN SYSTEM\n\n` +
                    `No valid WhatsApp group link found\n\n` +
                    `Usage:\n` +
                    `.joingc https://chat.whatsapp.com/XXX\n` +
                    `or Reply to a message with the link`
                );
            }

            // Extract invite code from WhatsApp link
            const match = text.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/);
            
            if (!match || !match[1]) {
                return reply(
                    `Invalid link format\n\n` +
                    `Expected: https://chat.whatsapp.com/[CODE]`
                );
            }

            const code = match[1];

            // Validate code format
            if (code.length < 20) {
                return reply('Invalid invite code');
            }

            await reply('Joining group...');

            // Attempt to join the group
            let groupId = null;
            try {
                groupId = await sock.groupAcceptInvite(code);
            } catch (joinErr) {
                console.error('[joingc join]', joinErr.message);
                
                const errMsg = joinErr?.toString?.() || '';
                let reason = 'Failed to join group';

                if (errMsg.includes('401')) reason = 'Not authorized to join';
                else if (errMsg.includes('404')) reason = 'Invalid or revoked link';
                else if (errMsg.includes('408')) reason = 'Request timeout - try again';
                else if (errMsg.includes('409')) reason = 'Already in this group';
                else if (errMsg.includes('410')) reason = 'Link has expired';
                else if (errMsg.includes('500')) reason = 'Server error - try later';

                return reply(`Join failed: ${reason}`);
            }

            if (!groupId) {
                return reply('Failed to join: No group ID received');
            }

            // Wait a moment for group to register
            await new Promise(r => setTimeout(r, 1500));

            // Fetch group metadata for info
            let groupInfo = null;
            try {
                groupInfo = await sock.groupMetadata(groupId);
            } catch (metaErr) {
                console.error('[joingc metadata]', metaErr.message);
            }

            // Build success message
            let successMsg = `Joined Successfully!\n\n`;
            
            if (groupInfo) {
                const memberCount = groupInfo.participants?.length || 0;
                const subject = groupInfo.subject || 'Unknown';
                const desc = groupInfo.desc || 'No description';
                
                successMsg += 
                    `Group: ${subject}\n` +
                    `Members: ${memberCount}\n` +
                    `ID: ${groupId}\n\n` +
                    `Description:\n${desc}`;
            } else {
                successMsg += 
                    `Group ID: ${groupId}\n` +
                    `Could not fetch details`;
            }

            return reply(successMsg);

        } catch (err) {
            console.error('[joingc]', err?.message || err);
            reply('Error joining group');
        }
    }
};
