require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { sequelize, Log, SoilHealth, Advisory, AdvisoryRule, AlertRule, PlanningSession } = require('./models');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Security Headers ────────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: IS_PROD ? undefined : false, // relax CSP in dev
    crossOriginEmbedderPolicy: false,
}));

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // allow no-origin (curl/mobile) or whitelisted origins
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS: origin ${origin} not allowed`));
        }
    },
    credentials: true,
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    max: 20,                   // 20 requests per window per IP
    message: { error: 'Too many requests. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,   // 1 minute
    max: 120,                  // 120 req/min for general API
    message: { error: 'Rate limit exceeded. Please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── File Upload ─────────────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        // Sanitize filename: remove path separators and use timestamp prefix
        const safeName = file.originalname.replace(/[/\\:*?"<>|]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
    },
});
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const ext = path.extname(file.originalname).toLowerCase();
        const mime = file.mimetype;
        if (allowedTypes.test(ext) && allowedTypes.test(mime)) {
            cb(null, true);
        } else {
            cb(new Error('Only image files (JPG, PNG, GIF, WebP) are allowed'));
        }
    },
});

// ── PostgreSQL Connection ───────────────────────────────────────────────────
let dbConnected = false;

(async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connected');
        // Only use alter:true in development. In production, use migrations.
        if (!IS_PROD) {
            await sequelize.sync({ alter: true });
            console.log('✅ Database tables synced (dev mode)');
        } else {
            await sequelize.sync();
            console.log('✅ Database tables verified (production mode)');
        }
        dbConnected = true;
    } catch (err) {
        console.error('❌ PostgreSQL error:', err.message);
        console.log('⚠️  Running without PostgreSQL. Check your .env database settings.');
    }
})();

// ── Database connection guard middleware ─────────────────────────────────────
function requireDB(req, res, next) {
    if (!dbConnected) {
        return res.status(503).json({ error: 'Database not available. Please try again shortly.' });
    }
    next();
}

// ── Auth & Admin Routes ─────────────────────────────────────────────────────
app.use('/api/auth', requireDB, authRoutes);
app.use('/api/admin', requireDB, adminRoutes);

// ── Farmer Data Routes (require auth + DB) ──────────────────────────────────

// Logs
app.get('/api/logs', requireDB, authMiddleware, async (req, res) => {
    try {
        const logs = await Log.findAll({
            where: { farmer_id: req.user.id },
            order: [['date', 'DESC']],
        });
        res.json(logs);
    } catch (err) {
        console.error('GET /api/logs error:', err.message);
        res.status(500).json({ error: 'Failed to fetch logs' });
    }
});

app.post('/api/logs', requireDB, authMiddleware, async (req, res) => {
    try {
        const { crop, ureaKg, urea_kg, notes, imageUrl, image_url, date } = req.body;
        const log = await Log.create({
            farmer_id: req.user.id,
            crop,
            urea_kg: ureaKg ?? urea_kg,
            notes,
            image_url: imageUrl ?? image_url,
            date: date || new Date(),
        });
        res.status(201).json(log);
    } catch (err) {
        console.error('POST /api/logs error:', err.message);
        res.status(500).json({ error: 'Failed to create log' });
    }
});

// Soil Health
app.get('/api/soil-health', requireDB, authMiddleware, async (req, res) => {
    try {
        const records = await SoilHealth.findAll({
            where: { farmer_id: req.user.id },
            order: [['date', 'DESC']],
        });
        res.json(records);
    } catch (err) {
        console.error('GET /api/soil-health error:', err.message);
        res.status(500).json({ error: 'Failed to fetch soil health' });
    }
});

app.post('/api/soil-health', requireDB, authMiddleware, async (req, res) => {
    try {
        const { residueBurned, residue_burned, manureKg, manure_kg, compostKg, compost_kg, ph, healthScore, health_score, date } = req.body;
        const record = await SoilHealth.create({
            farmer_id: req.user.id,
            residue_burned: residueBurned ?? residue_burned,
            manure_kg: manureKg ?? manure_kg,
            compost_kg: compostKg ?? compost_kg,
            ph,
            health_score: healthScore ?? health_score,
            date: date || new Date(),
        });
        res.status(201).json(record);
    } catch (err) {
        console.error('POST /api/soil-health error:', err.message);
        res.status(500).json({ error: 'Failed to create soil health record' });
    }
});

// Image upload
app.post('/api/images', requireDB, authMiddleware, upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename });
});

app.use('/uploads', express.static(uploadDir));

// Batch sync
app.post('/api/sync', requireDB, authMiddleware, async (req, res) => {
    try {
        const { logs = [], soilHealth = [] } = req.body;
        const farmerId = req.user.id;
        const logResults = await Promise.all(logs.map(l => Log.create({
            farmer_id: farmerId, synced: true, crop: l.crop,
            urea_kg: l.ureaKg ?? l.urea_kg, notes: l.notes,
            image_url: l.imageUrl ?? l.image_url, date: l.date,
        })));
        const soilResults = await Promise.all(soilHealth.map(s => SoilHealth.create({
            farmer_id: farmerId, synced: true,
            residue_burned: s.residueBurned ?? s.residue_burned,
            manure_kg: s.manureKg ?? s.manure_kg,
            compost_kg: s.compostKg ?? s.compost_kg,
            ph: s.ph, health_score: s.healthScore ?? s.health_score, date: s.date,
        })));
        res.json({ synced: { logs: logResults.length, soilHealth: soilResults.length } });
    } catch (err) {
        console.error('POST /api/sync error:', err.message);
        res.status(500).json({ error: 'Sync failed' });
    }
});

// Delete a log
app.delete('/api/logs/:id', requireDB, authMiddleware, async (req, res) => {
    try {
        const deleted = await Log.destroy({ where: { id: req.params.id, farmer_id: req.user.id } });
        if (!deleted) return res.status(404).json({ error: 'Log not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/logs error:', err.message);
        res.status(500).json({ error: 'Failed to delete log' });
    }
});

// Update a log
app.put('/api/logs/:id', requireDB, authMiddleware, async (req, res) => {
    try {
        const log = await Log.findOne({ where: { id: req.params.id, farmer_id: req.user.id } });
        if (!log) return res.status(404).json({ error: 'Log not found' });
        const { crop, ureaKg, urea_kg, notes, imageUrl, image_url, date } = req.body;
        await log.update({
            crop: crop ?? log.crop,
            urea_kg: ureaKg ?? urea_kg ?? log.urea_kg,
            notes: notes ?? log.notes,
            image_url: imageUrl ?? image_url ?? log.image_url,
            date: date ?? log.date,
        });
        res.json(log);
    } catch (err) {
        console.error('PUT /api/logs error:', err.message);
        res.status(500).json({ error: 'Failed to update log' });
    }
});

// Delete a soil health record
app.delete('/api/soil-health/:id', requireDB, authMiddleware, async (req, res) => {
    try {
        const deleted = await SoilHealth.destroy({ where: { id: req.params.id, farmer_id: req.user.id } });
        if (!deleted) return res.status(404).json({ error: 'Record not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /api/soil-health error:', err.message);
        res.status(500).json({ error: 'Failed to delete soil health record' });
    }
});

// Public: get active alerts
app.get('/api/alerts/public', requireDB, async (req, res) => {
    try {
        const { region, type } = req.query;
        const where = { is_active: true };
        if (region && region !== 'all') where.region = region;
        if (type) where.type = type;
        const alerts = await AlertRule.findAll({ where, order: [['createdAt', 'DESC']] });
        res.json({ alerts });
    } catch (err) {
        console.error('GET /api/alerts/public error:', err.message);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Public: get active advisories from DB
app.get('/api/advisories/public', requireDB, async (req, res) => {
    try {
        const { region, crop, category } = req.query;
        const where = { is_active: true, is_private: false };
        if (region) where.region = region;
        if (crop) where.crop = crop;
        if (category) where.category = category;
        const rules = await AdvisoryRule.findAll({ where });
        res.json({ rules });
    } catch (err) {
        console.error('GET /api/advisories/public error:', err.message);
        res.status(500).json({ error: 'Failed to fetch advisories' });
    }
});

// ── Planning / Crop Recommendation Sessions ─────────────────────────────
app.post('/api/planning/analyze', requireDB, authMiddleware, async (req, res) => {
    try {
        const {
            landSize, soilType, ph, organicMatter, waterSource,
            season, rainfall, tempMin, tempMax, region, imdNote, soilImageUrl,
            topCrop,
        } = req.body;

        const session = await PlanningSession.create({
            farmer_id: req.user.id,
            land_size: parseFloat(landSize) || 0,
            soil_type: soilType,
            ph: ph ? parseFloat(ph) : undefined,
            organic_matter: organicMatter,
            water_source: waterSource,
            season,
            rainfall: rainfall ? parseFloat(rainfall) : undefined,
            temp_min: tempMin ? parseFloat(tempMin) : undefined,
            temp_max: tempMax ? parseFloat(tempMax) : undefined,
            region,
            imd_note: imdNote,
            soil_image_url: soilImageUrl,
            top_crop: topCrop,
        });

        res.status(201).json({ success: true, sessionId: session.id, date: session.date });
    } catch (err) {
        console.error('Planning session error:', err.message);
        res.status(500).json({ error: 'Failed to save planning session' });
    }
});

app.get('/api/planning/history', requireDB, authMiddleware, async (req, res) => {
    try {
        const sessions = await PlanningSession.findAll({
            where: { farmer_id: req.user.id },
            order: [['date', 'DESC']],
            limit: 20,
        });
        res.json(sessions);
    } catch (err) {
        console.error('GET /api/planning/history error:', err.message);
        res.status(500).json({ error: 'Failed to fetch planning history' });
    }
});

// ── Health check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', db: dbConnected ? 'connected' : 'disconnected', time: new Date().toISOString() });
});

// ── Serve Frontend (Production) ─────────────────────────────────────────────
if (IS_PROD) {
    const distPath = path.join(__dirname, '../frontend/dist');
    if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        // SPA fallback: let React Router handle all non-API routes
        app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
        });
        console.log('✅ Serving frontend from', distPath);
    } else {
        console.warn('⚠️  Production mode but frontend/dist not found. Run: cd frontend && npm run build');
    }
}

// ── Start Server ────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`🚀 Smart Crop Advisor API running on port ${PORT} [${IS_PROD ? 'production' : 'development'}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        sequelize.close();
        process.exit(0);
    });
});
