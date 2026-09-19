/**
 * Font System — 24 Unicode font styles for all bot responses.
 * Uses Array.from() for code-point-safe mapping so surrogate-pair
 * characters (supplementary plane) are always handled correctly.
 */

'use strict';

function makeMap(src, dst) {
    const s = Array.from(src);
    const d = Array.from(dst);
    const map = {};
    for (let i = 0; i < s.length; i++) {
        if (d[i] !== undefined) map[s[i]] = d[i];
    }
    return map;
}

const U = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const L = 'abcdefghijklmnopqrstuvwxyz';
const D = '0123456789';

const FONTS = {

    1:  { name: 'Normal',            sample: 'Sukuna MD',             charMap: {} },

    2:  { name: 'Bold',              sample: '𝐒𝐮𝐤𝐮𝐧𝐚 𝐌𝐃',
          charMap: { ...makeMap(U,'𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙'), ...makeMap(L,'𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐤𝐥𝐦𝐧𝐨𝐩𝐪𝐫𝐬𝐭𝐮𝐯𝐰𝐱𝐲𝐳'), ...makeMap(D,'𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗') } },

    3:  { name: 'Italic',            sample: '𝑆𝑢𝑘𝑢𝑛𝑎 𝑀𝐷',
          charMap: { ...makeMap(U,'𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍'), ...makeMap(L,'𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧') } },

    4:  { name: 'Bold Italic',       sample: '𝑺𝒖𝒌𝒖𝒏𝒂 𝑴𝑫',
          charMap: { ...makeMap(U,'𝑨𝑩𝑪𝑫𝑬𝑭𝑮𝑯𝑰𝑱𝑲𝑳𝑴𝑵𝑶𝑷𝑸𝑹𝑺𝑻𝑼𝑽𝑾𝑿𝒀𝒁'), ...makeMap(L,'𝒂𝒃𝒄𝒅𝒆𝒇𝒈𝒉𝒊𝒋𝒌𝒍𝒎𝒏𝒐𝒑𝒒𝒓𝒔𝒕𝒖𝒗𝒘𝒙𝒚𝒛') } },

    5:  { name: 'Script',            sample: '𝒮𝓊𝓀𝓊𝓃𝒶 ℳ𝒟',
          charMap: { ...makeMap(U,'𝒜ℬ𝒞𝒟ℰℱ𝒢ℋℐ𝒥𝒦ℒℳ𝒩𝒪𝒫𝒬ℛ𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵'), ...makeMap(L,'𝒶𝒷𝒸𝒹ℯ𝒻ℊ𝒽𝒾𝒿𝓀𝓁𝓂𝓃ℴ𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏') } },

    6:  { name: 'Bold Script',       sample: '𝓢𝓾𝓴𝓾𝓷𝓪 𝓜𝓓',
          charMap: { ...makeMap(U,'𝓐𝓑𝓒𝓓𝓔𝓕𝓖𝓗𝓘𝓙𝓚𝓛𝓜𝓝𝓞𝓟𝓠𝓡𝓢𝓣𝓤𝓥𝓦𝓧𝓨𝓩'), ...makeMap(L,'𝓪𝓫𝓬𝓭𝓮𝓯𝓰𝓱𝓲𝓳𝓴𝓵𝓶𝓷𝓸𝓹𝓺𝓻𝓼𝓽𝓾𝓿𝔀𝔁𝔂𝔃') } },

    7:  { name: 'Blackboard',        sample: '𝕊𝕦𝕜𝕦𝕟𝕒 𝕄𝔻',
          charMap: { ...makeMap(U,'𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ'), ...makeMap(L,'𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝕛𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝕧𝕨𝕩𝕪𝕫'), ...makeMap(D,'𝟘𝟙𝟚𝟛𝟜𝟝𝟞𝟟𝟠𝟡') } },

    8:  { name: 'Fraktur',           sample: '𝔖𝔲𝔨𝔲𝔫𝔞 𝔐𝔇',
          charMap: { ...makeMap(U,'𝔄𝔅ℭ𝔇𝔈𝔉𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝔘𝔙𝔚𝔛𝔜ℨ'), ...makeMap(L,'𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷') } },

    9:  { name: 'Bold Fraktur',      sample: '𝕾𝖚𝖐𝖚𝖓𝖆 𝕸𝕯',
          charMap: { ...makeMap(U,'𝕬𝕭𝕮𝕯𝕰𝕱𝕲𝕳𝕴𝕵𝕶𝕷𝕸𝕹𝕺𝕻𝕼𝕽𝕾𝕿𝖀𝖁𝖂𝖃𝖄𝖅'), ...makeMap(L,'𝖆𝖇𝖈𝖉𝖊𝖋𝖌𝖍𝖎𝖏𝖐𝖑𝖒𝖓𝖔𝖕𝖖𝖗𝖘𝖙𝖚𝖛𝖜𝖝𝖞𝖟') } },

    10: { name: 'Sans-Serif',        sample: '𝖲𝗎𝗄𝗎𝗇𝖺 𝖬𝖣',
          charMap: { ...makeMap(U,'𝖠𝖡𝖢𝖣𝖤𝖥𝖦𝖧𝖨𝖩𝖪𝖫𝖬𝖭𝖮𝖯𝖰𝖱𝖲𝖳𝖴𝖵𝖶𝖷𝖸𝖹'), ...makeMap(L,'𝖺𝖻𝖼𝖽𝖾𝖿𝗀𝗁𝗂𝗃𝗄𝗅𝗆𝗇𝗈𝗉𝗊𝗋𝗌𝗍𝗎𝗏𝗐𝗑𝗒𝗓'), ...makeMap(D,'𝟢𝟣𝟤𝟥𝟦𝟧𝟨𝟩𝟪𝟫') } },

    11: { name: 'Sans Bold',         sample: '𝗦𝘂𝗸𝘂𝗻𝗮 𝗠𝗗',
          charMap: { ...makeMap(U,'𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝗢𝗣𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭'), ...makeMap(L,'𝗮𝗯𝗰𝗱𝗲𝗳𝗴𝗵𝗶𝗷𝗸𝗹𝗺𝗻𝗼𝗽𝗾𝗿𝘀𝘁𝘂𝘃𝘄𝘅𝘆𝘇'), ...makeMap(D,'𝟬𝟭𝟮𝟯𝟰𝟱𝟲𝟳𝟴𝟵') } },

    12: { name: 'Sans Italic',       sample: '𝘚𝘶𝘬𝘶𝘯𝘢 𝘔𝘋',
          charMap: { ...makeMap(U,'𝘈𝘉𝘊𝘋𝘌𝘍𝘎𝘏𝘐𝘑𝘒𝘓𝘔𝘕𝘖𝘗𝘘𝘙𝘚𝘛𝘜𝘝𝘞𝘟𝘠𝘡'), ...makeMap(L,'𝘢𝘣𝘤𝘥𝘦𝘧𝘨𝘩𝘪𝘫𝘬𝘭𝘮𝘯𝘰𝘱𝘲𝘳𝘴𝘵𝘶𝘷𝘸𝘹𝘺𝘻') } },

    13: { name: 'Sans Bold Italic',  sample: '𝙎𝙪𝙠𝙪𝙣𝙖 𝙈𝘿',
          charMap: { ...makeMap(U,'𝘼𝘽𝘾𝘿𝙀𝙁𝙂𝙃𝙄𝙅𝙆𝙇𝙈𝙉𝙊𝙋𝙌𝙍𝙎𝙏𝙐𝙑𝙒𝙓𝙔𝙕'), ...makeMap(L,'𝙖𝙗𝙘𝙙𝙚𝙛𝙜𝙝𝙞𝙟𝙠𝙡𝙢𝙣𝙤𝙥𝙦𝙧𝙨𝙩𝙪𝙫𝙬𝙭𝙮𝙯') } },

    14: { name: 'Monospace',         sample: '𝚂𝚞𝚔𝚞𝚗𝚊 𝙼𝙳',
          charMap: { ...makeMap(U,'𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉'), ...makeMap(L,'𝚊𝚋𝚌𝚍𝚎𝚏𝚐𝚑𝚒𝚓𝚔𝚕𝚖𝚗𝚘𝚙𝚚𝚛𝚜𝚝𝚞𝚟𝚠𝚡𝚢𝚣'), ...makeMap(D,'𝟶𝟷𝟸𝟹𝟺𝟻𝟼𝟽𝟾𝟿') } },

    15: { name: 'Small Caps',        sample: 'ꜱᴜᴋᴜɴᴀ ᴍᴅ',
          charMap: { ...makeMap(U,'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ'), ...makeMap(L,'ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ') } },

    16: { name: 'Circled',           sample: 'ⓢⓤⓚⓤⓝⓐ ⓜⓓ',
          charMap: { ...makeMap(U,'ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ'), ...makeMap(L,'ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ'), ...makeMap(D,'⓪①②③④⑤⑥⑦⑧⑨') } },

    17: { name: 'Fullwidth',         sample: 'Ｓｕｋｕｎａ ＭＤ',
          charMap: { ...makeMap(U,'ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ'), ...makeMap(L,'ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ'), ...makeMap(D,'０１２３４５６７８９') } },

    18: { name: 'Upside Down',       sample: 'nsʞns ɯp',
          charMap: { ...makeMap(U,'∀ᗺƆ◖ƎℲ⅁HIɾʞ⅂WNOԀQᴚSʇ∩ΛMX⅄Z'), ...makeMap(L,'ɐqɔdǝɟƃɥᴉɾʞlɯuodqɹsʇnʌʍxʎz') } },

    19: { name: 'Strikethrough',     sample: 'S̶u̶k̶u̶n̶a̶ M̶D̶',   combiner: '\u0336', charMap: {} },
    20: { name: 'Underline',         sample: 'S̲u̲k̲u̲n̲a̲ M̲D̲',   combiner: '\u0332', charMap: {} },
    21: { name: 'Double Underline',  sample: 'S̳u̳k̳u̳n̳a̳ M̳D̳',   combiner: '\u0333', charMap: {} },
    22: { name: 'Wavy',              sample: 'S͜u͜k͜u͜n͜a͜ M͜D͜',   combiner: '\u035C', charMap: {} },

    23: { name: 'Superscript',       sample: 'ˢᵘᵏᵘⁿᵃ ᴹᴰ',
          charMap: { ...makeMap(U,'ᴬᴮᶜᴰᴱᶠᴳᴴᴵᴶᴷᴸᴹᴺᴼᴾQᴿˢᵀᵁᵛᵂˣʸᶻ'), ...makeMap(L,'ᵃᵇᶜᵈᵉᶠᵍʰⁱʲᵏˡᵐⁿᵒᵖqʳˢᵗᵘᵛʷˣʸᶻ'), ...makeMap(D,'⁰¹²³⁴⁵⁶⁷⁸⁹') } },

    24: { name: 'Subscript',         sample: 'Sᵤkᵤₙₐ MD',
          charMap: { ...makeMap('aehijklmnoprstuvx','ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ'), ...makeMap('AEHIJKLMNOPRSTUVX','ₐₑₕᵢⱼₖₗₘₙₒₚᵣₛₜᵤᵥₓ'), ...makeMap(D,'₀₁₂₃₄₅₆₇₈₉') } },
};

class FontSystem {
    convert(text, fontNumber = 1) {
        const font = FONTS[fontNumber];
        if (!font || fontNumber === 1) return text;

        let result = '';

        if (font.combiner) {
            for (const char of text) {
                result += char;
                if (char !== ' ' && char !== '\n' && char !== '\t') {
                    result += font.combiner;
                }
            }
        } else {
            for (const char of text) {
                result += font.charMap[char] ?? char;
            }
        }

        return result;
    }

    getFontList() {
        return Object.entries(FONTS).map(([id, f]) => ({
            id: parseInt(id), name: f.name, sample: f.sample,
        }));
    }

    getFontName(fontNumber) { return FONTS[fontNumber]?.name ?? 'Unknown'; }
    isValidFont(fontNumber) { return !!FONTS[fontNumber]; }
    get maxFont() { return 24; }
}

module.exports = new FontSystem();
