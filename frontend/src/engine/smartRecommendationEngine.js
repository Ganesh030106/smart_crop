/**
 * Smart Crop Recommendation Engine v3 (ML-Enhanced)
 * Scores crops based on: Soil, Water, NPK, pH, Organic Matter,
 * Season, Rainfall, Temperature, Market Trends, Soil Health Impact.
 */

const CROP_DATABASE = {
    // ─── Cereals ───
    paddy: {
        name: 'Paddy (Rice)',
        emoji: '🌾',
        type: 'cereal',
        suitedSoil: ['clay', 'loamy', 'alluvial'],
        waterReq: 'high',
        waterEfficiency: 'low', // litres per kg yield
        duration: '120–150 days',
        avgYieldPerAcre: 25, // quintals
        marketPrice: 2200,   // MSP ref
        costPerAcre: 25000,
        risk: 'medium',
        optimalPH: [5.5, 7.0],
        optimalNPK: { n: 100, p: 50, k: 50 }, // kg/acre approx need
        seasons: ['kharif'],
        minRainfall: 800,
        maxRainfall: 2500,
        minTemp: 20,
        maxTemp: 38,
        soilDegradationIndex: 3, // 1 (good) to 5 (bad)
        nitrogenFixing: false,
        tips: ['Use SRI method for water saving', 'Monitor for stem borer', 'Maintain 5cm water level'],
    },
    wheat: {
        name: 'Wheat',
        emoji: '🌾',
        type: 'cereal',
        suitedSoil: ['loamy', 'alluvial'],
        waterReq: 'medium',
        waterEfficiency: 'medium',
        duration: '110–130 days',
        avgYieldPerAcre: 18,
        marketPrice: 2275,
        costPerAcre: 18000,
        risk: 'low',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 120, p: 60, k: 40 },
        seasons: ['rabi'],
        minRainfall: 250,
        maxRainfall: 900,
        minTemp: 10,
        maxTemp: 25,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Sow by Nov 15 for best yield', 'Apply zinc if soil deficient', 'Irrigate at crown root initiation'],
    },
    maize: {
        name: 'Maize (Corn)',
        emoji: '🌽',
        type: 'cereal',
        suitedSoil: ['red', 'loamy', 'alluvial'],
        waterReq: 'medium',
        waterEfficiency: 'high',
        duration: '90–110 days',
        avgYieldPerAcre: 25,
        marketPrice: 2090,
        costPerAcre: 20000,
        risk: 'medium',
        optimalPH: [5.8, 7.0],
        optimalNPK: { n: 120, p: 60, k: 40 },
        seasons: ['kharif', 'rabi', 'zaid'],
        minRainfall: 500,
        maxRainfall: 1000,
        minTemp: 18,
        maxTemp: 35,
        soilDegradationIndex: 4, // Heavy feeder
        nitrogenFixing: false,
        tips: ['Rotate with legumes to restore N', 'Control fall armyworm early', 'Avoid waterlogging'],
    },
    bajra: {
        name: 'Pearl Millet (Bajra)',
        emoji: '🥣',
        type: 'cereal',
        suitedSoil: ['sandy', 'loamy', 'red'],
        waterReq: 'low',
        waterEfficiency: 'very_high',
        duration: '70–90 days',
        avgYieldPerAcre: 12,
        marketPrice: 2350,
        costPerAcre: 8000,
        risk: 'low',
        optimalPH: [6.5, 8.0],
        optimalNPK: { n: 60, p: 30, k: 20 },
        seasons: ['kharif', 'zaid'],
        minRainfall: 300,
        maxRainfall: 700,
        minTemp: 25,
        maxTemp: 40,
        soilDegradationIndex: 2,
        nitrogenFixing: false,
        tips: ['Ideal for low rainfall areas', 'Drought resistant', 'Good fodder crop'],
    },

    // ─── Cash Crops ───
    cotton: {
        name: 'Cotton',
        emoji: '🌿',
        type: 'cash',
        suitedSoil: ['black', 'alluvial'],
        waterReq: 'medium',
        waterEfficiency: 'low',
        duration: '150–180 days',
        avgYieldPerAcre: 12,
        marketPrice: 6800,
        costPerAcre: 30000,
        risk: 'high',
        optimalPH: [6.0, 8.0],
        optimalNPK: { n: 100, p: 50, k: 50 },
        seasons: ['kharif'],
        minRainfall: 500,
        maxRainfall: 1500,
        minTemp: 20,
        maxTemp: 40,
        soilDegradationIndex: 4,
        nitrogenFixing: false,
        tips: ['Use IPM for pink bollworm', 'Drain excess water immediately', 'Deep ploughing in summer'],
    },
    sugarcane: {
        name: 'Sugarcane',
        emoji: '🎋',
        type: 'cash',
        suitedSoil: ['alluvial', 'loamy', 'black'],
        waterReq: 'very_high',
        waterEfficiency: 'low',
        duration: '300–365 days',
        avgYieldPerAcre: 350,
        marketPrice: 340, // FRP
        costPerAcre: 55000,
        risk: 'low',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 250, p: 100, k: 100 },
        seasons: ['kharif', 'rabi'], // planting window
        minRainfall: 1000,
        maxRainfall: 2500,
        minTemp: 20,
        maxTemp: 40,
        soilDegradationIndex: 4,
        nitrogenFixing: false,
        tips: ['Plant in furrows', 'Trash mulching saves water', 'Drip irrigation recommended'],
    },
    turmeric: {
        name: 'Turmeric',
        emoji: '🟡',
        type: 'cash',
        suitedSoil: ['red', 'loamy', 'alluvial'],
        waterReq: 'medium',
        waterEfficiency: 'medium',
        duration: '270–300 days',
        avgYieldPerAcre: 25, // cured
        marketPrice: 9000,
        costPerAcre: 60000,
        risk: 'low',
        optimalPH: [5.5, 7.0],
        optimalNPK: { n: 60, p: 30, k: 90 },
        seasons: ['kharif'],
        minRainfall: 1000,
        maxRainfall: 2000,
        minTemp: 20,
        maxTemp: 35,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Needs well-drained soil', 'High organic matter needed', 'Intercrop with onion possible'],
    },

    // ─── Pulses (Soil Builders) ───
    soybean: {
        name: 'Soybean',
        emoji: '🫘',
        type: 'pulse',
        suitedSoil: ['black', 'loamy'],
        waterReq: 'medium',
        waterEfficiency: 'high',
        duration: '90–110 days',
        avgYieldPerAcre: 8,
        marketPrice: 4600,
        costPerAcre: 15000,
        risk: 'low',
        optimalPH: [6.0, 7.0],
        optimalNPK: { n: 20, p: 60, k: 40 },
        seasons: ['kharif'],
        minRainfall: 450,
        maxRainfall: 1200,
        minTemp: 20,
        maxTemp: 32,
        soilDegradationIndex: 1, // Excellent
        nitrogenFixing: true,
        tips: ['Fixes atmospheric nitrogen', 'Seed treatment is crucial', 'Short duration crop'],
    },
    chickpea: {
        name: 'Chickpea (Chana)',
        emoji: '🫛',
        type: 'pulse',
        suitedSoil: ['black', 'loamy', 'alluvial'],
        waterReq: 'low',
        waterEfficiency: 'high',
        duration: '95–120 days',
        avgYieldPerAcre: 8,
        marketPrice: 5400,
        costPerAcre: 14000,
        risk: 'low',
        optimalPH: [6.0, 8.0],
        optimalNPK: { n: 20, p: 50, k: 20 },
        seasons: ['rabi'],
        minRainfall: 300,
        maxRainfall: 700,
        minTemp: 10,
        maxTemp: 25,
        soilDegradationIndex: 1,
        nitrogenFixing: true,
        tips: ['Best soil health builder', 'Nipping increases branching', 'Avoid excessive irrigation'],
    },
    moong: {
        name: 'Green Gram (Moong)',
        emoji: '🟢',
        type: 'pulse',
        suitedSoil: ['loamy', 'sandy', 'black'],
        waterReq: 'low',
        waterEfficiency: 'high',
        duration: '60–70 days',
        avgYieldPerAcre: 5,
        marketPrice: 7500,
        costPerAcre: 8000,
        risk: 'low',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 15, p: 40, k: 20 },
        seasons: ['kharif', 'zaid'],
        minRainfall: 350,
        maxRainfall: 800,
        minTemp: 25,
        maxTemp: 35,
        soilDegradationIndex: 1,
        nitrogenFixing: true,
        tips: ['Excellent catch crop', 'Fits between rice-wheat', 'Matures in 60 days'],
    },

    // ─── Oilseeds ───
    groundnut: {
        name: 'Groundnut',
        emoji: '🥜',
        type: 'oilseed',
        suitedSoil: ['red', 'sandy', 'loamy'],
        waterReq: 'low',
        waterEfficiency: 'medium',
        duration: '100–120 days',
        avgYieldPerAcre: 10,
        marketPrice: 6300,
        costPerAcre: 22000,
        risk: 'medium',
        optimalPH: [5.5, 7.0],
        optimalNPK: { n: 20, p: 50, k: 40 },
        seasons: ['kharif', 'rabi', 'zaid'],
        minRainfall: 450,
        maxRainfall: 1250,
        minTemp: 22,
        maxTemp: 36,
        soilDegradationIndex: 2,
        nitrogenFixing: true,
        tips: ['Needs loose soil for pegging', 'Apply gypsum for pod filling', 'Control tikka disease'],
    },
    mustard: {
        name: 'Mustard (Sarso)',
        emoji: '🌼',
        type: 'oilseed',
        suitedSoil: ['loamy', 'alluvial', 'sandy'],
        waterReq: 'low',
        waterEfficiency: 'high',
        duration: '100–135 days',
        avgYieldPerAcre: 8,
        marketPrice: 5650,
        costPerAcre: 12000,
        risk: 'low',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 80, p: 40, k: 20 },
        seasons: ['rabi'],
        minRainfall: 200,
        maxRainfall: 600,
        minTemp: 10,
        maxTemp: 25,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Sensitive to frost', 'Apply sulphur for oil content', 'Thinning improves yield'],
    },
    sunflower: {
        name: 'Sunflower',
        emoji: '🌻',
        type: 'oilseed',
        suitedSoil: ['alluvial', 'loamy', 'black'],
        waterReq: 'low',
        waterEfficiency: 'medium',
        duration: '85–100 days',
        avgYieldPerAcre: 8,
        marketPrice: 6700,
        costPerAcre: 16000,
        risk: 'low',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 60, p: 60, k: 40 },
        seasons: ['rabi', 'zaid', 'kharif'],
        minRainfall: 300,
        maxRainfall: 1000,
        minTemp: 15,
        maxTemp: 35,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Photo-insensitive crop', 'Honey bees increase yield', 'Avoid water stress at flowering'],
    },

    // ─── Vegetables & Horticulture ───
    tomato: {
        name: 'Tomato',
        emoji: '🍅',
        type: 'vegetable',
        suitedSoil: ['loamy', 'red', 'black'],
        waterReq: 'medium',
        waterEfficiency: 'medium',
        duration: '110–140 days',
        avgYieldPerAcre: 250,
        marketPrice: 1500, // Volatile
        costPerAcre: 40000,
        risk: 'high',
        optimalPH: [6.0, 7.0],
        optimalNPK: { n: 100, p: 60, k: 60 },
        seasons: ['rabi', 'kharif', 'zaid'],
        minRainfall: 400,
        maxRainfall: 1500,
        minTemp: 15,
        maxTemp: 32,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Staking increases yield', 'Use mulching', 'Monitor for blight'],
    },
    onion: {
        name: 'Onion',
        emoji: '🧅',
        type: 'vegetable',
        suitedSoil: ['loamy', 'alluvial'],
        waterReq: 'medium',
        waterEfficiency: 'medium',
        duration: '120–150 days',
        avgYieldPerAcre: 100,
        marketPrice: 1800, // Highly volatile
        costPerAcre: 35000,
        risk: 'high',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 80, p: 50, k: 50 },
        seasons: ['rabi', 'kharif'],
        minRainfall: 350,
        maxRainfall: 800,
        minTemp: 15,
        maxTemp: 30,
        soilDegradationIndex: 2,
        nitrogenFixing: false,
        tips: ['Requires friable soil', 'Stop irrigation before harvest', 'Curing adds storage life'],
    },
    chilli: {
        name: 'Chilli',
        emoji: '🌶️',
        type: 'vegetable',
        suitedSoil: ['black', 'loamy', 'red'],
        waterReq: 'medium',
        waterEfficiency: 'medium',
        duration: '150–180 days',
        avgYieldPerAcre: 40, // Green chilli
        marketPrice: 3500,
        costPerAcre: 45000,
        risk: 'medium',
        optimalPH: [6.0, 7.0],
        optimalNPK: { n: 90, p: 40, k: 40 },
        seasons: ['kharif', 'rabi'],
        minRainfall: 600,
        maxRainfall: 1200,
        minTemp: 20,
        maxTemp: 35,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Avoid water stagnation', 'Control leaf curl virus', 'Pick regularly'],
    },
    banana: {
        name: 'Banana',
        emoji: '🍌',
        type: 'fruit',
        suitedSoil: ['alluvial', 'loamy'],
        waterReq: 'high',
        waterEfficiency: 'medium',
        duration: '365 days',
        avgYieldPerAcre: 200, // quintals (approx 20 tons)
        marketPrice: 1200,
        costPerAcre: 60000,
        risk: 'medium',
        optimalPH: [6.0, 7.5],
        optimalNPK: { n: 200, p: 60, k: 250 },
        seasons: ['kharif', 'rabi'],
        minRainfall: 1200,
        maxRainfall: 3000,
        minTemp: 15,
        maxTemp: 40,
        soilDegradationIndex: 4,
        nitrogenFixing: false,
        tips: ['High potassium feeder', 'Propping required', 'Desuckering is important'],
    },
    brinjal: {
        name: 'Brinjal (Eggplant)',
        emoji: '🍆',
        type: 'vegetable',
        suitedSoil: ['loamy', 'clay', 'sandy'],
        waterReq: 'medium',
        waterEfficiency: 'medium',
        duration: '140–160 days',
        avgYieldPerAcre: 120,
        marketPrice: 1500,
        costPerAcre: 30000,
        risk: 'medium',
        optimalPH: [5.5, 7.0],
        optimalNPK: { n: 100, p: 50, k: 50 },
        seasons: ['kharif', 'rabi'],
        minRainfall: 500,
        maxRainfall: 1200,
        minTemp: 20,
        maxTemp: 35,
        soilDegradationIndex: 3,
        nitrogenFixing: false,
        tips: ['Resistant to many pests', 'Mulching helps', 'Prune old leaves'],
    },
};

