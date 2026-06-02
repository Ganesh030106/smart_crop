import React, { useState, useRef } from 'react';
import { getSmartRecommendation } from '../engine/smartRecommendationEngine';
import { useAuth } from '../auth/AuthContext';

/* ─── Constants ─────────────────────────────────────────────── */
const SOIL_TYPES = [
    { value: 'black', label: '⬛ Black Soil (Kali / Regur)' },
    { value: 'red', label: '🟥 Red Soil (Lal Mitti)' },
    { value: 'alluvial', label: '🟤 Alluvial Soil (Jaloor)' },
    { value: 'loamy', label: '🟫 Loamy Soil (Domat)' },
    { value: 'clay', label: '🔵 Clay Soil (Chikni)' },
    { value: 'sandy', label: '🟡 Sandy Soil (Retili)' },
];
const WATER_SOURCES = [
    { value: 'irrigated', label: '💧 Irrigated' },
    { value: 'rainfed', label: '🌧️ Rainfed' },
];
const ORGANIC_OPTIONS = [
    { value: 'low', label: '🔴 Low', desc: '<1%' },
    { value: 'medium', label: '🟡 Medium', desc: '1–3%' },
    { value: 'high', label: '🟢 High', desc: '>3%' },
];
const SEASONS = [
    { value: 'kharif', label: '☀️ Kharif', sub: 'Jun–Nov' },
    { value: 'rabi', label: '❄️ Rabi', sub: 'Nov–Apr' },
    { value: 'zaid', label: '🌤️ Zaid', sub: 'Apr–Jun' },
];
const INDIAN_STATES = [
    'Andhra Pradesh', 'Bihar', 'Chhattisgarh', 'Gujarat', 'Haryana',
    'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
    'Maharashtra', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'Telangana', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];
const COMMON_CROPS_LIST = [
    { id: 'paddy', name: 'Paddy' },
    { id: 'wheat', name: 'Wheat' },
    { id: 'cotton', name: 'Cotton' },
    { id: 'soybean', name: 'Soybean' },
    { id: 'maize', name: 'Maize' },
    { id: 'sugarcane', name: 'Sugarcane' },
    { id: 'onion', name: 'Onion' },
    { id: 'tomato', name: 'Tomato' },
    { id: 'potato', name: 'Potato' },
    { id: 'mustard', name: 'Mustard' },
    { id: 'chickpea', name: 'Chickpea' },
    { id: 'groundnut', name: 'Groundnut' },
];

const RISK_COLORS = { low: 'badge-green', medium: 'badge-amber', high: 'badge-red' };

const fmt = (n) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0,
    }).format(n);

/* ─── Components ────────────────────────────────────────────── */

function StepDots({ current, total }) {
    return (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            {Array.from({ length: total }, (_, i) => (
                <div key={i} style={{
                    height: 6, flex: i + 1 === current ? 3 : 1,
                    borderRadius: 99,
                    background: i + 1 <= current
                        ? 'var(--accent-green)'
                        : 'var(--bg-secondary)',
                    transition: 'all 0.35s ease',
                }} />
            ))}
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                {current} / {total}
            </span>
        </div>
    );
}

function PillGroup({ options, value, onChange }) {
    return (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }} role="group">
            {options.map(opt => (
                <button key={opt.value} onClick={() => onChange(opt.value)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: 99,
                        border: '1.5px solid',
                        borderColor: value === opt.value ? 'var(--accent-green)' : 'var(--border-color)',
                        background: value === opt.value ? 'rgba(74,222,128,0.12)' : 'var(--bg-secondary)',
                        color: value === opt.value ? 'var(--accent-green)' : 'var(--text-secondary)',
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                    {opt.label}
                    {opt.sub && <span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.7 }}>({opt.sub})</span>}
                    {opt.desc && <span style={{ fontWeight: 400, fontSize: '0.75rem', opacity: 0.7 }}>{opt.desc}</span>}
                </button>
            ))}
        </div>
    );
}

