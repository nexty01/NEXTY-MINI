/**
 * phoneinfo — Reply to a user + .phoneinfo → number, country, carrier
 * (best-effort), line type, timezone, and device (reusing device.js's
 * message-ID heuristic).
 *
 * ⚠️ IMPORTANT — what this command CANNOT do, and why:
 *   • IP address:      WhatsApp is end-to-end encrypted and NEVER exposes a
 *                       contact's IP address to another client or bot. No
 *                       API, free or paid, can get this from a phone number
 *                       or a WhatsApp message. There is no field for it here
 *                       — anything claiming to offer this is fake.
 *   • Real-time location: "Country" below is the number's REGISTERED country
 *                       from its calling code (e.g. +234 → Nigeria), not
 *                       the phone's current physical location. There is no
 *                       way for a bot to know where a device physically is
 *                       right now.
 *
 * Carrier accuracy note: real-time carrier (HLR) lookups are normally a
 * paid feature. This command ships with an offline Nigerian-network prefix
 * table (MTN/Airtel/Glo/9mobile) as a best-effort guess — it can be wrong
 * for ported numbers. For other countries, or for more reliable carrier
 * data generally, set NUMVERIFY_API_KEY (free tier, sign up at
 * https://apilayer.com/marketplace/number_verification-api) and it will be
 * used automatically when present.
 *
 * Usage:
 *   Reply to any message + .phoneinfo
 *   .phoneinfo +2349127814853        (direct number also works)
 */

'use strict';

const { detectDevice } = require('./device');

