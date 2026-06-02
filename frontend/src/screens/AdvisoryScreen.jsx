import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthContext';

// ── Crop Guide Data ────────────────────────────────────────────────────────
const CROP_GUIDE = [
    {
        crop: 'Rice (Paddy)', icon: '🌾', season: 'Kharif',
        steps: [
            'Land preparation: Puddle field, 2–3 ploughings, level the field.',
            'Seed treatment: Soak seeds 24 hrs, treat with Carbendazim 2g/kg.',
            'Transplant seedlings at 21–25 days old, spacing 20×15 cm.',
            'Apply basal fertilizer: 50kg DAP + 30kg MOP/acre before transplanting.',
            'Top dress urea: 25 kg/acre at tillering, 25 kg at panicle initiation.',
            'Water management: Maintain 5 cm water level during vegetative stage.',
            'Harvest at 25–30 days after 80% grain fill (golden yellow colour).',
        ]
    },
    {
        crop: 'Cotton', icon: '🌿', season: 'Kharif',
        steps: [
            'Sow in June–July after pre-monsoon rains, spacing 90×60 cm.',
            'Use Bt cotton varieties (approved hybrids) for boll worm resistance.',
            'Fertilizer: 40:20:20 NPK kg/acre in split doses.',
            'Irrigation: Critical at flowering and boll development stages.',
            'Monitor for bollworm, whitefly, and sucking pests weekly.',
            'Pick cotton in 2–3 pickings as bolls open (Oct–Jan).',
        ]
    },
    {
        crop: 'Wheat', icon: '🌾', season: 'Rabi',
        steps: [
            'Sow in Oct–Nov, use timely varieties (HD 2781, PBW 343).',
            'Seed rate: 40–45 kg/acre for irrigated, 50–55 kg for rainfed.',
            'Apply 50 kg DAP/acre at sowing as basal dose.',
            'Irrigate at Crown Root Initiation (21 DAS) and Tillering (40 DAS).',
            'Spray Clodinafop 15% WP for narrow-leaf weed control.',
            'Harvest when grain moisture < 12% (May).',
        ]
    },
    {
        crop: 'Soybean', icon: '🌱', season: 'Kharif',
        steps: [
            'Sow June–July after first rains, spacing 45×5 cm.',
            'Seed treatment: Rhizobium culture + Phosphate Solubilizing Bacteria.',
            'Basal: 20:60:20 NPK kg/acre (low nitrogen due to N-fixation).',
            'Keep field weed-free for first 45 days; 2 hand weedings.',
            'Monitor for girdle beetle and pod borer from 40 DAS.',
            'Harvest after 90–100 days when 95% pods turn brown.',
        ]
    },
];

// ── Fertilizer Guide ───────────────────────────────────────────────────────
const FERTILIZER_GUIDE = [
    { name: 'Urea (46% N)', use: 'Top dressing for nitrogen. Apply in 2 splits — at sowing and 30–40 DAS.', icon: '🧪', color: '#60a5fa' },
    { name: 'DAP (18:46:0)', use: 'Basal dose for phosphorus. Apply at land preparation for root growth.', icon: '🔬', color: '#a78bfa' },
    { name: 'MOP (60% K)', use: 'Potassium for grain filling. Apply at 30–40 DAS or at basal.', icon: '⚗️', color: '#fbbf24' },
    { name: 'SSP (16% P)', use: 'Cheaper P source. Also supplies Ca and S. Use for oilseed crops.', icon: '🌡️', color: '#f87171' },
    { name: 'Zinc Sulphate', use: 'For zinc-deficient soils (yellowing). Apply 10 kg/acre once a season.', icon: '💊', color: '#34d399' },
    { name: 'Neem Oil (Organic)', use: 'Foliar spray for pest repellent. Mix 5 ml/L with 1 ml soap. Safe for soil.', icon: '🌿', color: '#86efac' },
];