function CircularScore({ score, size = 60 }) {
    const r = 24;
    const c = 2 * Math.PI * r;
    const offset = c - (score / 100) * c;
    const color = score > 75 ? 'var(--accent-green)' : score > 50 ? 'var(--accent-amber)' : 'var(--accent-red)';

    return (
        <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-secondary)" strokeWidth="5" />
                <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
                    strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease' }} />
            </svg>
            <div style={{ position: 'absolute', fontSize: '0.9rem', fontWeight: 700, color }}>{score}</div>
        </div>
    );
}

function StatBox({ label, value, sub, color }) {
    return (
        <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: 10,
            padding: '10px 8px',
            textAlign: 'center',
            flex: 1,
        }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '0.88rem', fontWeight: 700, color }}>{value}</div>
            {sub && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{sub}</div>}
        </div>
    );
}

function CropCard({ crop, rank }) {
    const [expanded, setExpanded] = useState(false);
    const isPrimary = rank === 0;

    return (
        <div className="card" style={{
            marginBottom: 16,
            background: isPrimary
                ? 'linear-gradient(135deg, rgba(74,222,128,0.08) 0%, rgba(163,230,53,0.04) 100%)'
                : 'var(--bg-card)',
            border: isPrimary ? '1.5px solid rgba(74,222,128,0.5)' : '1px solid var(--border-color)',
            animation: `fadeIn 0.4s ease ${rank * 0.1}s both`,
            overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}
                onClick={() => setExpanded(!expanded)}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ fontSize: '2.5rem', lineHeight: 1 }}>{crop.emoji || '🌱'}</div>
                    <div>
                        {isPrimary && (
                            <span style={{
                                display: 'inline-block',
                                background: 'rgba(74,222,128,0.15)',
                                color: 'var(--accent-green)',
                                fontSize: '0.65rem',
                                fontWeight: 700,
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                padding: '2px 8px',
                                borderRadius: 99,
                                marginBottom: 4,
                            }}>🏆 Best Pick</span>
                        )}
                        <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.2rem' }}>{crop.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {crop.duration} &middot; <span className={`badge ${RISK_COLORS[crop.risk]}`}>{crop.risk} Risk</span>
                        </p>
                    </div>
                </div>
                <CircularScore score={crop.score} />
            </div>

            {/* Badges Row */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                <div className="badge badge-blue">
                    💧 Eff: {crop.waterEfficiency === 'high' ? 'High' : crop.waterEfficiency === 'medium' ? 'Med' : 'Low'}
                </div>
                <div className={`badge ${crop.soilHealthBadge === 'Excellent' ? 'badge-green' :
                    crop.soilHealthBadge === 'Good' ? 'badge-amber' : 'badge-red'
                    }`}>
                    🌱 Soil Impact: {crop.soilHealthBadge}
                </div>
            </div>

            {/* Stats Grid */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                <StatBox
                    label="Prof/Acre"
                    value={fmt(crop.netProfit)} // Per acre profit
                    color="var(--accent-green)"
                />
                <StatBox
                    label="Yield/Acre"
                    value={`${crop.avgYieldPerAcre} qt`}
                    color="var(--accent-blue)"
                />
                <StatBox
                    label="Invst/Acre"
                    value={fmt(crop.costPerAcre)}
                    color="var(--accent-amber)"
                />
            </div>

            {/* Expandable Details */}
            {expanded && (
                <div style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-color)',
                    animation: 'slideDown 0.3s ease'
                }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase' }}>
                        Why this crop?
                    </h4>
                    <ul style={{ paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {crop.reasons.map((r, i) => (
                            <li key={i} style={{
                                fontSize: '0.85rem',
                                color: r.type === 'good' ? 'var(--text-secondary)' : r.type === 'bad' ? 'var(--accent-red)' : 'var(--accent-amber)',
                                display: 'flex', gap: 6
                            }}>
                                <span>{r.text}</span>
                            </li>
                        ))}
                    </ul>

                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '12px 0 8px', textTransform: 'uppercase' }}>
                        Growing Tips
                    </h4>
                    <div style={{ background: 'var(--bg-secondary)', padding: 10, borderRadius: 8 }}>
                        {crop.tips?.map((tip, i) => (
                            <div key={i} style={{ fontSize: '0.8rem', marginBottom: 4, display: 'flex', gap: 6 }}>
                                <span style={{ color: 'var(--accent-blue)' }}>•</span>
                                <span>{tip}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button
                onClick={() => setExpanded(!expanded)}
                style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    marginTop: 8,
                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4
                }}
            >
                {expanded ? 'Show Less ⬆' : 'View Details ⬇'}
            </button>
        </div>
    );
}

/* ─── Soil Upload Component ─────────────────────────────────── */
function SoilImageUpload({ image, setImage }) {
    const fileRef = useRef();

    const handleFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => setImage({ url: ev.target.result, name: file.name });
        reader.readAsDataURL(file);
    };

    return (
        <div>
            <div
                className="upload-zone"
                onClick={() => fileRef.current.click()}
                style={{ cursor: 'pointer', marginTop: 6 }}
            >
                {image ? (
                    <div style={{ textAlign: 'center' }}>
                        <img src={image.url} alt="Soil" style={{
                            width: '100%', maxHeight: 180, objectFit: 'cover',
                            borderRadius: 10, marginBottom: 8,
                        }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--accent-green)' }}>✅ {image.name}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tap to change</p>
                    </div>
                ) : (
                    <>
                        <div className="upload-icon">🌍</div>
                        <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                            Upload Soil / Field Image
                        </p>
                        <p style={{ fontSize: '0.8rem' }}>JPG, PNG – Max 10 MB</p>
                    </>
                )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
    );
}

/* ─── NPK Sliders ───────────────────────────────────────────── */
function NPKSlider({ label, value, color, onChange }) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: 4 }}>
                <span style={{ fontWeight: 600, color }}>{label}</span>
                <span style={{ fontWeight: 700 }}>{value}</span>
            </div>
            <input
                type="range" min="0" max="100" step="5" value={value}
                onChange={(e) => onChange(e.target.value)}
                style={{ width: '100%', accentColor: color, height: 4 }}
            />
        </div>
    );
}

