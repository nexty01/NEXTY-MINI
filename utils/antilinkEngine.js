/**
 * AntiLink Engine — Ultra-fast, robust link detection system
 * Detects ALL types of links including obfuscated ones
 */

'use strict';

// Comprehensive domain list for detection
const SUSPICIOUS_DOMAINS = new Set([
    // Shorteners
    'bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly', 'is.gd', 'buff.ly',
    'adf.ly', 'rb.gy', 'cutt.ly', 'short.io', 'short.link', 'rebrand.ly',
    'bl.ink', 'tiny.cc', 'shorturl.at', 'urlzs.com',
    
    // WhatsApp
    'wa.me', 'chat.whatsapp.com', 'whatsapp.com', 'invite.whatsapp.com',
    
    // Telegram
    't.me', 'telegram.me', 'telegram.org', 'telega.one', 'tglink.ru',
    
    // Discord
    'discord.gg', 'discord.com', 'discordapp.com', 'discord.media',
    
    // Social Media
    'facebook.com', 'fb.me', 'fb.com', 'instagram.com', 'twitter.com', 
    'x.com', 'linkedin.com', 'tiktok.com', 'snapchat.com', 'pinterest.com',
    'reddit.com', 'tumblr.com', 'vk.com', 'ok.ru',
    
    // Video Platforms
    'youtube.com', 'youtu.be', 'vimeo.com', 'dailymotion.com', 'twitch.tv',
    
    // Common TLDs for domain detection
    'com', 'org', 'net', 'io', 'co', 'app', 'dev', 'site', 'xyz', 'info',
    'biz', 'us', 'uk', 'ca', 'au', 'de', 'fr', 'es', 'it', 'nl', 'ru',
    'cn', 'jp', 'kr', 'in', 'br', 'mx', 'pl', 'se', 'no', 'fi', 'dk'
]);

// Known invite patterns
const INVITE_PATTERNS = [
    /chat\.whatsapp\.com\/[a-zA-Z0-9]{10,}/i,
    /invite\.whatsapp\.com\/[a-zA-Z0-9]{10,}/i,
    /wa\.me\/[\+\d]{7,}/i,
    /t\.me\/[a-zA-Z0-9_]{4,}/i,
    /t\.me\/joinchat\/[a-zA-Z0-9_-]{10,}/i,
    /telegram\.me\/[a-zA-Z0-9_]{4,}/i,
    /discord\.gg\/[a-zA-Z0-9]{5,}/i,
    /discord\.com\/invite\/[a-zA-Z0-9]{5,}/i,
];

