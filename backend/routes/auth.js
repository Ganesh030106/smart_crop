const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// POST /auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, region } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }
        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        const existing = await User.findOne({ where: { email } });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const hashed = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, password: hashed, region: region || '', role: 'user' });
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.status(201).json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, region: user.region },
        });
    } catch (err) {
        console.error('Register error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// POST /auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account disabled. Contact admin.' });
        }
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        // Update last_login in a separate call to avoid loading password back
        try {
            await User.update({ last_login: new Date() }, { where: { id: user.id } });
        } catch (updateErr) {
            console.error('Failed to update last_login:', updateErr.message);
            // Non-critical — login still succeeds
        }
        const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role, region: user.region },
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

// GET /auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ user });
    } catch (err) {
        console.error('GET /auth/me error:', err.message);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// PUT /auth/profile (update own profile)
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const { name, region, language, consent } = req.body;
        await User.update(
            { name, region, language, consent },
            { where: { id: req.user.id } }
        );
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password'] },
        });
        res.json({ user });
    } catch (err) {
        console.error('PUT /auth/profile error:', err.message);
        res.status(500).json({ error: 'Profile update failed' });
    }
});

module.exports = router;
