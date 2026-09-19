module.exports={name:'warn',aliases:['warning'],description:'Warn a user in the group',category:'moderation',
async execute({sock,msg,from,reply,args,isGroup,database}){
if(!isGroup)return reply('👥 This command can only be used in groups!');
try{
const mentioned=msg.message?.extendedTextMessage?.contextInfo?.mentionedJid||[];
const quotedParticipant=msg.message?.extendedTextMessage?.contextInfo?.participant;
let targetUser=mentioned[0]||quotedParticipant;
if(!targetUser&&args.length>0){const input=args[0].replace(/[^0-9]/g,'');if(input)targetUser=input+'@s.whatsapp.net';}
if(!targetUser)return reply('⚠️ *Warn Command*\n\nUsage:\n• .warn @user [reason]\n• Reply to a message + .warn [reason]\n\nAfter 3 warnings user will be kicked.');
const reason=args.slice(mentioned.length>0?1:0).join(' ')||'No reason provided';
const warningCount=database.addWarning(from,targetUser);
const maxWarnings=3;
const num=targetUser.split('@')[0];
if(warningCount>=maxWarnings){
try{await sock.groupParticipantsUpdate(from,[targetUser],'remove');database.resetWarnings(from,targetUser);
reply(`🚫 *User Kicked*\n\n👤 @${num} reached ${maxWarnings} warnings and was kicked.\n📝 Reason: ${reason}`,{mentions:[targetUser]});
}catch(_){reply(`⚠️ *Max Warnings Reached*\n\n👤 @${num} has ${warningCount} warnings.\n📝 Reason: ${reason}\n\n_(Bot needs admin to kick)_`,{mentions:[targetUser]});}
}else{
reply(`⚠️ *Warning Issued*\n\n👤 User: @${num}\n⚠️ Warnings: ${warningCount}/${maxWarnings}\n📝 Reason: ${reason}\n\nAt ${maxWarnings} warnings, user will be kicked.`,{mentions:[targetUser]});
}
}catch(err){console.error('[Warn]',err);reply('❌ An error occurred while warning the user.');}
}};