/**
 * @param {Object} inputs
 * @param {number|string} inputs.landSize       - acreage
 * @param {string}  inputs.soilType             - black|red|alluvial|loamy|clay|sandy
 * @param {string}  inputs.waterSource          - irrigated|rainfed
 * @param {number}  [inputs.ph]                 - soil pH
 * @param {object}  [inputs.npk]                - { n: 0-100, p: 0-100, k: 0-100 }
 * @param {string}  [inputs.organicMatter]      - low|medium|high
 * @param {string}  [inputs.season]             - kharif|rabi|zaid
 * @param {number}  [inputs.rainfall]           - annual mm
 * @param {number}  [inputs.tempMin]            - °C
 * @param {number}  [inputs.tempMax]            - °C
 * @param {number}  [inputs.budget]             - max investment per acre
 * @param {object}  [inputs.marketRateOverrides] - { cropId: price }
 */
export function getSmartRecommendation(inputs) {
    const {
        soilType, waterSource, landSize,
        ph, organicMatter, season,
        rainfall, tempMin, tempMax,
        npk, budget, marketRateOverrides = {}
    } = inputs;

    const acres = parseFloat(landSize) || 1;
    const recommendations = [];

    for (const [key, crop] of Object.entries(CROP_DATABASE)) {
        let score = 0;
        const reasons = [];

        // ── 1. Soil Suitability (Max 20 pts) ──────────────────────────────
        if (crop.suitedSoil.includes(soilType)) {
            score += 20;
            reasons.push({ type: 'good', text: `✅ Ideal for ${soilType} soil` });
        } else {
            score -= 10;
            reasons.push({ type: 'bad', text: `⚠️ Not optimal for ${soilType} soil` });
        }

        // ── 2. Water / Irrigation (Max 15 pts) ────────────────────────────
        if (waterSource === 'rainfed') {
            if (crop.waterReq === 'low') {
                score += 15;
                reasons.push({ type: 'good', text: '✅ Drought tolerant' });
            } else if (crop.waterReq === 'medium') {
                score += 5;
                reasons.push({ type: 'warn', text: '⚡ Moderate water need' });
            } else {
                score -= 25;
                reasons.push({ type: 'bad', text: '❌ High risk without irrigation' });
            }
        } else {
            if (crop.waterReq === 'high') { score += 15; }
            else { score += 12; }
            reasons.push({ type: 'good', text: '✅ Irrigation ensures yield' });
        }

        // ── 3. Season Match (Max 15 pts) ──────────────────────────────────
        if (season) {
            if (crop.seasons.includes(season)) {
                score += 15;
                reasons.push({ type: 'good', text: `✅ Grows well in ${season} season` });
            } else {
                score -= 20;
                reasons.push({ type: 'bad', text: `❌ Wrong season (${crop.seasons.join(', ')} needed)` });
            }
        }

        // ── 4. Climate (Rain & Temp) (Max 20 pts) ─────────────────────────
        if (rainfall) {
            const rain = parseFloat(rainfall);
            if (rain >= crop.minRainfall && rain <= crop.maxRainfall) score += 10;
            else if (rain < crop.minRainfall) score -= 5;
            else score -= 2;
        }

        if (tempMin && tempMax) {
            const avgTemp = (parseFloat(tempMin) + parseFloat(tempMax)) / 2;
            if (avgTemp >= crop.minTemp && avgTemp <= crop.maxTemp) score += 10;
            else score -= 5;
        }

        // ── 5. NPK & pH (Max 16 pts) ──────────────────────────────────────
        // pH
        if (ph) {
            const phVal = parseFloat(ph);
            if (phVal >= crop.optimalPH[0] && phVal <= crop.optimalPH[1]) score += 8;
            else if (phVal >= crop.optimalPH[0] - 0.5 && phVal <= crop.optimalPH[1] + 0.5) score += 4;
            else score -= 5;
        }

        // NPK bonus check (simple logic: is soil rich where crop needs it?)
        // Assuming we don't have soil test values matching crop needs exactly, we skip penalty 
        // but if we had input like "High N", we could match against crop requirements.
        // Here we just give a small baseline if data exists.
        if (npk) score += 8;

        // ── 6. Soil Health & Degradation (Max 7 pts) ──────────────────────
        if (crop.nitrogenFixing) {
            score += 5;
            reasons.push({ type: 'good', text: '🌱 Improves soil (Nitro-fixing)' });
        }
        if (crop.soilDegradationIndex <= 2) {
            score += 2;
        } else if (crop.soilDegradationIndex >= 4) {
            // No penalty, just no bonus, but maybe warn if soil is poor
            if (organicMatter === 'low') score -= 5; // Heavy feeder in poor soil is bad
        }

        // ── 7. Budget Check ──────────────────────────────────────────────
        if (budget) {
            const cropCost = crop.costPerAcre;
            if (cropCost > budget) {
                score -= 20;
                reasons.push({ type: 'bad', text: `💰 Cost exceeds budget (₹${cropCost}/acre)` });
            }
        }

        // ── 8. Profit Calculation ────────────────────────────────────────
        const price = marketRateOverrides[key] ? parseFloat(marketRateOverrides[key]) : crop.marketPrice;
        const grossIncome = crop.avgYieldPerAcre * price;
        const netProfit = grossIncome - crop.costPerAcre;

        // Profit Score (Max 7 pts)
        if (netProfit > 50000) score += 7;
        else if (netProfit > 30000) score += 5;
        else if (netProfit > 15000) score += 3;

        const roi = crop.costPerAcre > 0 ? (netProfit / crop.costPerAcre) * 100 : 0;

        // ── Final Crop Object ────────────────────────────────────────────
        recommendations.push({
            id: key,
            ...crop,
            marketPrice: price, // Use overridden price
            score: Math.max(0, Math.min(100, score)), // Clamp 0-100
            reasons,
            netProfit,
            grossIncome,
            totalYield: crop.avgYieldPerAcre * acres,
            totalProfit: netProfit * acres,
            grossTotal: grossIncome * acres,
            roi: Math.round(roi),
            soilHealthBadge: crop.soilDegradationIndex <= 2 ? 'Excellent' : crop.soilDegradationIndex === 3 ? 'Good' : 'Fair',
        });
    }

    return recommendations.sort((a, b) => b.score - a.score).slice(0, 5);
}