// ── Market MSP Data (2024–25) ──────────────────────────────────────────────
const MSP_DATA = [
    { crop: 'Paddy (Common)', msp: 2300, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Jowar (Hybrid)', msp: 3371, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Bajra', msp: 2625, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Maize', msp: 2225, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Cotton (Medium)', msp: 7121, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Soybean (Yellow)', msp: 4892, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Groundnut', msp: 6783, unit: '/Quintal', season: 'Kharif 2024' },
    { crop: 'Wheat', msp: 2275, unit: '/Quintal', season: 'Rabi 2024-25' },
    { crop: 'Gram (Chana)', msp: 5650, unit: '/Quintal', season: 'Rabi 2024-25' },
    { crop: 'Mustard', msp: 5950, unit: '/Quintal', season: 'Rabi 2024-25' },
    { crop: 'Lentil (Masur)', msp: 6425, unit: '/Quintal', season: 'Rabi 2024-25' },
    { crop: 'Sunflower', msp: 7280, unit: '/Quintal', season: 'Kharif 2024' },
];

const TABS = [
    { id: 'expert', label: 'Expert Tips', icon: '💡' },
    { id: 'crops', label: 'Crop Guide', icon: '🌾' },
    { id: 'fertilizer', label: 'Fertilizer', icon: '🧪' },
    { id: 'market', label: 'MSP/Market', icon: '📈' },
];

