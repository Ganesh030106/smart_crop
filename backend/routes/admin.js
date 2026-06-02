const express = require('express');
const { Op } = require('sequelize');
const { User, AdvisoryRule, AlertRule } = require('../models');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(authMiddleware, adminMiddleware);

// GET /admin/farmers — list all farmers with search/filter
router.get('/farmers', async (req, res) => {
    try {
        const { search, region, page = 1, limit = 20 } = req.query;
        const where = { role: 'user' };
        if (region) where.region = region;
        if (search) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${search}%` } },
                { email: { [Op.iLike]: `%${search}%` } },
            ];
        }
        const offset = (page - 1) * Number(limit);
        const { count: total, rows: farmers } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']],
            offset,
            limit: Number(limit),
        });
        res.json({ farmers, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        console.error('GET /admin/farmers error:', err.message);
        res.status(500).json({ error: 'Failed to fetch farmers' });
    }
});

// GET /admin/farmers/:id — get single farmer
router.get('/farmers/:id', async (req, res) => {
    try {
        const farmer = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
        });
        if (!farmer) return res.status(404).json({ error: 'Farmer not found' });
        res.json({ farmer });
    } catch (err) {
        console.error('GET /admin/farmers/:id error:', err.message);
        res.status(500).json({ error: 'Failed to fetch farmer' });
    }
});

// PUT /admin/farmers/:id — enable/disable farmer
router.put('/farmers/:id', async (req, res) => {
    try {
        const { isActive } = req.body;
        await User.update({ is_active: isActive }, { where: { id: req.params.id } });
        const farmer = await User.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
        });
        res.json({ farmer });
    } catch (err) {
        console.error('PUT /admin/farmers/:id error:', err.message);
        res.status(500).json({ error: 'Failed to update farmer' });
    }
});

// GET /admin/advisories — list all advisory rules
router.get('/advisories', async (req, res) => {
    try {
        const { region, crop, category } = req.query;
        const where = {};
        if (region) where.region = region;
        if (crop) where.crop = crop;
        if (category) where.category = category;
        const advisories = await AdvisoryRule.findAll({
            where,
            order: [['region', 'ASC'], ['crop', 'ASC'], ['category', 'ASC']],
        });
        res.json({ advisories });
    } catch (err) {
        console.error('GET /admin/advisories error:', err.message);
        res.status(500).json({ error: 'Failed to fetch advisories' });
    }
});

// Helper: map camelCase advisory fields to snake_case
function mapAdvisoryFields(body) {
    const data = {};
    if (body.region !== undefined) data.region = body.region;
    if (body.crop !== undefined) data.crop = body.crop;
    if (body.category !== undefined) data.category = body.category;
    if (body.season !== undefined) data.season = body.season;
    if (body.title !== undefined) data.title = body.title;
    if (body.recommendation !== undefined) data.recommendation = body.recommendation;
    if (body.pestName !== undefined) data.pest_name = body.pestName;
    if (body.pest_name !== undefined) data.pest_name = body.pest_name;
    if (body.isActive !== undefined) data.is_active = body.isActive;
    if (body.is_active !== undefined) data.is_active = body.is_active;
    if (body.isPrivate !== undefined) data.is_private = body.isPrivate;
    if (body.is_private !== undefined) data.is_private = body.is_private;
    return data;
}

// POST /admin/advisories — create new advisory rule
router.post('/advisories', async (req, res) => {
    try {
        const rule = await AdvisoryRule.create({ ...mapAdvisoryFields(req.body), updated_by: req.user.id });
        res.status(201).json({ rule });
    } catch (err) {
        console.error('POST /admin/advisories error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// PUT /admin/advisories/:id — edit advisory rule
router.put('/advisories/:id', async (req, res) => {
    try {
        const [updated] = await AdvisoryRule.update(
            { ...mapAdvisoryFields(req.body), updated_by: req.user.id },
            { where: { id: req.params.id } }
        );
        if (!updated) return res.status(404).json({ error: 'Advisory not found' });
        const rule = await AdvisoryRule.findByPk(req.params.id);
        res.json({ rule });
    } catch (err) {
        console.error('PUT /admin/advisories/:id error:', err.message);
        res.status(500).json({ error: 'Failed to update advisory' });
    }
});

// DELETE /admin/advisories/:id
router.delete('/advisories/:id', async (req, res) => {
    try {
        const deleted = await AdvisoryRule.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Advisory not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /admin/advisories/:id error:', err.message);
        res.status(500).json({ error: 'Failed to delete advisory' });
    }
});

// GET /admin/alerts
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await AlertRule.findAll({ order: [['created_at', 'DESC']] });
        res.json({ alerts });
    } catch (err) {
        console.error('GET /admin/alerts error:', err.message);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
});

// Helper: map camelCase alert fields to snake_case
function mapAlertFields(body) {
    const data = {};
    if (body.region !== undefined) data.region = body.region;
    if (body.type !== undefined) data.type = body.type;
    if (body.severity !== undefined) data.severity = body.severity;
    if (body.title !== undefined) data.title = body.title;
    if (body.message !== undefined) data.message = body.message;
    if (body.isActive !== undefined) data.is_active = body.isActive;
    if (body.is_active !== undefined) data.is_active = body.is_active;
    if (body.expiresAt !== undefined) data.expires_at = body.expiresAt;
    if (body.expires_at !== undefined) data.expires_at = body.expires_at;
    return data;
}

// POST /admin/alerts
router.post('/alerts', async (req, res) => {
    try {
        const alert = await AlertRule.create(mapAlertFields(req.body));
        res.status(201).json({ alert });
    } catch (err) {
        console.error('POST /admin/alerts error:', err.message);
        res.status(400).json({ error: err.message });
    }
});

// PUT /admin/alerts/:id
router.put('/alerts/:id', async (req, res) => {
    try {
        const [updated] = await AlertRule.update(mapAlertFields(req.body), { where: { id: req.params.id } });
        if (!updated) return res.status(404).json({ error: 'Alert not found' });
        const alert = await AlertRule.findByPk(req.params.id);
        res.json({ alert });
    } catch (err) {
        console.error('PUT /admin/alerts/:id error:', err.message);
        res.status(500).json({ error: 'Failed to update alert' });
    }
});

// DELETE /admin/alerts/:id
router.delete('/alerts/:id', async (req, res) => {
    try {
        const deleted = await AlertRule.destroy({ where: { id: req.params.id } });
        if (!deleted) return res.status(404).json({ error: 'Alert not found' });
        res.json({ success: true });
    } catch (err) {
        console.error('DELETE /admin/alerts/:id error:', err.message);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
});

// GET /admin/stats — dashboard overview
router.get('/stats', async (req, res) => {
    try {
        const [totalFarmers, totalAdvisories, totalAlerts] = await Promise.all([
            User.count({ where: { role: 'user' } }),
            AdvisoryRule.count(),
            AlertRule.count({ where: { is_active: true } }),
        ]);
        res.json({ totalFarmers, totalAdvisories, totalAlerts });
    } catch (err) {
        console.error('GET /admin/stats error:', err.message);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

module.exports = router;
