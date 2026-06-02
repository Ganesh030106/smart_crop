import React, { useState } from 'react';
import { getSmartRecommendation } from '../engine/smartRecommendationEngine';

const SOIL_TYPES = [
    { value: 'black', label: 'Black Soil (Kali/Regur)' },
    { value: 'red', label: 'Red Soil (Lal Mitti)' },
    { value: 'alluvial', label: 'Alluvial Soil (Jaloor)' },
    { value: 'loamy', label: 'Loamy Soil (Domat)' },
    { value: 'clay', label: 'Clay Soil (Chini Mitti)' },
    { value: 'sandy', label: 'Sandy Soil (Retili)' },
];

const WATER_SOURCES = [
    { value: 'irrigated', label: '💧 Irrigated (Tube well/Canal)' },
    { value: 'rainfed', label: '🌧️ Rainfed (Monsoon depend)' },
];

export default function SmartPlanScreen() {
    const [step, setStep] = useState(1); // 1=Input, 2=Result
    const [form, setForm] = useState({ landSize: '', soilType: '', waterSource: '' });
    const [results, setResults] = useState([]);

    const handleNext = () => {
        if (!form.landSize || !form.soilType || !form.waterSource) return;
        const recs = getSmartRecommendation(form);
        setResults(recs);
        setStep(2);
    };

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

    // Helper: Format currency
    const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

    if (step === 1) {
        return (
            <div className="admin-screen-content">
                <div className="admin-screen-header">
                    <div>
                        <h2>🌱 Smart Planning Plan</h2>
                        <p>Get AI-based crop recommendations optimized for profit & yield.</p>
                    </div>
                </div>

                <div className="card">
                    <h3 className="text-lg font-bold mb-4">Tell us about your land</h3>

                    <div className="form-group mb-4">
                        <label className="form-label">Acres of Land</label>
                        <input type="number" className="form-input" placeholder="e.g. 2.5" value={form.landSize} onChange={set('landSize')} />
                    </div>

                    <div className="form-group mb-4">
                        <label className="form-label">Soil Type</label>
                        <select className="form-select" value={form.soilType} onChange={set('soilType')}>
                            <option value="">Select Soil Type</option>
                            {SOIL_TYPES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                        </select>
                    </div>

                    <div className="form-group mb-6">
                        <label className="form-label">Water Source</label>
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            {WATER_SOURCES.map(w => (
                                <button
                                    key={w.value}
                                    className={`btn ${form.waterSource === w.value ? 'btn-primary' : 'btn-secondary'}`}
                                    onClick={() => setForm(f => ({ ...f, waterSource: w.value }))}
                                >
                                    {w.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full" onClick={handleNext} disabled={!form.landSize || !form.soilType || !form.waterSource}>
                        🚀 Generate Plan
                    </button>
                </div>

                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200 text-sm text-green-800" style={{ background: 'rgba(74, 222, 128, 0.05)', color: 'var(--accent-green)', borderColor: 'rgba(74, 222, 128, 0.2)' }}>
                    <p><strong>Did you know?</strong> Selecting the right crop based on soil type can increase yield by up to 30% without extra fertilizer.</p>
                </div>
            </div>
        );
    }

    // Result Screen
    const topPick = results[0];
    const others = results.slice(1, 3);

    if (!topPick) {
        return (
            <div className="admin-screen-content">
                <div className="admin-screen-header">
                    <button className="admin-back-btn" onClick={() => setStep(1)}>← Back</button>
                    <h2>No Recommendations Found</h2>
                </div>
                <div className="card text-center py-8">
                    <p>Try different inputs to get recommendations.</p>
                    <button className="btn btn-secondary mt-4" onClick={() => setStep(1)}>Try Again</button>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-screen-content">
            <div className="admin-screen-header">
                <div>
                    <button className="admin-back-btn" onClick={() => setStep(1)}>← Back</button>
                    <h2>🏆 Best Crop for You</h2>
                    <p>Based on {form.landSize} acres, {form.soilType} soil</p>
                </div>
            </div>

            {/* Top Pick Card */}
            <div className="card highlight-card mb-6" style={{ background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.1), rgba(163, 230, 53, 0.05))', border: '1px solid var(--accent-green)' }}>
                <div className="flex justify-between items-start mb-2">
                    <span className="badge badge-green text-sm">Create Highest Profit</span>
                    <span className="text-2xl">🥇</span>
                </div>
                <h3 className="text-2xl font-bold text-green-900 mb-1" style={{ color: 'var(--accent-green)' }}>{topPick.name}</h3>
                <p className="text-green-700 text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{topPick.duration} duration</p>

                <div className="grid grid-cols-2 gap-4 mb-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="bg-white p-3 rounded-lg shadow-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div className="text-xs text-gray-500 uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Est. Net Profit</div>
                        <div className="text-lg font-bold text-green-700" style={{ color: 'var(--accent-green)' }}>{fmt(topPick.netProfit * form.landSize)}</div>
                        <div className="text-xs text-gray-400" style={{ color: 'var(--text-dim)' }}>for {form.landSize} acres</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                        <div className="text-xs text-gray-500 uppercase font-bold" style={{ color: 'var(--text-muted)' }}>Investment</div>
                        <div className="text-lg font-bold text-red-600" style={{ color: 'var(--accent-red)' }}>{fmt(topPick.costPerAcre * form.landSize)}</div>
                        <div className="text-xs text-gray-400" style={{ color: 'var(--text-dim)' }}>seed + fertilizer</div>
                    </div>
                </div>

                <div className="space-y-2">
                    {topPick.reasons.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-green-800" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ color: r.type === 'bad' ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{r.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <h3 className="text-lg font-bold mb-3 px-1">Other Good Options</h3>
            <div className="space-y-3">
                {others.map((crop, idx) => (
                    <div key={crop.name} className="card flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <div>
                            <div className="flex items-center gap-2 mb-1" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="text-lg">{idx === 0 ? '🥈' : '🥉'}</span>
                                <h4 className="font-bold">{crop.name}</h4>
                            </div>
                            <p className="text-sm text-gray-500">
                                Profit: <span className="text-green-600 font-bold" style={{ color: 'var(--accent-green)' }}>{fmt(crop.netProfit * form.landSize)}</span>
                            </p>
                        </div>
                        <div className="text-right">
                            <span className={`badge ${crop.score > 50 ? 'badge-green' : 'badge-amber'}`}>
                                {crop.score}% Match
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 text-center">
                <button className="btn btn-secondary" onClick={() => setStep(1)}>
                    🔄 Start Over
                </button>
            </div>
        </div>
    );
}

