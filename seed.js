/**
 * Seed script: populates PostgreSQL with demo data for all tables
 * Run: node seed.js
 *
 * Tables seeded:
 *   users, advisory_rules, alert_rules, logs, soil_health, advisories, planning_sessions
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const {
    sequelize, User, AdvisoryRule, AlertRule,
    Log, SoilHealth, Advisory, PlanningSession,
} = require('./backend/models');

// ── Helper: relative date from today ────────────────────────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d;
}

async function seed() {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL');

        await sequelize.sync({ alter: true });
        console.log('✅ Tables synced');

        // ────────────────────────────────────────────────────────────────────
        // 1. USERS — admin + 5 demo farmers
        // ────────────────────────────────────────────────────────────────────
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@smartcrop.app';
        const adminPass = process.env.ADMIN_PASSWORD || 'Admin@1234';
        const hashedAdmin = await bcrypt.hash(adminPass, 12);
        const hashedFarmer = await bcrypt.hash('Farmer@1234', 12);

        const [admin] = await User.findOrCreate({
            where: { email: adminEmail },
            defaults: { name: 'Admin', email: adminEmail, password: hashedAdmin, role: 'admin' },
        });
        console.log(`✅ Admin: ${adminEmail} / ${adminPass}`);

        const farmerData = [
            { name: 'Ramesh Patil',    email: 'ramesh@demo.com',   region: 'upper_godavari', language: 'mr', gps_lat: 19.88, gps_lon: 75.34, consent: true },
            { name: 'Sunita Deshmukh', email: 'sunita@demo.com',   region: 'vidarbha',       language: 'hi', gps_lat: 20.93, gps_lon: 77.75, consent: true },
            { name: 'Arvind Sharma',   email: 'arvind@demo.com',   region: 'malwa_plateau',  language: 'hi', gps_lat: 23.17, gps_lon: 75.78, consent: true },
            { name: 'Lakshmi Reddy',   email: 'lakshmi@demo.com',  region: 'upper_godavari', language: 'te', gps_lat: 18.97, gps_lon: 79.59, consent: true },
            { name: 'Bharat Yadav',    email: 'bharat@demo.com',   region: 'vidarbha',       language: 'mr', gps_lat: 21.15, gps_lon: 79.09, consent: false },
        ];

        const farmers = [];
        for (const f of farmerData) {
            const [user] = await User.findOrCreate({
                where: { email: f.email },
                defaults: { ...f, password: hashedFarmer, role: 'user', is_active: true },
            });
            farmers.push(user);
        }
        console.log(`✅ ${farmers.length} demo farmers ready (password: Farmer@1234)`);

        // ────────────────────────────────────────────────────────────────────
        // 2. ADVISORY RULES — 15 rules across regions/crops/categories
        // ────────────────────────────────────────────────────────────────────
        const advisoryRulesData = [
            // Upper Godavari – Paddy
            { region: 'upper_godavari', crop: 'paddy', category: 'crop', season: 'kharif', title: 'Paddy Sowing Advisory', recommendation: 'Sow paddy between June 15 – July 15 after first good rain. Use certified seeds (BPT-5204 or MTU-1010). Apply Carbofuran 3G in nursery bed.', is_active: true },
            { region: 'upper_godavari', crop: 'paddy', category: 'pest', season: 'kharif', title: 'Stem Borer Alert', recommendation: 'Install pheromone traps @ 5/ha. Spray Chlorantraniliprole 0.4G @ 10 kg/ha at first sign of dead heart.', pest_name: 'stem_borer', is_active: true },
            { region: 'upper_godavari', crop: 'paddy', category: 'fertilizer', season: 'kharif', title: 'Paddy Fertilizer Schedule', recommendation: 'Basal: DAP 87 kg + MOP 67 kg/ha. Top-dress 1: Urea 87 kg at 30 DAT. Top-dress 2: Urea 87 kg at 60 DAT. Apply Zinc Sulphate 25 kg/ha.', is_active: true },
            { region: 'upper_godavari', crop: 'paddy', category: 'market', season: 'kharif', title: 'Paddy MSP Update', recommendation: 'Government MSP for common paddy: ₹2,300/quintal (2025-26). Register at nearest FCI centre with Aadhaar & land records.', is_active: true },

            // Vidarbha – Cotton
            { region: 'vidarbha', crop: 'cotton', category: 'crop', season: 'kharif', title: 'Cotton Sowing Advisory', recommendation: 'Sow Bt cotton (Bollgard-II hybrids) after first good rain in June. Seed treatment: Imidacloprid 70 WS @ 7g/kg. Spacing: 90×60 cm.', is_active: true },
            { region: 'vidarbha', crop: 'cotton', category: 'pest', season: 'kharif', title: 'Bollworm Management', recommendation: 'Install pheromone traps @ 5/ha from 45 DAS. Spray Emamectin Benzoate 5 SG @ 0.4 g/L at first sign of bollworm. Follow refuge-in-bag (RIB) strategy.', pest_name: 'bollworm', is_active: true },
            { region: 'vidarbha', crop: 'cotton', category: 'fertilizer', season: 'kharif', title: 'Cotton Fertilizer Plan', recommendation: 'Basal: 50 kg DAP + 50 kg MOP/ha. First top-dress: 50 kg Urea at squaring. Second: 25 kg Urea at boll formation. Foliar KNO3 2% at boll development.', is_active: true },

            // Malwa Plateau – Soybean
            { region: 'malwa_plateau', crop: 'soybean', category: 'crop', season: 'kharif', title: 'Soybean Sowing Advisory', recommendation: 'Treat seed with Rhizobium + PSB culture @ 5g/kg. Sow June 15 – July 15 after 100mm cumulative rain. Spacing: 45×5 cm. Varieties: JS-9560, JS-2069.', is_active: true },
            { region: 'malwa_plateau', crop: 'soybean', category: 'pest', season: 'kharif', title: 'Girdle Beetle Control', recommendation: 'Spray Thiamethoxam 25 WG @ 0.3g/L at 30-35 DAS. Repeat if infestation persists. Intercrop with maize to reduce pest load.', pest_name: 'girdle_beetle', is_active: true },
            { region: 'malwa_plateau', crop: 'soybean', category: 'market', season: 'kharif', title: 'Soybean Price Advisory', recommendation: 'Current mandi price ₹4,800-5,200/q. MSP: ₹4,892/q. Sell at APMC if price exceeds MSP. Store in moisture-proof bags at <12% moisture.', is_active: true },

            // Rabi season crops
            { region: 'upper_godavari', crop: 'wheat', category: 'crop', season: 'rabi', title: 'Wheat Sowing Advisory', recommendation: 'Sow wheat Nov 10 – Nov 30. Varieties: HD-2967, PBW-550. Seed rate 100 kg/ha. Pre-sowing irrigation essential. Row spacing: 20 cm.', is_active: true },
            { region: 'vidarbha', crop: 'gram', category: 'crop', season: 'rabi', title: 'Gram Sowing Advisory', recommendation: 'Sow chickpea (gram) mid-October to mid-November. Treat seed with Rhizobium + Trichoderma. Spacing 30×10 cm. Varieties: JAKI-9218, Vijay.', is_active: true },
            { region: 'malwa_plateau', crop: 'wheat', category: 'fertilizer', season: 'rabi', title: 'Wheat Fertilizer Schedule', recommendation: 'Basal: 120 kg DAP + 40 kg MOP/ha at sowing. First irrigation: 60 kg Urea/ha at crown root stage (21 DAS). Second: 60 kg Urea at tillering.', is_active: true },

            // General / All regions
            { region: 'all', crop: 'all', category: 'crop', season: 'all', title: 'Soil Testing Reminder', recommendation: 'Get soil tested every 2 years from your nearest Krishi Vigyan Kendra (KVK). Collect samples from 6-8 spots at 15 cm depth before sowing.', is_active: true },
            { region: 'all', crop: 'all', category: 'fertilizer', season: 'all', title: 'Organic Manure Advisory', recommendation: 'Apply 5-10 tonnes FYM or 2-3 tonnes vermicompost per hectare before sowing. Avoid burning crop residue – incorporate into soil for carbon sequestration (SDG-15).', is_active: true },
        ];

        const ruleCount = await AdvisoryRule.count();
        if (ruleCount === 0) {
            await AdvisoryRule.bulkCreate(advisoryRulesData.map(r => ({ ...r, updated_by: admin.id })));
            console.log(`✅ Seeded ${advisoryRulesData.length} advisory rules`);
        } else {
            console.log(`ℹ️  Advisory rules already exist (${ruleCount})`);
        }

        // ────────────────────────────────────────────────────────────────────
        // 3. ALERT RULES — 8 alerts
        // ────────────────────────────────────────────────────────────────────
        const alertsData = [
            { region: 'all',             type: 'weather', severity: 'high',   title: 'Heavy Rain Alert',         message: 'Heavy rainfall expected in next 48 hours across central India. Delay pesticide application. Ensure field drainage. Harvest mature crops immediately.', is_active: true, expires_at: daysAgo(-7) },
            { region: 'upper_godavari',  type: 'weather', severity: 'high',   title: 'Flood Warning – Godavari', message: 'Godavari river rising above danger mark at Nashik & Nanded. Move livestock and stored grain to higher ground. Do not enter flooded fields.', is_active: true, expires_at: daysAgo(-3) },
            { region: 'vidarbha',        type: 'weather', severity: 'medium', title: 'Heatwave Advisory',        message: 'Maximum temperature expected to exceed 44°C for next 5 days in Vidarbha. Irrigate cotton fields in evening. Provide shade for nurseries.', is_active: true, expires_at: daysAgo(-5) },
            { region: 'all',             type: 'pest',    severity: 'high',   title: 'Fall Armyworm Warning',    message: 'Fall armyworm reported in maize fields across Maharashtra & MP. Install pheromone traps. Spray Emamectin Benzoate if infestation >5% plants.', is_active: true, expires_at: daysAgo(-14) },
            { region: 'malwa_plateau',   type: 'pest',    severity: 'medium', title: 'Locust Swarm Alert',       message: 'Locust swarms reported near Rajasthan border. Coordinate with district agriculture office. Spray Malathion 96 ULV if swarms enter your area.', is_active: true, expires_at: daysAgo(-10) },
            { region: 'all',             type: 'market',  severity: 'low',    title: 'MSP Procurement Open',     message: 'FCI procurement centers open for paddy at MSP ₹2,300/q. Carry land records and Aadhaar for registration. Last date: March 31.', is_active: true, expires_at: daysAgo(-30) },
            { region: 'vidarbha',        type: 'market',  severity: 'low',    title: 'Cotton Procurement',       message: 'CCI cotton procurement at MSP ₹7,121/q at designated centres in Vidarbha. Bring quality samples. FIFO basis.', is_active: true, expires_at: daysAgo(-20) },
            { region: 'all',             type: 'weather', severity: 'low',    title: 'Normal Monsoon Forecast',  message: 'IMD forecasts normal monsoon (96-100% of LPA) for 2026. Plan kharif sowing from mid-June. Prepare nursery beds by May end.', is_active: true, expires_at: daysAgo(-60) },
        ];

        const alertCount = await AlertRule.count();
        if (alertCount === 0) {
            await AlertRule.bulkCreate(alertsData);
            console.log(`✅ Seeded ${alertsData.length} alert rules`);
        } else {
            console.log(`ℹ️  Alert rules already exist (${alertCount})`);
        }

        // ────────────────────────────────────────────────────────────────────
        // 4. LOGS — weekly crop/fertilizer logs for each farmer
        // ────────────────────────────────────────────────────────────────────
        const logCount = await Log.count();
        if (logCount === 0) {
            const logsData = [];
            const cropsByFarmer = [
                ['paddy', 'wheat'],          // Ramesh
                ['cotton', 'gram'],          // Sunita
                ['soybean', 'wheat'],        // Arvind
                ['paddy', 'maize'],          // Lakshmi
                ['cotton', 'soybean'],       // Bharat
            ];
            const noteTemplates = [
                'Applied weeding and irrigation this week.',
                'Noticed yellowing leaves on some plants. Will reduce urea next week.',
                'Good growth observed. No pest issues this week.',
                'Heavy rain caused some waterlogging. Opened drainage channels.',
                'Sprayed neem oil for minor pest infestation.',
                'Applied compost and green manure to the plot.',
                'Crop looks healthy, preparing for harvest next month.',
                'Transplanting completed. Seedlings look strong.',
                'Spotted stem borer damage. Applied recommended pesticide.',
                'Market price checked – holding stock for better rate.',
            ];

            farmers.forEach((farmer, fi) => {
                const crops = cropsByFarmer[fi];
                // 8 log entries per farmer, spread over the last 8 weeks
                for (let week = 0; week < 8; week++) {
                    logsData.push({
                        farmer_id: farmer.id,
                        date: daysAgo(week * 7 + Math.floor(Math.random() * 3)),
                        crop: crops[week < 4 ? 0 : 1],
                        urea_kg: parseFloat((Math.random() * 40 + 10).toFixed(1)),
                        notes: noteTemplates[(fi + week) % noteTemplates.length],
                        synced: true,
                    });
                }
            });

            await Log.bulkCreate(logsData);
            console.log(`✅ Seeded ${logsData.length} farmer logs`);
        } else {
            console.log(`ℹ️  Logs already exist (${logCount})`);
        }

        // ────────────────────────────────────────────────────────────────────
        // 5. SOIL HEALTH — records for each farmer (SDG-15 metrics)
        // ────────────────────────────────────────────────────────────────────
        const soilCount = await SoilHealth.count();
        if (soilCount === 0) {
            const soilData = [];
            farmers.forEach((farmer, fi) => {
                for (let month = 0; month < 6; month++) {
                    const ph = parseFloat((5.5 + Math.random() * 2.5).toFixed(1));
                    const residue = month % 3 === 0 && fi % 2 === 0;
                    const manure = parseFloat((Math.random() * 200 + 50).toFixed(1));
                    const compost = parseFloat((Math.random() * 100 + 20).toFixed(1));
                    // Health score: higher if no burning, more compost, neutral pH
                    let score = 50 + (residue ? -15 : 10) + (compost > 60 ? 10 : 0) + (ph > 6 && ph < 7.5 ? 15 : -5);
                    score = Math.min(100, Math.max(10, score + Math.floor(Math.random() * 10)));

                    soilData.push({
                        farmer_id: farmer.id,
                        date: daysAgo(month * 30 + Math.floor(Math.random() * 5)),
                        residue_burned: residue,
                        manure_kg: manure,
                        compost_kg: compost,
                        ph,
                        health_score: score,
                        synced: true,
                    });
                }
            });

            await SoilHealth.bulkCreate(soilData);
            console.log(`✅ Seeded ${soilData.length} soil health records`);
        } else {
            console.log(`ℹ️  Soil health records already exist (${soilCount})`);
        }

        // ────────────────────────────────────────────────────────────────────
        // 6. ADVISORIES — per-farmer advisory records (generated advisories)
        // ────────────────────────────────────────────────────────────────────
        const advCount = await Advisory.count();
        if (advCount === 0) {
            const advisoriesData = [];
            const adviceTemplates = [
                { region: 'upper_godavari', crop: 'paddy', category: 'crop', advice: 'Transplant paddy before July 20 for optimal yield. Maintain 2-3 cm standing water for first 2 weeks after transplanting.' },
                { region: 'upper_godavari', crop: 'paddy', category: 'fertilizer', advice: 'Apply Urea 87 kg/ha as first top-dress at 30 days after transplanting. Use leaf colour chart to adjust nitrogen dose.' },
                { region: 'upper_godavari', crop: 'wheat', category: 'crop', advice: 'Sow wheat variety HD-2967 by November end. Ensure pre-sowing irrigation (rauni). Row spacing: 20 cm.' },
                { region: 'vidarbha', crop: 'cotton', category: 'pest', advice: 'White fly population increasing. Spray Diafenthiuron 50 WP @ 1g/L. Remove and destroy heavily infested leaves.' },
                { region: 'vidarbha', crop: 'cotton', category: 'market', advice: 'Current spot price ₹7,500/q above MSP. Consider selling 50% produce now and hold rest for potential price increase.' },
                { region: 'vidarbha', crop: 'gram', category: 'crop', advice: 'Chickpea wilt observed in nearby fields. Apply Trichoderma viride @ 2.5 kg/ha through soil drenching.' },
                { region: 'malwa_plateau', crop: 'soybean', category: 'crop', advice: 'Soybean pod filling stage – ensure one protective irrigation if no rain in 7 days. Avoid waterlogging.' },
                { region: 'malwa_plateau', crop: 'soybean', category: 'fertilizer', advice: 'Foliar spray of 2% DAP + 1% KCl at pod development for better grain filling and yield improvement.' },
                { region: 'malwa_plateau', crop: 'wheat', category: 'fertilizer', advice: 'Apply second top-dress of 60 kg Urea/ha at maximum tillering stage (42-45 DAS). Irrigate within 2 days.' },
                { region: 'upper_godavari', crop: 'paddy', category: 'pest', advice: 'Brown planthopper (BPH) alert. Drain standing water for 3 days, then spray Pymetrozine 50 WG @ 0.6g/L targeting base of plants.' },
            ];

            farmers.forEach((farmer, fi) => {
                // 4 advisories per farmer
                for (let a = 0; a < 4; a++) {
                    const tpl = adviceTemplates[(fi * 4 + a) % adviceTemplates.length];
                    advisoriesData.push({
                        farmer_id: farmer.id,
                        region: tpl.region,
                        crop: tpl.crop,
                        category: tpl.category,
                        advice: tpl.advice,
                        date: daysAgo(a * 14 + Math.floor(Math.random() * 5)),
                    });
                }
            });

            await Advisory.bulkCreate(advisoriesData);
            console.log(`✅ Seeded ${advisoriesData.length} farmer advisories`);
        } else {
            console.log(`ℹ️  Advisories already exist (${advCount})`);
        }

        // ────────────────────────────────────────────────────────────────────
        // 7. PLANNING SESSIONS — crop recommendation sessions
        // ────────────────────────────────────────────────────────────────────
        const planCount = await PlanningSession.count();
        if (planCount === 0) {
            const planData = [];
            const sessionTemplates = [
                { land_size: 2.5,  soil_type: 'alluvial',     ph: 6.8, organic_matter: 'medium', water_source: 'canal',    season: 'kharif', rainfall: 1100, temp_min: 24, temp_max: 38, region: 'upper_godavari', imd_note: 'Normal monsoon expected. Onset by June 15.', top_crop: 'paddy' },
                { land_size: 4.0,  soil_type: 'black_cotton', ph: 7.2, organic_matter: 'low',    water_source: 'borewell', season: 'kharif', rainfall: 850,  temp_min: 26, temp_max: 42, region: 'vidarbha',       imd_note: 'Below normal rain in eastern Vidarbha.', top_crop: 'cotton' },
                { land_size: 3.0,  soil_type: 'black_cotton', ph: 7.0, organic_matter: 'medium', water_source: 'rainfed',  season: 'kharif', rainfall: 950,  temp_min: 23, temp_max: 39, region: 'malwa_plateau',  imd_note: 'Normal monsoon with good distribution expected.', top_crop: 'soybean' },
                { land_size: 1.5,  soil_type: 'red_laterite', ph: 5.8, organic_matter: 'high',   water_source: 'tank',     season: 'kharif', rainfall: 1200, temp_min: 22, temp_max: 35, region: 'upper_godavari', imd_note: 'Above normal rainfall. Flood risk in low-lying areas.', top_crop: 'paddy' },
                { land_size: 5.0,  soil_type: 'black_cotton', ph: 7.5, organic_matter: 'low',    water_source: 'borewell', season: 'kharif', rainfall: 780,  temp_min: 27, temp_max: 44, region: 'vidarbha',       imd_note: 'Deficit rain likely. Plan drought-tolerant varieties.', top_crop: 'cotton' },
                { land_size: 2.0,  soil_type: 'alluvial',     ph: 6.5, organic_matter: 'medium', water_source: 'canal',    season: 'rabi',   rainfall: 50,   temp_min: 8,  temp_max: 25, region: 'upper_godavari', imd_note: 'Dry winter. Supplemental irrigation needed.',  top_crop: 'wheat' },
                { land_size: 3.5,  soil_type: 'black_cotton', ph: 7.1, organic_matter: 'medium', water_source: 'borewell', season: 'rabi',   rainfall: 30,   temp_min: 10, temp_max: 28, region: 'vidarbha',       imd_note: 'Cold wave expected in January.',                top_crop: 'gram' },
                { land_size: 4.0,  soil_type: 'black_cotton', ph: 6.9, organic_matter: 'high',   water_source: 'canal',    season: 'rabi',   rainfall: 40,   temp_min: 7,  temp_max: 24, region: 'malwa_plateau',  imd_note: 'Normal winter. Good for wheat sowing.',         top_crop: 'wheat' },
            ];

            farmers.forEach((farmer, fi) => {
                // 2 planning sessions per farmer
                for (let s = 0; s < 2; s++) {
                    const tpl = sessionTemplates[(fi * 2 + s) % sessionTemplates.length];
                    planData.push({
                        farmer_id: farmer.id,
                        date: daysAgo(s * 60 + Math.floor(Math.random() * 10)),
                        ...tpl,
                    });
                }
            });

            await PlanningSession.bulkCreate(planData);
            console.log(`✅ Seeded ${planData.length} planning sessions`);
        } else {
            console.log(`ℹ️  Planning sessions already exist (${planCount})`);
        }

        // ────────────────────────────────────────────────────────────────────
        console.log('\n══════════════════════════════════════════════');
        console.log('  ✅ SEED COMPLETE — Demo data loaded!');
        console.log('══════════════════════════════════════════════');
        console.log('  Admin login  : ' + adminEmail + ' / ' + adminPass);
        console.log('  Farmer login : ramesh@demo.com / Farmer@1234');
        console.log('              (or sunita, arvind, lakshmi, bharat @demo.com)');
        console.log('══════════════════════════════════════════════\n');

        await sequelize.close();
    } catch (err) {
        console.error('❌ Seed failed:', err);
        process.exit(1);
    }
}

seed();