// ─── Offline calling-code table (country + region name) ───────────────────
// Sorted matching tries longest prefix first so e.g. +1 (US/CA) vs +1242
// (Bahamas) resolve correctly.
const CALLING_CODES = [
    ['1242', 'Bahamas'], ['1246', 'Barbados'], ['1264', 'Anguilla'],
    ['1268', 'Antigua and Barbuda'], ['1284', 'British Virgin Islands'],
    ['1340', 'US Virgin Islands'], ['1345', 'Cayman Islands'],
    ['1441', 'Bermuda'], ['1473', 'Grenada'], ['1649', 'Turks and Caicos'],
    ['1664', 'Montserrat'], ['1670', 'Northern Mariana Islands'],
    ['1671', 'Guam'], ['1684', 'American Samoa'], ['1758', 'Saint Lucia'],
    ['1767', 'Dominica'], ['1784', 'Saint Vincent and the Grenadines'],
    ['1787', 'Puerto Rico'], ['1809', 'Dominican Republic'],
    ['1868', 'Trinidad and Tobago'], ['1876', 'Jamaica'],
    ['1939', 'Puerto Rico'], ['1', 'United States/Canada'],
    ['20', 'Egypt'], ['211', 'South Sudan'], ['212', 'Morocco'],
    ['213', 'Algeria'], ['216', 'Tunisia'], ['218', 'Libya'],
    ['220', 'Gambia'], ['221', 'Senegal'], ['222', 'Mauritania'],
    ['223', 'Mali'], ['224', 'Guinea'], ['225', 'Ivory Coast'],
    ['226', 'Burkina Faso'], ['227', 'Niger'], ['228', 'Togo'],
    ['229', 'Benin'], ['230', 'Mauritius'], ['231', 'Liberia'],
    ['232', 'Sierra Leone'], ['233', 'Ghana'], ['234', 'Nigeria'],
    ['235', 'Chad'], ['236', 'Central African Republic'],
    ['237', 'Cameroon'], ['238', 'Cape Verde'],
    ['239', 'Sao Tome and Principe'], ['240', 'Equatorial Guinea'],
    ['241', 'Gabon'], ['242', 'Republic of the Congo'],
    ['243', 'DR Congo'], ['244', 'Angola'], ['245', 'Guinea-Bissau'],
    ['246', 'British Indian Ocean Territory'], ['248', 'Seychelles'],
    ['249', 'Sudan'], ['250', 'Rwanda'], ['251', 'Ethiopia'],
    ['252', 'Somalia'], ['253', 'Djibouti'], ['254', 'Kenya'],
    ['255', 'Tanzania'], ['256', 'Uganda'], ['257', 'Burundi'],
    ['258', 'Mozambique'], ['260', 'Zambia'], ['261', 'Madagascar'],
    ['262', 'Reunion/Mayotte'], ['263', 'Zimbabwe'], ['264', 'Namibia'],
    ['265', 'Malawi'], ['266', 'Lesotho'], ['267', 'Botswana'],
    ['268', 'Eswatini'], ['269', 'Comoros'], ['27', 'South Africa'],
    ['290', 'Saint Helena'], ['291', 'Eritrea'], ['297', 'Aruba'],
    ['298', 'Faroe Islands'], ['299', 'Greenland'], ['30', 'Greece'],
    ['31', 'Netherlands'], ['32', 'Belgium'], ['33', 'France'],
    ['34', 'Spain'], ['350', 'Gibraltar'], ['351', 'Portugal'],
    ['352', 'Luxembourg'], ['353', 'Ireland'], ['354', 'Iceland'],
    ['355', 'Albania'], ['356', 'Malta'], ['357', 'Cyprus'],
    ['358', 'Finland'], ['359', 'Bulgaria'], ['36', 'Hungary'],
    ['370', 'Lithuania'], ['371', 'Latvia'], ['372', 'Estonia'],
    ['373', 'Moldova'], ['374', 'Armenia'], ['375', 'Belarus'],
    ['376', 'Andorra'], ['377', 'Monaco'], ['378', 'San Marino'],
    ['380', 'Ukraine'], ['381', 'Serbia'], ['382', 'Montenegro'],
    ['383', 'Kosovo'], ['385', 'Croatia'], ['386', 'Slovenia'],
    ['387', 'Bosnia and Herzegovina'], ['389', 'North Macedonia'],
    ['39', 'Italy'], ['40', 'Romania'], ['41', 'Switzerland'],
    ['420', 'Czech Republic'], ['421', 'Slovakia'], ['423', 'Liechtenstein'],
    ['44', 'United Kingdom'], ['45', 'Denmark'], ['46', 'Sweden'],
    ['47', 'Norway'], ['48', 'Poland'], ['49', 'Germany'],
    ['500', 'Falkland Islands'], ['501', 'Belize'], ['502', 'Guatemala'],
    ['503', 'El Salvador'], ['504', 'Honduras'], ['505', 'Nicaragua'],
    ['506', 'Costa Rica'], ['507', 'Panama'], ['508', 'Saint Pierre and Miquelon'],
    ['509', 'Haiti'], ['51', 'Peru'], ['52', 'Mexico'], ['53', 'Cuba'],
    ['54', 'Argentina'], ['55', 'Brazil'], ['56', 'Chile'],
    ['57', 'Colombia'], ['58', 'Venezuela'], ['590', 'Guadeloupe'],
    ['591', 'Bolivia'], ['592', 'Guyana'], ['593', 'Ecuador'],
    ['594', 'French Guiana'], ['595', 'Paraguay'], ['596', 'Martinique'],
    ['597', 'Suriname'], ['598', 'Uruguay'], ['599', 'Curacao'],
    ['60', 'Malaysia'], ['61', 'Australia'], ['62', 'Indonesia'],
    ['63', 'Philippines'], ['64', 'New Zealand'], ['65', 'Singapore'],
    ['66', 'Thailand'], ['670', 'East Timor'], ['672', 'Norfolk Island'],
    ['673', 'Brunei'], ['674', 'Nauru'], ['675', 'Papua New Guinea'],
    ['676', 'Tonga'], ['677', 'Solomon Islands'], ['678', 'Vanuatu'],
    ['679', 'Fiji'], ['680', 'Palau'], ['681', 'Wallis and Futuna'],
    ['682', 'Cook Islands'], ['683', 'Niue'], ['685', 'Samoa'],
    ['686', 'Kiribati'], ['687', 'New Caledonia'], ['688', 'Tuvalu'],
    ['689', 'French Polynesia'], ['690', 'Tokelau'],
    ['691', 'Micronesia'], ['692', 'Marshall Islands'], ['7', 'Russia/Kazakhstan'],
    ['81', 'Japan'], ['82', 'South Korea'], ['84', 'Vietnam'],
    ['86', 'China'], ['880', 'Bangladesh'], ['886', 'Taiwan'],
    ['90', 'Turkey'], ['91', 'India'], ['92', 'Pakistan'],
    ['93', 'Afghanistan'], ['94', 'Sri Lanka'], ['95', 'Myanmar'],
    ['960', 'Maldives'], ['961', 'Lebanon'], ['962', 'Jordan'],
    ['963', 'Syria'], ['964', 'Iraq'], ['965', 'Kuwait'],
    ['966', 'Saudi Arabia'], ['967', 'Yemen'], ['968', 'Oman'],
    ['970', 'Palestine'], ['971', 'United Arab Emirates'],
    ['972', 'Israel'], ['973', 'Bahrain'], ['974', 'Qatar'],
    ['975', 'Bhutan'], ['976', 'Mongolia'], ['977', 'Nepal'],
    ['98', 'Iran'], ['992', 'Tajikistan'], ['993', 'Turkmenistan'],
    ['994', 'Azerbaijan'], ['995', 'Georgia'], ['996', 'Kyrgyzstan'],
    ['998', 'Uzbekistan'],
].sort((a, b) => b[0].length - a[0].length); // longest prefix first

