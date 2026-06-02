import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';

const EMPTY_ALERT = { region: 'all', type: 'weather', severity: 'medium', title: '', message: '', isActive: true };

export default function AlertsEditor() {
    const { authFetch } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY_ALERT);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchAlerts = useCallback(async () => {
        setLoading(true);
        try {
            const res = await authFetch('/api/admin/alerts');
            const data = await res.json();
            setAlerts(data.alerts || []);
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setAlerts([]);
        }
        setLoading(false);
    }, [authFetch]);

    useEffect(() => {
        fetchAlerts();
    }, [fetchAlerts]);

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title || !form.message) { showToast('⚠️ Title and message are required'); return; }
        setSaving(true);
        try {
            const isNew = editing === 'new';
            const res = await authFetch(
                isNew ? '/api/admin/alerts' : `/api/admin/alerts/${editing}`,
                { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(form) }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showToast(isNew ? '✅ Alert created!' : '✅ Alert updated!');
            setEditing(null);
            fetchAlerts();
        } catch (err) { showToast(`❌ ${err.message}`); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this alert?')) return;
        try {
            await authFetch(`/api/admin/alerts/${id}`, { method: 'DELETE' });
            showToast('🗑️ Deleted');
            fetchAlerts();
        } catch (err) {
            console.error('Error deleting alert:', err);
            showToast('❌ Delete failed');
        }
    };

    const TYPE_COLORS = { weather: '#60a5fa', pest: '#f87171', market: '#fbbf24' };
    const SEV_BADGE = { high: 'badge-red', medium: 'badge-amber', low: 'badge-green' };

    if (editing) {
        return (
            <div className="admin-screen">
                {toast && <div className="admin-toast">{toast}</div>}
                <div className="admin-screen-header">
                    <button className="admin-back-btn" onClick={() => setEditing(null)}>← Back</button>
                    <h2>{editing === 'new' ? '➕ New Alert' : '✏️ Edit Alert'}</h2>
                </div>
                <div className="admin-card">
                    <form onSubmit={handleSave}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Type</label>
                                <select className="form-select" value={form.type} onChange={set('type')}>
                                    <option value="weather">🌧️ Weather</option>
                                    <option value="pest">🐛 Pest</option>
                                    <option value="market">📈 Market</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Severity</label>
                                <select className="form-select" value={form.severity} onChange={set('severity')}>
                                    <option value="high">🔴 High</option>
                                    <option value="medium">🟡 Medium</option>
                                    <option value="low">🟢 Low</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Region</label>
                                <select className="form-select" value={form.region} onChange={set('region')}>
                                    <option value="all">All Regions</option>
                                    <option value="upper_godavari">Upper Godavari</option>
                                    <option value="vidarbha">Vidarbha</option>
                                    <option value="malwa_plateau">Malwa Plateau</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Alert Title *</label>
                            <input className="form-input" placeholder="e.g. Heavy Rain Alert" value={form.title} onChange={set('title')} required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Alert Message *</label>
                            <textarea className="form-textarea" rows={5} placeholder="Detailed alert message for farmers..."
                                value={form.message} onChange={set('message')} required />
                        </div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
                            <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>✅ Active (visible to farmers)</span>
                        </label>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                                {saving ? '⏳ Saving...' : '💾 Save Alert'}
                            </button>
                            <button className="btn btn-secondary" type="button" onClick={() => setEditing(null)}>Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-screen">
            {toast && <div className="admin-toast">{toast}</div>}
            <div className="admin-screen-header">
                <div><h2>🔔 Alerts Manager</h2><p>{alerts.length} alerts</p></div>
                <button className="btn btn-primary" onClick={() => { setForm(EMPTY_ALERT); setEditing('new'); }}
                    style={{ minHeight: 'auto', padding: '10px 20px' }}>➕ New Alert</button>
            </div>

            {loading ? (
                <div className="admin-loading"><div className="spinner" /><p>Loading alerts...</p></div>
            ) : alerts.length === 0 ? (
                <div className="admin-card text-center" style={{ padding: 40 }}>
                    <p style={{ fontSize: '2rem' }}>🔔</p>
                    <p style={{ color: 'var(--text-muted)' }}>No alerts. Click "New Alert" to create one.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {alerts.map((alert) => (
                        <div key={alert._id || alert.id} className="admin-card" style={{ borderLeft: `4px solid ${TYPE_COLORS[alert.type]}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{alert.title}</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                        <span className={`badge ${SEV_BADGE[alert.severity]}`}>{alert.severity}</span>
                                        <span className="badge badge-blue">{alert.type}</span>
                                        <span className="badge badge-blue">{alert.region}</span>
                                        {!alert.isActive && <span className="badge badge-red">Inactive</span>}
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                                        {alert.message.slice(0, 100)}{alert.message.length > 100 ? '...' : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button className="btn btn-secondary" style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => { setForm({ ...alert }); setEditing(alert._id || alert.id); }}>✏️ Edit</button>
                                    <button className="btn btn-danger" style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => handleDelete(alert._id || alert.id)}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
