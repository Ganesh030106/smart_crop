import advisoryRules from '../data/advisory-rules.json';

/**
 * Advisory Engine
 * Combines region, crop, season, category, and pest to return prioritized recommendation
 */

export function getAdvisory({ region, crop, category, pest, soilCondition }) {
    const rules = advisoryRules;

    // Determine current season
    const month = new Date().getMonth() + 1;
    let season = 'kharif';
    if ([11, 12, 1, 2, 3].includes(month)) season = 'rabi';
    else if ([4, 5].includes(month)) season = 'zaid';

    // Normalize inputs
    const regionKey = region?.toLowerCase().replace(/\s+/g, '_') || 'upper_godavari';
    const cropKey = crop?.toLowerCase().replace(/\s+/g, '') || 'paddy';
    const categoryKey = category?.toLowerCase() || 'general';

    // Navigate the rules tree
    const regionData = rules.regions[regionKey];
    if (!regionData) {
        return {
            title: 'General Advisory',
            advice: `For ${region || 'your region'}, practice integrated crop management. Apply balanced fertilizers based on soil test results. Monitor for pests regularly.`,
            season,
            source: 'general',
        };
    }

    const cropData = regionData.crops[cropKey];
    if (!cropData) {
        const availableCrops = Object.keys(regionData.crops).join(', ');
        return {
            title: `${regionData.name} Advisory`,
            advice: `Crop data not available for "${crop}". Common crops in ${regionData.name}: ${availableCrops}. Please select one of these crops for specific advice.`,
            season,
            source: 'region',
        };
    }

    const seasonData = cropData[season] || cropData['kharif'] || cropData['rabi'];
    if (!seasonData) {
        return {
            title: `${crop} Advisory`,
            advice: `No specific data for ${season} season. General advice: Follow recommended spacing, apply balanced fertilizers, and monitor for pests weekly.`,
            season,
            source: 'crop',
        };
    }

    // Build advisory based on category
    let advice = '';
    let title = '';

    switch (categoryKey) {
        case 'crop':
        case 'crop advice':
            title = `${crop} — ${season.charAt(0).toUpperCase() + season.slice(1)} Advisory`;
            advice = seasonData.general || 'Follow standard agronomic practices for this crop.';
            break;

        case 'pest':
        case 'pest problem':
            title = `Pest Management — ${crop}`;
            if (pest) {
                const pestKey = `pest_${pest.toLowerCase().replace(/\s+/g, '')}`;
                advice = seasonData[pestKey] || seasonData.pest_stemBorer || seasonData.pest_bollworm ||
                    'Monitor field regularly. Use IPM approach: pheromone traps, biological control, then chemical as last resort.';
            } else {
                // Return all pest advisories
                const pestKeys = Object.keys(seasonData).filter(k => k.startsWith('pest_'));
                if (pestKeys.length > 0) {
                    advice = pestKeys.map(k => `• ${k.replace('pest_', '').replace(/([A-Z])/g, ' $1')}: ${seasonData[k]}`).join('\n\n');
                } else {
                    advice = 'No specific pest data. Practice regular scouting, use sticky traps, and maintain field hygiene.';
                }
            }
            break;

        case 'fertilizer':
            title = `Fertilizer Advisory — ${crop}`;
            advice = seasonData.fertilizer || rules.general_soil_advice.manure_compost;
            if (soilCondition === 'low_organic') {
                advice += `\n\n🌱 Soil Health Tip: ${rules.general_soil_advice.residue_incorporation}`;
            }
            break;

        case 'market':
            title = `Market Advisory — ${crop}`;
            advice = seasonData.market || 'Contact your nearest APMC for current prices. Register on eNAM portal for better market access.';
            break;

        default:
            title = `${crop} Advisory`;
            advice = seasonData.general || 'Follow recommended agronomic practices for your region and season.';
    }

    return {
        title,
        advice,
        season,
        region: regionData.name,
        crop,
        source: 'rules',
    };
}

export function getAvailableRegions() {
    return Object.entries(advisoryRules.regions).map(([key, val]) => ({
        key,
        name: val.name,
    }));
}

export function getAvailableCrops(regionKey) {
    const region = advisoryRules.regions[regionKey];
    if (!region) return [];
    return Object.keys(region.crops);
}

export function getSoilAdvice(type) {
    return advisoryRules.general_soil_advice[type] || '';
}