// Rough IANA timezone guess per country (single primary zone; large
// multi-timezone countries like US/Russia/Brazil are intentionally left
// blank rather than guessed wrong).
const TIMEZONE_BY_COUNTRY = {
    'Nigeria': 'Africa/Lagos', 'Ghana': 'Africa/Accra', 'Kenya': 'Africa/Nairobi',
    'South Africa': 'Africa/Johannesburg', 'Egypt': 'Africa/Cairo',
    'United Kingdom': 'Europe/London', 'Germany': 'Europe/Berlin',
    'France': 'Europe/Paris', 'India': 'Asia/Kolkata', 'China': 'Asia/Shanghai',
    'Japan': 'Asia/Tokyo', 'South Korea': 'Asia/Seoul',
    'United Arab Emirates': 'Asia/Dubai', 'Saudi Arabia': 'Asia/Riyadh',
    'Australia': 'Australia/Sydney', 'New Zealand': 'Pacific/Auckland',
    'Philippines': 'Asia/Manila', 'Indonesia': 'Asia/Jakarta',
    'Pakistan': 'Asia/Karachi', 'Bangladesh': 'Asia/Dhaka',
    'Turkey': 'Europe/Istanbul', 'Mexico': 'America/Mexico_City',
    'Argentina': 'America/Argentina/Buenos_Aires', 'Colombia': 'America/Bogota',
};

// ─── Nigerian carrier prefixes (best-effort — ported numbers WILL be wrong) ─
const NG_CARRIER_PREFIXES = {
    MTN:     ['0803','0806','0703','0706','0813','0816','0810','0814','0903','0906','0913','0916'],
    Airtel:  ['0802','0808','0708','0812','0701','0902','0907','0901','0912'],
    Glo:     ['0805','0807','0705','0815','0811','0905','0915'],
    '9mobile': ['0809','0817','0818','0909','0908'],
};

function lookupCallingCode(digits) {
    for (const [code, country] of CALLING_CODES) {
        if (digits.startsWith(code)) {
            return { code, country, national: digits.slice(code.length) };
        }
    }
    return null;
}

function guessNigerianCarrier(nationalNumber) {
    // nationalNumber here excludes the 234 calling code, e.g. "9127814853"
    const local = '0' + nationalNumber.slice(0, 9); // rebuild 0XXX form
    const prefix = local.slice(0, 4);
    for (const [carrier, prefixes] of Object.entries(NG_CARRIER_PREFIXES)) {
        if (prefixes.includes(prefix)) return carrier;
    }
    return null;
}

async function numverifyLookup(fullNumber) {
    const apiKey = process.env.NUMVERIFY_API_KEY || '';
    if (!apiKey) return null;
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(
            `https://apilayer.net/api/validate?access_key=${apiKey}&number=${encodeURIComponent(fullNumber)}`,
            { signal: controller.signal }
        );
        clearTimeout(timer);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data || data.valid === undefined) return null;
        return {
            valid: !!data.valid,
            carrier: data.carrier || null,
            lineType: data.line_type || null,
            country: data.country_name || null,
            location: data.location || null,
        };
    } catch (_) {
        return null;
    }
}

function getQuotedInfo(msg) {
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || {};
    const quotedMessage = contextInfo?.quotedMessage;
    const stanzaId = contextInfo?.stanzaId;
    const participant = contextInfo?.participant;
    return { quotedMessage, stanzaId, participant };
}

/**
 * Resolve a participant JID to a REAL phone number.
 *
 * WhatsApp increasingly hides a user's real number behind an `@lid`
 * (Linked ID) — an arbitrary internal identifier with NO mathematical
 * relationship to their phone number. Treating a LID's digits as a phone
 * number (what this command used to do) produces garbage results, e.g. a
 * LID that happens to start with "7" gets misread as a +7 Russian number.
 *
 * This resolves the real number the same way listadmins.js/demote.js do:
 * look the participant up in group metadata, where Baileys attaches the
 * real `phoneNumber` field alongside the `@lid` id. Falls back to
 * sock.onWhatsApp() for DMs / when group metadata doesn't have it.
 * Returns null (never a guess) if the real number truly can't be found.
 */
