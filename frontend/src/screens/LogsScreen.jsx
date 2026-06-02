import React, { useState, useEffect, useCallback } from 'react';
import { saveFarmLog, getAllLogs, markLogSynced } from '../db/indexedDB';
import { useAuth } from '../auth/AuthContext';

export default function LogsScreen({ isOnline }) {
    const { authFetch } = useAuth();
    const [urea, setUrea] = useState('');
    const [notes, setNotes] = useState('');
    const [cropPhoto, setCropPhoto] = useState(null);
    const [receipt, setReceipt] = useState(null);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [logs, setLogs] = useState([]);
    const [activeTab, setActiveTab] = useState('add');

    const loadLogs = useCallback(async () => {
        // Try backend first when online
        if (isOnline) {
            try {
                const res = await authFetch('/api/logs');
                if (res.ok) {
                    const data = await res.json();
                    setLogs(data);
                    return;
                }
            } catch (err) {
                console.error('Failed to load logs from backend:', err);
            }
        }
        // Fallback to IndexedDB
        const all = await getAllLogs();
        setLogs(all.reverse());
    }, [isOnline, authFetch]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) loadLogs();
        });
        return () => { active = false; };
    }, [loadLogs]);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleSave = async () => {
        if (!urea && !cropPhoto && !receipt) {
            showToast('⚠️ Please enter at least one field');
            return;
        }
        setSaving(true);
        try {
            const logEntry = {
                urea: urea ? parseFloat(urea) : null,
                notes,
                hasCropPhoto: !!cropPhoto,
                hasReceipt: !!receipt,
                cropPhotoName: cropPhoto?.name || null,
                receiptName: receipt?.name || null,
                week: `Week ${getWeekNumber()}`,
            };

            // Save to IndexedDB first (offline-first)
            const localId = await saveFarmLog(logEntry);

            // If online and not demo, also save to backend
            if (isOnline) {
                try {
                    const res = await authFetch('/api/logs', {
                        method: 'POST',
                        body: JSON.stringify({
                            crop: logEntry.week,
                            urea_kg: logEntry.urea,
                            notes: logEntry.notes,
                            date: new Date().toISOString(),
                        }),
                    });
                    if (res.ok) {
                        await markLogSynced(localId);
                        showToast('✅ Log saved & synced!');
                    } else {
                        showToast('✅ Log saved offline (sync pending)');
                    }
                } catch {
                    showToast('✅ Log saved offline (sync pending)');
                }
            } else {
                showToast('✅ Log saved offline!');
            }

            setUrea('');
            setNotes('');
            setCropPhoto(null);
            setReceipt(null);
            loadLogs();
        } catch (err) {
            console.error('Error saving log:', err);
            showToast('❌ Error saving log');
        }
        setSaving(false);
    };

    const getWeekNumber = () => {
        const d = new Date();
        const startOfYear = new Date(d.getFullYear(), 0, 1);
        return Math.ceil(((d - startOfYear) / 86400000 + startOfYear.getDay() + 1) / 7);
    };

    return (
        <div className="screen">
            <div className="screen-header">
                <span className="header-icon">📋</span>
                <h2>Farm Logs</h2>
                <span className={`badge ${isOnline ? 'badge-green' : 'badge-amber'}`} style={{ marginLeft: 'auto' }}>
                    {isOnline ? '🟢 Online' : '🟡 Offline'}
                </span>
            </div>

            {/* Tab Switcher */}
            <div className="tab-switcher">
                <button
                    className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`}
                    onClick={() => setActiveTab('add')}
                >
                    ➕ Add Log
                </button>
                <button
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                >
                    📜 History ({logs.length})
                </button>
            </div>

            {activeTab === 'add' && (
                <>
                    <p className="section-title">Weekly Farm Record</p>

                    <div className="form-group">
                        <label className="form-label">Urea Applied (kg/acre)</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="e.g. 25"
                            value={urea}
                            onChange={(e) => setUrea(e.target.value)}
                            min="0"
                            max="200"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Notes / Observations</label>
                        <textarea
                            className="form-textarea"
                            placeholder="Describe crop condition, weather, any issues..."
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Crop Photo Upload */}
                    <div className="form-group">
                        <label className="form-label">Crop Photo</label>
                        <div
                            className="upload-zone"
                            onClick={() => document.getElementById('crop-photo-input').click()}
                            style={{ padding: '20px' }}
                        >
                            {cropPhoto ? (
                                <p style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                                    📷 {cropPhoto.name}
                                </p>
                            ) : (
                                <>
                                    <div className="upload-icon" style={{ fontSize: '1.8rem' }}>🌿</div>
                                    <p>Tap to add crop photo</p>
                                </>
                            )}
                        </div>
                        <input
                            id="crop-photo-input"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => setCropPhoto(e.target.files[0])}
                        />
                    </div>

                    {/* Receipt Upload */}
                    <div className="form-group">
                        <label className="form-label">Purchase Receipt</label>
                        <div
                            className="upload-zone"
                            onClick={() => document.getElementById('receipt-input').click()}
                            style={{ padding: '20px' }}
                        >
                            {receipt ? (
                                <p style={{ color: 'var(--accent-green)', fontWeight: 600 }}>
                                    🧾 {receipt.name}
                                </p>
                            ) : (
                                <>
                                    <div className="upload-icon" style={{ fontSize: '1.8rem' }}>🧾</div>
                                    <p>Tap to add receipt image</p>
                                </>
                            )}
                        </div>
                        <input
                            id="receipt-input"
                            type="file"
                            accept="image/*,application/pdf"
                            style={{ display: 'none' }}
                            onChange={(e) => setReceipt(e.target.files[0])}
                        />
                    </div>

                    <button
                        className="btn btn-primary btn-full mt-3"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? '💾 Saving...' : '💾 Save Log Offline'}
                    </button>

                    <div className="card mt-3" style={{ padding: '12px' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📱 Logs are saved on your device and will sync to the server when online.
                        </p>
                    </div>
                </>
            )}

            {activeTab === 'history' && (
                <>
                    <p className="section-title">Saved Logs</p>
                    {logs.length === 0 ? (
                        <div className="card text-center" style={{ padding: '32px' }}>
                            <p style={{ fontSize: '2rem', marginBottom: 8 }}>📋</p>
                            <p>No logs yet. Add your first farm log!</p>
                        </div>
                    ) : (
                        logs.map((log) => (
                            <div key={log.id} className="card mb-3">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="badge badge-green">{log.week || log.crop || 'Log'}</span>
                                    <span className={`badge ${log.synced ? 'badge-green' : 'badge-amber'}`}>
                                        {log.synced ? '✅ Synced' : '⏳ Pending'}
                                    </span>
                                </div>
                                {(log.urea || log.urea_kg) && (
                                    <div className="stat-row">
                                        <span className="stat-label">Urea Applied</span>
                                        <span className="stat-value">{log.urea ?? log.urea_kg} kg/acre</span>
                                    </div>
                                )}
                                {log.notes && (
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                                        {log.notes}
                                    </p>
                                )}
                                <div className="flex gap-2 mt-2" style={{ flexWrap: 'wrap' }}>
                                    {log.hasCropPhoto && <span className="badge badge-blue">📷 Photo</span>}
                                    {log.hasReceipt && <span className="badge badge-blue">🧾 Receipt</span>}
                                </div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 8 }}>
                                    {new Date(log.timestamp || log.date || log.createdAt).toLocaleString('en-IN')}
                                </p>
                            </div>
                        ))
                    )}
                </>
            )}

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
