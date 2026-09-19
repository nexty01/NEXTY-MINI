const database = require('../../utils/database');
module.exports={name:'mutesticker',aliases:['blocksticker','stickerban'],description:'Block a specific sticker from being sent',category:'moderation',
async execute({ sock,msg,from,reply,isGroup, isAdmin }){
if(!isGroup)return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }

try{
const ctx=msg.message?.extendedTextMessage?.contextInfo;
if(!ctx)return reply('🚫 *Mute Sticker*\n\nReply to a sticker with .mutesticker to block it.\n\nThe sticker will be auto-deleted when sent.');
let stickerHash=null;
const inline=ctx?.quotedMessage?.stickerMessage;
if(inline){const id=inline.fileSha256||inline.fileEncSha256;if(id)stickerHash=Buffer.from(id).toString('base64');}
if(!stickerHash){
try{const loaded=await sock.loadMessage(ctx.remoteJid||from,ctx.stanzaId);const sd=loaded?.message?.stickerMessage;if(sd){const id=sd.fileSha256||sd.fileEncSha256;if(id)stickerHash=Buffer.from(id).toString('base64');}}catch(_){}
}
if(!stickerHash)return reply('❌ The quoted message is not a sticker. Please reply to a sticker.');
if(database.isStickerBlocked(from,stickerHash))return reply('⚠️ This sticker is already blocked!');
database.blockSticker(from,stickerHash);
reply('🚫 *Sticker Blocked!*\n\nThis sticker is now banned from this group.\nIt will be auto-deleted when sent.\n\nUse .unmutesticker to unblock.');
}catch(err){console.error('[MuteSticker]',err);reply('❌ An error occurred while blocking the sticker.');}
}};
