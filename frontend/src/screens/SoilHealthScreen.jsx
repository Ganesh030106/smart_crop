import React, { useState, useEffect, useCallback } from 'react';
import { saveSoilHealth, getAllSoilHealth } from '../db/indexedDB';
import { useAuth } from '../auth/AuthContext';

export default function SoilHealthScreen({ isOnline }) {
    const { authFetch } = useAuth();
    const [residue, setResidue] = useState(false);
    const [manure, setManure] = useState('');
    const [compost, setCompost] = useState('');
    const [soilPH, setSoilPH] = useState('');
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [records, setRecords] = useState([]);

    const loadRecords = useCallback(async () => {
        // Try backend first when online
        if (isOnline) {
            try {
                const res = await authFetch('/api/soil-health');
                if (res.ok) {
                    const data = await res.json();
                    setRecords(data);
                    return;
                }
            } catch (err) {
                console.error('Failed to load soil health from backend:', err);
            }
        }
        const all = await getAllSoilHealth();
        setRecords(all.reverse());
    }, [isOnline, authFetch]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) loadRecords();
        });
        return () => { active = false; };
    }, [loadRecords]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const entry = {
                residueIncorporated: residue,
                manureKgPerAcre: manure ? parseFloat(manure) : null,
                compostKgPerAcre: compost ? parseFloat(compost) : null,
                soilPH: soilPH ? parseFloat(soilPH) : null,
                notes,
            };

            // Save to IndexedDB first (offline-first)
            await saveSoilHealth(entry);

            // If online and not demo, also save to backend
            if (isOnline) {
                try {
                    const score = getSoilHealthScore(entry);
                    const res = await authFetch('/api/soil-health', {
                        method: 'POST',
                        body: JSON.stringify({
                            residue_burned: !residue,
                            manure_kg: entry.manureKgPerAcre,
                            compost_kg: entry.compostKgPerAcre,
                            ph: entry.soilPH,
                            health_score: score,
                            date: new Date().toISOString(),
                        }),
                    });
                    if (res.ok) {
                        showToast('✅ Soil record saved & synced!');
                    } else {
                        showToast('✅ Soil record saved offline (sync pending)');
                    }
                } catch {
                    showToast('✅ Soil record saved offline (sync pending)');
                }
            } else {
                showToast('✅ Soil health record saved!');
            }

            setResidue(false);
            setManure('');
            setCompost('');
            setSoilPH('');
            setNotes('');
            loadRecords();
        } catch {
            showToast('❌ Error saving record');
        }
        setSaving(false);
    };

    const getSoilHealthScore = (record) => {
        let score = 0;
        if (record.residueIncorporated || !record.residue_burned) score += 30;
        if ((record.manureKgPerAcre || record.manure_kg) > 0) score += 35;
        if ((record.compostKgPerAcre || record.compost_kg) > 0) score += 35;
        return record.health_score || score;
    };

    return (
        <div className="screen">
            <div className="screen-header">
                <span className="header-icon">🌍</span>
                <h2>Soil Health</h2>
            </div>

            <p className="section-title">Log Soil Practices</p>

            {/* Residue Toggle */}
            <div className="card mb-3">
                <div className="toggle-row" style={{ border: 'none', padding: 0 }}>
                    <div>
                        <div className="toggle-label">Residue Incorporation</div>
                        <div className="toggle-sub">Did you incorporate crop residue this week?</div>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={residue} onChange={(e) => setResidue(e.target.checked)} />
                        <span className="toggle-slider" />
                    </label>
                </div>
                {residue && (
                    <div className="result-box mt-3" style={{ padding: '12px' }}>
                        <p style={{ fontSize: '0.82rem', color: 'var(--accent-green)' }}>
                            🌱 Great! Residue incorporation adds 15-20 kg N/ha equivalent and improves soil organic carbon.
                        </p>
                    </div>
                )}
            </div>

            <div className="form-group">
                <label className="form-label">Manure Applied (kg/acre)</label>
                <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 500"
                    value={manure}
                    onChange={(e) => setManure(e.target.value)}
                    min="0"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Compost Applied (kg/acre)</label>
                <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 200"
                    value={compost}
                    onChange={(e) => setCompost(e.target.value)}
                    min="0"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Soil pH (if tested)</label>
                <input
                    className="form-input"
                    type="number"
                    placeholder="e.g. 6.5"
                    value={soilPH}
                    onChange={(e) => setSoilPH(e.target.value)}
                    min="0"
                    max="14"
                    step="0.1"
                />
            </div>

            <div className="form-group">
                <label className="form-label">Observations</label>
                <textarea
                    className="form-textarea"
                    placeholder="Soil color, texture, waterlogging issues..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                />
            </div>

            <button
                className="btn btn-primary btn-full"
                onClick={handleSave}
                disabled={saving}
            >
                {saving ? '💾 Saving...' : '💾 Save Soil Record'}
            </button>

            {/* Recent Records */}
            {records.length > 0 && (
                <>
                    <p className="section-title">Recent Records</p>
                    {records.slice(0, 3).map((rec) => {
                        const score = getSoilHealthScore(rec);
                        return (
                            <div key={rec.id} className="card mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        {new Date(rec.timestamp || rec.date || rec.createdAt).toLocaleDateString('en-IN')}
                                    </span>
                                    <span className={`badge ${score >= 60 ? 'badge-green' : score >= 30 ? 'badge-amber' : 'badge-red'}`}>
                                        Health Score: {score}%
                                    </span>
                                </div>
                                <div className="progress-bar mb-2">
                                    <div className="progress-fill" style={{ width: `${score}%` }} />
                                </div>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {(rec.residueIncorporated || !rec.residue_burned) && <span className="badge badge-green">✅ Residue</span>}
                                    {(rec.manureKgPerAcre || rec.manure_kg) > 0 && <span className="badge badge-blue">🐄 {rec.manureKgPerAcre ?? rec.manure_kg} kg manure</span>}
                                    {(rec.compostKgPerAcre || rec.compost_kg) > 0 && <span className="badge badge-blue">🌿 {rec.compostKgPerAcre ?? rec.compost_kg} kg compost</span>}
                                    {(rec.soilPH || rec.ph) && <span className="badge badge-amber">pH {rec.soilPH ?? rec.ph}</span>}
                                </div>
                            </div>
                        );
                    })}
                </>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