async function resolveRealNumber(sock, from, isGroup, participantJid) {
    if (!participantJid) return null;
    const bare = participantJid.split('@')[0].split(':')[0];

    // Not a LID — it's already a real phone-number JID.
    if (!participantJid.endsWith('@lid')) return bare;

    // ── LID: try group metadata's real phoneNumber field first ─────────
    if (isGroup) {
        try {
            const meta = await sock.groupMetadata(from);
            const match = meta.participants.find((p) => {
                const pid  = String(p.id || p.jid || '').split('@')[0].split(':')[0];
                const plid = String(p.lid || '').split('@')[0].split(':')[0];
                return pid === bare || plid === bare;
            });
            if (match?.phoneNumber) {
                return String(match.phoneNumber).split('@')[0].split(':')[0];
            }
            if (match?.id && match.id.endsWith('@s.whatsapp.net')) {
                return match.id.split('@')[0].split(':')[0];
            }
        } catch (_) {}
    }

    // ── Fallback: ask Baileys directly ──────────────────────────────────
    try {
        const [info] = await sock.onWhatsApp(participantJid).catch(() => []);
        if (info?.jid && info.jid.endsWith('@s.whatsapp.net')) {
            return info.jid.split('@')[0].split(':')[0];
        }
    } catch (_) {}

    return null; // could not resolve — caller must NOT fall back to the LID digits
}

module.exports = {
    name:        'phoneinfo',
    aliases:     ['pinfo', 'numberinfo'],
    description: "Get a WhatsApp user's number country/region, best-effort carrier, and device (reply to their message, or pass a number directly)",
    usage:       '.phoneinfo (reply to a message)  OR  .phoneinfo +2349127814853',
    category:    'utility',

    async execute({ sock, msg, from, args, isGroup, reply }) {
        // ── Resolve the target number: quoted sender, or a typed number ────
        let rawNumber = (args[0] || '').replace(/[^0-9+]/g, '');
        let quotedId  = null;

        if (!rawNumber) {
            const { quotedMessage, stanzaId, participant } = getQuotedInfo(msg);
            if (!participant && !stanzaId) {
                return reply(
                    '📞 *Phone Info*\n\n' +
                    'Reply to a message with `.phoneinfo`, or run `.phoneinfo <number>` directly.'
                );
            }
            const resolved = await resolveRealNumber(sock, from, isGroup, participant);
            if (!resolved) {
                return reply(
                    '❌ *Could not resolve that user\'s real phone number.*\n' +
                    '_WhatsApp is masking them behind a privacy ID (@lid) and the bot has no phone-number record for them yet — try again after they\'ve sent a few messages, or use `.phoneinfo <number>` directly._'
                );
            }
            rawNumber = resolved;
            quotedId  = stanzaId || quotedMessage?.key?.id || quotedMessage?.id || null;
        }

        const digits = rawNumber.replace(/^\+/, '');
        if (!digits || digits.length < 7) {
            return reply('❌ *Could not read a valid phone number from that.*');
        }

        const parsed = lookupCallingCode(digits);
        if (!parsed) {
            return reply(`❌ *Unrecognized calling code for* \`+${digits}\`_.`);
        }

        // ── Carrier: try Numverify (if key configured), else NG offline guess ─
        let carrier  = null;
        let lineType = null;
        let valid    = null;
        const nv = await numverifyLookup(`+${digits}`);
        if (nv) {
            carrier  = nv.carrier;
            lineType = nv.lineType;
            valid    = nv.valid;
        }
        if (!carrier && parsed.country === 'Nigeria') {
            carrier = guessNigerianCarrier(parsed.national);
        }

        const timezone = TIMEZONE_BY_COUNTRY[parsed.country] || null;

        // ── Device (reuses device.js's real message-ID heuristic) ──────────
        let deviceLabel = null;
        if (quotedId) {
            const DEVICE_LABELS = {
                ios: 'iPhone (iOS)', android: 'Android', web: 'WhatsApp Web',
                desktop: 'WhatsApp Desktop', unknown: 'Unknown',
            };
            deviceLabel = DEVICE_LABELS[detectDevice(quotedId)] || DEVICE_LABELS.unknown;
        }

        const lines = [
            '📞 *Phone Info*',
            '━━━━━━━━━━━━━━━━━━━━',
            `📱 Number     : +${digits}`,
            `🌍 Country    : ${parsed.country}`,
            `🏛️ Code       : +${parsed.code}`,
            `📡 Carrier    : ${carrier || 'Unknown' + (process.env.NUMVERIFY_API_KEY ? '' : ' (no carrier API key configured)')}`,
        ];
        if (lineType)  lines.push(`📶 Line Type  : ${lineType.toUpperCase()}`);
        if (timezone)  lines.push(`🕐 Timezone   : ${timezone}`);
        if (valid !== null) lines.push(`✅ Valid      : ${valid ? 'Yes' : 'No'}`);
        if (deviceLabel) lines.push(`📟 Device     : ${deviceLabel}`);

        return reply(lines.join('\n'));
    },
};