// Link regex patterns (optimized for speed)
const PATTERNS = {
    // Standard HTTP/HTTPS links
    standard: /https?:\/\/[^\s<>"'\)\]\}]+/gi,
    
    // www links without protocol
    www: /www\.[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}[^\s<>"'\)\]\}]*/gi,
    
    // Domain.TLD pattern (e.g., google.com)
    domain: /[a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,6}\b[-a-zA-Z0-9@:%_\+.~#?&/=]*/gi,
    
    // IP addresses
    ip: /\b(?:\d{1,3}\.){3}\d{1,3}(?::\d{1,5})?\b/g,
    
    // Obfuscated links (spaces between characters)
    obfuscated: /(?:h\s*t\s*t\s*p\s*s?:|w\s*w\s*w\.)[^\s<>"'\)\]\}]*/gi,
};

class AntiLinkEngine {
    constructor() {
        this.cache = new Map();
        this.cacheMaxSize = 1000;
    }

    /**
     * Check if text contains any type of link
     * @param {string} text - Text to check
     * @returns {object} - { hasLink: boolean, type: string, match: string }
     */
    detect(text) {
        if (!text || typeof text !== 'string') {
            return { hasLink: false, type: null, match: null };
        }

        // Check cache first
        const cached = this.cache.get(text);
        if (cached) return cached;

        const result = this._performDetection(text);
        
        // Cache result (with LRU eviction)
        if (this.cache.size >= this.cacheMaxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(text, result);
        
        return result;
    }

    _performDetection(text) {
        // Normalize text for obfuscation detection
        const normalizedText = text.toLowerCase().replace(/\s+/g, ' ');
        
        // 1. Check for standard HTTP/HTTPS links (fastest)
        const standardMatch = text.match(PATTERNS.standard);
        if (standardMatch) {
            for (const match of standardMatch) {
                if (this._isValidLink(match)) {
                    return { hasLink: true, type: 'standard', match: match };
                }
            }
        }

        // 2. Check for www links
        const wwwMatch = text.match(PATTERNS.www);
        if (wwwMatch) {
            for (const match of wwwMatch) {
                if (this._isValidLink(match)) {
                    return { hasLink: true, type: 'www', match: match };
                }
            }
        }

        // 3. Check for invite patterns (WhatsApp, Telegram, Discord)
        for (const pattern of INVITE_PATTERNS) {
            const inviteMatch = text.match(pattern);
            if (inviteMatch) {
                return { hasLink: true, type: 'invite', match: inviteMatch[0] };
            }
        }

        // 4. Check for domain.TLD patterns
        const domainMatches = text.match(PATTERNS.domain);
        if (domainMatches) {
            for (const match of domainMatches) {
                if (this._isSuspiciousDomain(match)) {
                    return { hasLink: true, type: 'domain', match: match };
                }
            }
        }

        // 5. Check for IP addresses
        const ipMatch = text.match(PATTERNS.ip);
        if (ipMatch && this._isValidIP(ipMatch[0])) {
            return { hasLink: true, type: 'ip', match: ipMatch[0] };
        }

        // 6. Check for obfuscated links (h t t p s : / /)
        const obfuscatedMatch = text.match(PATTERNS.obfuscated);
        if (obfuscatedMatch) {
            // Remove spaces and check if it becomes a valid link
            const cleaned = obfuscatedMatch[0].replace(/\s/g, '');
            if (this._isValidLink(cleaned)) {
                return { hasLink: true, type: 'obfuscated', match: obfuscatedMatch[0] };
            }
        }

        // 7. Check for space-obfuscated domains (g o o g l e . c o m)
        const spaceObfuscated = this._detectSpaceObfuscated(text);
        if (spaceObfuscated) {
            return { hasLink: true, type: 'space_obfuscated', match: spaceObfuscated };
        }

        return { hasLink: false, type: null, match: null };
    }

    _isValidLink(url) {
        // Filter out common false positives
        const falsePositives = [
            '...', 'etc.', 'e.g.', 'i.e.', 'vs.', 'dr.', 'mr.', 'mrs.',
            'prof.', 'sr.', 'jr.', 'st.', 'ave.', 'blvd.', 'rd.',
            'jan.', 'feb.', 'mar.', 'apr.', 'jun.', 'jul.', 'aug.',
            'sep.', 'sept.', 'oct.', 'nov.', 'dec.'
        ];
        
        const lowerUrl = url.toLowerCase();
        for (const fp of falsePositives) {
            if (lowerUrl.endsWith(fp)) return false;
        }

        // Must have a valid TLD
        const tldMatch = url.match(/\.[a-zA-Z]{2,6}(?:[\/\?#]|$)/);
        if (!tldMatch) return false;

        return true;
    }

    _isSuspiciousDomain(text) {
        const lowerText = text.toLowerCase();
        
        // Check against suspicious domains
        for (const domain of SUSPICIOUS_DOMAINS) {
            if (lowerText.includes(domain)) {
                return true;
            }
        }

        // Check for common patterns that indicate a link
        const linkIndicators = [
            /\.[a-z]{2,6}\/[^\s]*/,  // domain.com/path
            /\.[a-z]{2,6}\?[^\s]*/,  // domain.com?query
            /\.[a-z]{2,6}#[^\s]*/,   // domain.com#hash
        ];

        for (const pattern of linkIndicators) {
            if (pattern.test(lowerText)) {
                return true;
            }
        }

        return false;
    }

    _isValidIP(ip) {
        const parts = ip.split('.');
        if (parts.length !== 4) return false;
        
        for (const part of parts) {
            const num = parseInt(part);
            if (isNaN(num) || num < 0 || num > 255) return false;
        }
        
        return true;
    }

    _detectSpaceObfuscated(text) {
        // Pattern: word with single spaces between each character followed by .com/.org/etc
        const pattern = /(?:[a-zA-Z]\s+){2,}[a-zA-Z]\s*\.\s*(?:com|org|net|io|co|app|dev|xyz|info|biz|ru|uk|us|ca|au)/gi;
        const match = text.match(pattern);
        return match ? match[0] : null;
    }

    /**
     * Clear the detection cache
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * Get cache stats
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            maxSize: this.cacheMaxSize
        };
    }
}

// Export singleton instance
module.exports = new AntiLinkEngine();