export default function AdvisoryScreen({ isOnline }) {
    const { authFetch } = useAuth();
    const [activeTab, setActiveTab] = useState('expert');
    const [expandedCrop, setExpandedCrop] = useState(null);
    const [advisories, setAdvisories] = useState([]);
    const [advLoading, setAdvLoading] = useState(false);
    const [advFilter, setAdvFilter] = useState('all');

    const loadAdvisories = useCallback(async () => {
        setAdvLoading(true);
        try {
            const res = await authFetch('/api/advisories/public');
            if (res.ok) {
                const data = await res.json();
                setAdvisories(data.rules || []);
            }
        } catch (err) {
            console.error('Failed to load advisories:', err);
        }
        setAdvLoading(false);
    }, [authFetch]);

    useEffect(() => {
        let active = true;
        if (isOnline) {
            Promise.resolve().then(() => {
                if (active) loadAdvisories();
            });
        }
        return () => { active = false; };
    }, [isOnline, loadAdvisories]);

    const filteredAdvisories = advFilter === 'all'
        ? advisories
        : advisories.filter(a => a.category === advFilter);

    return (
        <div className="screen">
            <div className="screen-header">
                <span className="header-icon">🤖</span>
                <div>
                    <h2>Advisory</h2>
                    <p style={{ fontSize: '0.75rem', margin: 0, color: 'var(--text-muted)' }}>
                        Crop Guide · Fertilizer · Market MSP
                    </p>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{
                display: 'flex', gap: 6, marginBottom: 20,
                background: 'var(--bg-card)', borderRadius: 14, padding: 4,
                border: '1px solid var(--border-color)'
            }}>
                {TABS.map(tab => (
                    <button key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            flex: 1, padding: '9px 6px', border: 'none', borderRadius: 10, cursor: 'pointer',
                            background: activeTab === tab.id ? 'var(--accent-green)' : 'transparent',
                            color: activeTab === tab.id ? '#000' : 'var(--text-muted)',
                            fontWeight: activeTab === tab.id ? 700 : 500,
                            fontSize: '0.75rem', fontFamily: 'Outfit, sans-serif',
                            transition: 'all 0.2s ease',
                        }}>
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── Expert Tips Tab (from backend) ── */}
            {activeTab === 'expert' && (
                <div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                        {['all', 'crop', 'pest', 'fertilizer', 'market'].map(cat => (
                            <button key={cat} onClick={() => setAdvFilter(cat)}
                                className={`filter-tab ${advFilter === cat ? 'active' : ''}`}
                                style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                                {cat === 'all' ? '📋 All' : cat === 'crop' ? '🌾 Crop' : cat === 'pest' ? '🐛 Pest' : cat === 'fertilizer' ? '🧪 Fertilizer' : '📈 Market'}
                            </button>
                        ))}
                    </div>
                    {advLoading ? (
                        <div className="loading-container"><div className="spinner" /><p>Loading advisories...</p></div>
                    ) : filteredAdvisories.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            {filteredAdvisories.map((adv) => (
                                <div key={adv.id} className="card" style={{ padding: 16, borderLeft: '4px solid var(--accent-green)' }}>
                                    <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                                        <span className="badge badge-green">{adv.crop}</span>
                                        <span className="badge badge-blue">{adv.category}</span>
                                        <span className="badge badge-amber">{adv.season}</span>
                                        <span className="badge badge-blue">{adv.region}</span>
                                    </div>
                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: 6 }}>{adv.title}</h4>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                                        {adv.recommendation}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="card text-center" style={{ padding: 32 }}>
                            <p style={{ fontSize: '2rem', marginBottom: 8 }}>💡</p>
                            <p style={{ color: 'var(--text-muted)' }}>
                                {isOnline ? 'No expert advisories available yet.' : 'Connect to internet to load expert advisories.'}
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* ── Crop Guide Tab ── */}
            {activeTab === 'crops' && (
                <div>
                    <p className="section-title">Step-by-Step Crop Guide</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {CROP_GUIDE.map((c, i) => (
                            <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                                <button
                                    onClick={() => setExpandedCrop(expandedCrop === i ? null : i)}
                                    style={{
                                        width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                                        padding: '16px', display: 'flex', alignItems: 'center', gap: 12,
                                        fontFamily: 'Outfit, sans-serif', textAlign: 'left'
                                    }}>
                                    <span style={{ fontSize: '1.8rem' }}>{c.icon}</span>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.95rem' }}>{c.crop}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📅 Season: {c.season}</div>
                                    </div>
                                    <span style={{ color: 'var(--accent-green)', fontSize: '1.2rem' }}>
                                        {expandedCrop === i ? '▲' : '▼'}
                                    </span>
                                </button>
                                {expandedCrop === i && (
                                    <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border-color)' }}>
                                        <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {c.steps.map((step, si) => (
                                                <div key={si} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                    <span style={{
                                                        minWidth: 22, height: 22, borderRadius: '50%',
                                                        background: 'rgba(74,222,128,0.15)', color: 'var(--accent-green)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.7rem', fontWeight: 700, flexShrink: 0
                                                    }}>{si + 1}</span>
                                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{step}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Fertilizer Tab ── */}
            {activeTab === 'fertilizer' && (
                <div>
                    <p className="section-title">Fertilizer Reference</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {FERTILIZER_GUIDE.map((f, i) => (
                            <div key={i} className="card" style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: 16 }}>
                                <span style={{
                                    fontSize: '1.6rem', width: 44, height: 44, borderRadius: 12,
                                    background: `${f.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>{f.icon}</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: f.color, fontSize: '0.9rem', marginBottom: 4 }}>{f.name}</div>
                                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.use}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Market MSP Tab ── */}
            {activeTab === 'market' && (
                <div>
                    <p className="section-title">Minimum Support Price (MSP)</p>
                    <div className="card" style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: '#fbbf24', lineHeight: 1.5 }}>
                            ⚠️ MSP is the government's minimum guarantee price. Sell below MSP = report to local KVK or APMC.
                        </p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {MSP_DATA.map((item, i) => (
                            <div key={i} className="card" style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.88rem' }}>{item.crop}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.season}</div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 800, color: 'var(--accent-green)', fontSize: '1rem' }}>
                                        ₹{item.msp.toLocaleString('en-IN')}
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.unit}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="card mt-3" style={{ padding: '12px 16px' }}>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                            📞 <strong style={{ color: 'var(--text-secondary)' }}>Helplines:</strong> Kisan Call Centre: 1800-180-1551 · PM-Kisan: 155261 · KVK: Contact your district.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