/* ─── Main Component ────────────────────────────────────────── */
const DEFAULT_FORM = {
    // Step 1
    landSize: '', soilType: '', ph: '', organicMatter: '',
    n: 50, p: 40, k: 40, // NPK default medium
    ec: '', // Salinity
    // Step 2
    waterSource: '', season: '', rainfall: 700, tempMin: '', tempMax: '', region: '', imdNote: '',
    // Step 3
    budget: '', marketRateOverrides: {},
};

export default function PlanningScreen() {
    const { authFetch } = useAuth();
    const [step, setStep] = useState(1);
    const [form, setForm] = useState(DEFAULT_FORM);
    const [soilImage, setSoilImage] = useState(null);
    const [results, setResults] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);

    // For overrides
    const [selectedOverrideCrop, setSelectedOverrideCrop] = useState('');
    const [overridePrice, setOverridePrice] = useState('');

    const set = (k) => (v) => {
        const val = (typeof v === 'object' && v?.target) ? v.target.value : v;
        setForm(f => ({ ...f, [k]: val }));
    };

    // Validation
    const step1Valid = form.landSize && form.soilType;
    const step2Valid = form.waterSource && form.season;

    const handleAddOverride = () => {
        if (!selectedOverrideCrop || !overridePrice) return;
        setForm(f => ({
            ...f,
            marketRateOverrides: {
                ...f.marketRateOverrides,
                [selectedOverrideCrop]: overridePrice
            }
        }));
        setSelectedOverrideCrop('');
        setOverridePrice('');
    };

    const removeOverride = (key) => {
        const ne = { ...form.marketRateOverrides };
        delete ne[key];
        setForm(f => ({ ...f, marketRateOverrides: ne }));
    };

    const handleAnalyze = (skipOverrides = false) => {
        setAnalyzing(true);
        setTimeout(async () => {
            const inputs = {
                ...form,
                marketRateOverrides: skipOverrides ? {} : form.marketRateOverrides,
                npk: { n: form.n, p: form.p, k: form.k },
            };
            const recs = getSmartRecommendation(inputs);
            setResults(recs);
            setStep(4);
            setAnalyzing(false);

            // Save session to backend (fire-and-forget)
            try {
                await authFetch('/api/planning/analyze', {
                    method: 'POST',
                    body: JSON.stringify({
                        landSize: form.landSize,
                        soilType: form.soilType,
                        ph: form.ph,
                        organicMatter: form.organicMatter,
                        waterSource: form.waterSource,
                        season: form.season,
                        rainfall: form.rainfall,
                        tempMin: form.tempMin,
                        tempMax: form.tempMax,
                        region: form.region,
                        imdNote: form.imdNote,
                        topCrop: recs[0]?.name || '',
                    }),
                });
            } catch { /* offline or error — session not saved, that's ok */ }
        }, 1500);
    };

    const handleReset = () => { setStep(1); setForm(DEFAULT_FORM); setSoilImage(null); setResults([]); };

    return (
        <div className="screen">
            <div className="screen-header">
                {step > 1 && (
                    <button className="btn-icon" onClick={() => setStep(s => s - 1)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '1.2rem', cursor: 'pointer', marginRight: 8 }}>
                        ←
                    </button>
                )}
                <span style={{ fontSize: '1.4rem' }}>📅</span>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <h2>Smart Crop Planner</h2>
                        <span style={{
                            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
                            color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99,
                            fontWeight: 700, letterSpacing: '0.05em'
                        }}>AI POWERED 🤖</span>
                    </div>
                    <p style={{ fontSize: '0.78rem', margin: 0, color: 'var(--text-muted)' }}>
                        AI-driven recommendations (Step {step}/4)
                    </p>
                </div>
            </div>

            <StepDots current={step} total={4} />

            {/* ─── Step 1: Soil & Land ─── */}
            {step === 1 && (
                <div className="fade-in">
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 className="section-title" style={{ marginTop: 0 }}>Step 1: Land & Soil Health</h3>

                        <div className="form-group">
                            <label className="form-label">Land Size (Acres)</label>
                            <input className="form-input" type="number" min="0.1" step="0.5" placeholder="e.g. 2.5"
                                value={form.landSize} onChange={set('landSize')} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Soil Type</label>
                            <select className="form-select" value={form.soilType} onChange={set('soilType')}>
                                <option value="">Select soil type</option>
                                {SOIL_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                        </div>

                        <div className="divider" />

                        <label className="form-label" style={{ marginBottom: 12, display: 'block' }}>Nutrient Profile (N-P-K)</label>
                        <div style={{ background: 'var(--bg-secondary)', padding: 12, borderRadius: 12, marginBottom: 16 }}>
                            <NPKSlider label="Nitrogen (N)" value={form.n} color="#60a5fa" onChange={set('n')} />
                            <NPKSlider label="Phosphorus (P)" value={form.p} color="#f87171" onChange={set('p')} />
                            <NPKSlider label="Potassium (K)" value={form.k} color="#fbbf24" onChange={set('k')} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <div className="form-group">
                                <label className="form-label">pH Level</label>
                                <input className="form-input" type="number" min="1" max="14" step="0.1" placeholder="7.0"
                                    value={form.ph} onChange={set('ph')} />
                            </div>
                            <div className="form-group">
                                <label className="form-label">EC (dS/m)</label>
                                <input className="form-input" type="number" step="0.1" placeholder="Optional"
                                    value={form.ec} onChange={set('ec')} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Organic Matter</label>
                            <PillGroup options={ORGANIC_OPTIONS} value={form.organicMatter} onChange={set('organicMatter')} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Soil Photo</label>
                            <SoilImageUpload image={soilImage} setImage={setSoilImage} />
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full" disabled={!step1Valid} onClick={() => setStep(2)}>
                        Next: Water & Climate →
                    </button>
                </div>
            )}

            {/* ─── Step 2: Water & Climate ─── */}
            {step === 2 && (
                <div className="fade-in">
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 className="section-title" style={{ marginTop: 0 }}>Step 2: Water & Climate</h3>

                        <div className="form-group">
                            <label className="form-label">Water Source</label>
                            <PillGroup options={WATER_SOURCES} value={form.waterSource} onChange={set('waterSource')} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Season</label>
                            <PillGroup options={SEASONS} value={form.season} onChange={set('season')} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Annual Rainfall: <span style={{ color: 'var(--accent-blue)' }}>{form.rainfall} mm</span></label>
                            <input type="range" min="100" max="3000" step="50" value={form.rainfall} onChange={set('rainfall')}
                                style={{ width: '100%', accentColor: 'var(--accent-blue)', marginTop: 8 }} />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Temperature (°C)</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                <input className="form-input" type="number" placeholder="Min (Night)"
                                    value={form.tempMin} onChange={set('tempMin')} />
                                <input className="form-input" type="number" placeholder="Max (Day)"
                                    value={form.tempMax} onChange={set('tempMax')} />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">State / Region</label>
                            <select className="form-select" value={form.region} onChange={set('region')}>
                                <option value="">Select State</option>
                                {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">IMD Forecast Notes (Optional)</label>
                            <textarea className="form-textarea" placeholder="Paste weather forecast..."
                                value={form.imdNote} onChange={set('imdNote')} />
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full" disabled={!step2Valid} onClick={() => setStep(3)}>
                        Next: Market & Budget →
                    </button>
                </div>
            )}

            {/* ─── Step 3: Market & Economics ─── */}
            {step === 3 && (
                <div className="fade-in">
                    <div className="card" style={{ marginBottom: 16 }}>
                        <h3 className="section-title" style={{ marginTop: 0 }}>Step 3: Market & Economics</h3>

                        <div className="form-group">
                            <label className="form-label">Budget per Acre (₹)</label>
                            <input className="form-input" type="number" placeholder="Max investment limit"
                                value={form.budget} onChange={set('budget')} />
                        </div>

                        <div className="divider" />

                        <label className="form-label">Market Rate Overrides (Optional)</label>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>
                            If you know the current mandi price for specific crops, add them here to refine profit calculation.
                        </p>

                        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                            <select className="form-select" style={{ flex: 2 }}
                                value={selectedOverrideCrop} onChange={(e) => setSelectedOverrideCrop(e.target.value)}>
                                <option value="">Select Crop</option>
                                {COMMON_CROPS_LIST.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className="form-input" style={{ flex: 1.5 }} type="number" placeholder="₹/Qtl"
                                value={overridePrice} onChange={(e) => setOverridePrice(e.target.value)} />
                            <button className="btn btn-secondary" style={{ width: 40, padding: 0 }} onClick={handleAddOverride}>
                                +
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {Object.entries(form.marketRateOverrides).map(([key, val]) => (
                                <div key={key} style={{
                                    background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: 8,
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem'
                                }}>
                                    <span>{COMMON_CROPS_LIST.find(c => c.id === key)?.name || key}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--accent-green)' }}>₹{val}</span>
                                        <button onClick={() => removeOverride(key)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}>✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full" disabled={analyzing} onClick={() => handleAnalyze(false)}>
                        {analyzing ? (
                            <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, marginRight: 8 }} /> Analyzing...</>
                        ) : '🚀 Analyze & Recommend'}
                    </button>
                    <button className="btn btn-secondary btn-full" style={{ marginTop: 12 }} onClick={() => handleAnalyze(true)}>
                        Skip Market Data & Analyze
                    </button>
                </div>
            )}

            {/* ─── Step 4: Results ─── */}
            {step === 4 && (
                <div className="fade-in">
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <h2 style={{ color: 'var(--accent-green)', fontSize: '1.8rem', marginBottom: 4 }}>Top 5 Recommendations</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            Based on {form.soilType} soil, {form.season} season & market trends
                        </p>
                    </div>

                    {results.length > 0 ? (
                        <>
                            {results.map((crop, index) => (
                                <CropCard key={crop.id} crop={crop} rank={index} />
                            ))}

                            <div style={{
                                marginTop: 20, padding: '12px 16px',
                                background: 'rgba(96,165,250,0.06)',
                                border: '1px solid rgba(96,165,250,0.2)',
                                borderRadius: 12, fontSize: '0.78rem',
                                color: 'var(--accent-blue)',
                            }}>
                                ℹ️ <b>Disclaimer:</b> Predictions are based on historical data and standard agricultural models.
                                Actual yields may vary due to weather anomalies and pest attacks. Consult a local expert.
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 10 }}>😕</div>
                            <h3>No suitable crops found</h3>
                            <p>Try adjusting your constraints (e.g. water source or season).</p>
                        </div>
                    )}

                    <button className="btn btn-secondary btn-full" onClick={handleReset} style={{ marginTop: 24, marginBottom: 16 }}>
                        🔄 Plan New Crop
                    </button>
                </div>
            )}
        </div>
    );
}
