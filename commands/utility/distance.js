/**
 * Distance Command
 * Usage: /distance <Location A> | <Location B>
 */

const axios = require('axios');

async function geocode(query) {
    try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: query, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'SukunaMD-Bot/3.0' }
        });
        if (res.data && res.data.length > 0) {
            return {
                lat: parseFloat(res.data[0].lat),
                lon: parseFloat(res.data[0].lon),
                display_name: res.data[0].display_name
            };
        }
    } catch (e) {
        console.error('[geocode error]', e.message);
    }
    return null;
}

async function getRoute(loc1, loc2) {
    try {
        const url = `https://router.project-osrm.org/route/v1/driving/${loc1.lon},${loc1.lat};${loc2.lon},${loc2.lat}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        if (res.data && res.data.routes && res.data.routes.length > 0) {
            const route = res.data.routes[0];
            return {
                distance: route.distance, // in meters
                duration: route.duration, // in seconds
                geometry: route.geometry // GeoJSON LineString
            };
        }
    } catch (e) {
        console.error('[osrm error]', e.message);
    }
    return null;
}

module.exports = {
    name: 'distance',
    aliases: ['dist', 'route'],
    description: 'Calculate distance and driving time between two locations',
    category: 'utility',
    async execute({ sock, msg, from, reply, args }) {
        const input = args.join(' ');
        if (!input.includes('|')) {
            return reply(
                `📍 *Distance Command*\n\n` +
                `Usage: /distance <Location A> | <Location B>\n` +
                `Example: /distance Lagos | Uyo`
            );
        }

        const [locA, locB] = input.split('|').map(s => s.trim());
        if (!locA || !locB) {
            return reply(`❌ Please provide both locations separated by a pipe (|).`);
        }

        await sock.sendMessage(from, { react: { text: '📍', key: msg.key } }).catch(() => {});

        const geoA = await geocode(locA);
        const geoB = await geocode(locB);

        if (!geoA) return reply(`❌ Could not find location: ${locA}`);
        if (!geoB) return reply(`❌ Could not find location: ${locB}`);

        const route = await getRoute(geoA, geoB);
        if (!route) return reply(`❌ Could not calculate a driving route between these locations.`);

        const distKm = (route.distance / 1000).toFixed(2);
        const durationMin = Math.round(route.duration / 60);

        // Generate a static map image using a free service (e.g., staticmapmaker or similar, or just a generic map if polyline is too complex)
        // For simplicity and reliability without API keys, we can use a service like mapbox if we had a key, but since we don't, we'll use a public OSM static map generator or just send the location.
        // Actually, let's use the geoapify static map or similar if possible, but without a key it's hard.
        // Let's use a simple static map from a public service or just send the text if image fails.
        // Wait, the screenshot shows a map with a blue route line and two red markers.
        // We can use a public static map service that accepts GeoJSON or polyline.
        // Since we don't have a guaranteed free static map API with polyline support without a key, we will try to use a generic one or just send the text.
        // Wait, there is a public service: https://sm.mapstack.org/ or similar? No.
        // Let's use a placeholder image or try to construct a basic map URL.
        // Actually, we can use the `sock.sendMessage` with `location` type for the destination, but the screenshot shows an image with caption.
        
        // Let's construct the caption first
        const caption = `📏 *${distKm} km* · ~${durationMin} min drive\n\n` +
                        `*From:* ${geoA.display_name}\n` +
                        `*To:* ${geoB.display_name}`;

        // For the image, we can use a generic map image or try to use a free static map API.
        // Let's use a simple map image URL for now, or if we can't generate one, just send the text.
        // Wait, the user wants it to work exactly as in the screenshot.
        // Let's use a free static map API. `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${(geoA.lon+geoB.lon)/2},${(geoA.lat+geoB.lat)/2}&z=5&l=map&pt=${geoA.lon},${geoA.lat},pm2rdm~${geoB.lon},${geoB.lat},pm2rdm`
        // Yandex static maps is free and doesn't strictly require an API key for basic usage.
        
        const midLon = (geoA.lon + geoB.lon) / 2;
        const midLat = (geoA.lat + geoB.lat) / 2;
        
        // Calculate zoom level based on distance
        let zoom = 5;
        if (route.distance < 10000) zoom = 12;
        else if (route.distance < 50000) zoom = 10;
        else if (route.distance < 200000) zoom = 8;
        else if (route.distance < 500000) zoom = 6;
        else if (route.distance < 1000000) zoom = 5;
        else zoom = 4;

        const mapUrl = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${midLon},${midLat}&z=${zoom}&l=map&pt=${geoA.lon},${geoA.lat},pm2rdm~${geoB.lon},${geoB.lat},pm2rdm`;

        try {
            await sock.sendMessage(from, { 
                image: { url: mapUrl }, 
                caption: caption 
            }, { quoted: msg });
        } catch (err) {
            console.error('[distance] image send error:', err.message);
            await reply(caption);
        }
    }
};
