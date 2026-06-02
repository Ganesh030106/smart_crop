import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';

const EMPTY_RULE = { region: 'upper_godavari', crop: 'paddy', category: 'crop', season: 'kharif', title: '', recommendation: '', pestName: '', isActive: true, isPrivate: false };
const REGIONS = ['upper_godavari', 'vidarbha', 'malwa_plateau'];
const CROPS = ['paddy', 'cotton', 'soybean', 'wheat', 'maize', 'groundnut', 'sugarcane'];
const CATEGORIES = ['crop', 'pest', 'fertilizer', 'market'];
const SEASONS = ['kharif', 'rabi', 'zaid', 'all'];

export default function AdvisoryEditor() {
    const { authFetch } = useAuth();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null); // null = list, 'new' = new form, id = edit form
    const [form, setForm] = useState(EMPTY_RULE);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState('');
    const [filter, setFilter] = useState({ region: '', crop: '', category: '' });

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

    const fetchRules = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter.region) params.set('region', filter.region);
            if (filter.crop) params.set('crop', filter.crop);
            if (filter.category) params.set('category', filter.category);
            const res = await authFetch(`/api/admin/advisories?${params}`);
            const data = await res.json();
            setRules(data.advisories || []);
        } catch (err) {
            console.error('Error fetching rules:', err);
            setRules([]);
        }
        setLoading(false);
    }, [filter, authFetch]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const openNew = () => { setForm(EMPTY_RULE); setEditing('new'); };
    const openEdit = (rule) => { setForm({ ...rule }); setEditing(rule._id || rule.id); };
    const cancelEdit = () => { setEditing(null); setForm(EMPTY_RULE); };

    const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.title || !form.recommendation) { showToast('⚠️ Title and recommendation are required'); return; }
        setSaving(true);
        try {
            const isNew = editing === 'new';
            const res = await authFetch(
                isNew ? '/api/admin/advisories' : `/api/admin/advisories/${editing}`,
                { method: isNew ? 'POST' : 'PUT', body: JSON.stringify(form) }
            );
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            showToast(isNew ? '✅ Advisory created!' : '✅ Advisory updated!');
            setEditing(null);
            fetchRules();
        } catch (err) { showToast(`❌ ${err.message}`); }
        setSaving(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this advisory rule?')) return;
        try {
            await authFetch(`/api/admin/advisories/${id}`, { method: 'DELETE' });
            showToast('🗑️ Deleted');
            fetchRules();
        } catch { showToast('❌ Delete failed'); }
    };

    const toggleActive = async (rule) => {
        const rid = rule._id || rule.id;
        try {
            await authFetch(`/api/admin/advisories/${rid}`, { method: 'PUT', body: JSON.stringify({ isActive: !rule.isActive }) });
            setRules(r => r.map(x => (x._id || x.id) === rid ? { ...x, isActive: !x.isActive } : x));
        } catch { showToast('❌ Failed to toggle'); }
    };

    if (editing) {
        return (
            <div className="admin-screen">
                {toast && <div className="admin-toast">{toast}</div>}
                <div className="admin-screen-header">
                    <button className="admin-back-btn" onClick={cancelEdit}>← Back</button>
                    <h2>{editing === 'new' ? '➕ New Advisory Rule' : '✏️ Edit Advisory Rule'}</h2>
                </div>
                <div className="admin-card">
                    <form onSubmit={handleSave}>
                        <div className="admin-form-grid">
                            <div className="form-group">
                                <label className="form-label">Region</label>
                                <select className="form-select" value={form.region} onChange={set('region')}>
                                    {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Crop</label>
                                <select className="form-select" value={form.crop} onChange={set('crop')}>
                                    {CROPS.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Category</label>
                                <select className="form-select" value={form.category} onChange={set('category')}>
                                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div className="form-group">
                                <label className="form-label">Season</label>
                                <select className="form-select" value={form.season} onChange={set('season')}>
                                    {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>

                        {form.category === 'pest' && (
                            <div className="form-group">
                                <label className="form-label">Pest Name (for matching)</label>
                                <input className="form-input" placeholder="e.g. stem_borer" value={form.pestName} onChange={set('pestName')} />
                            </div>
                        )}

                        <div className="form-group">
                            <label className="form-label">Advisory Title *</label>
                            <input className="form-input" placeholder="e.g. Paddy Sowing Advisory" value={form.title} onChange={set('title')} required />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Recommendation Text *</label>
                            <textarea className="form-textarea" rows={6} placeholder="Detailed advisory text for farmers..."
                                value={form.recommendation} onChange={set('recommendation')} required style={{ minHeight: 140 }} />
                        </div>

                        <div style={{ display: 'flex', gap: 24, marginBottom: 20 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.isActive} onChange={set('isActive')} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>✅ Active (visible to farmers)</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input type="checkbox" checked={form.isPrivate} onChange={set('isPrivate')} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>🔒 Private (admin only)</span>
                            </label>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-primary" type="submit" disabled={saving} style={{ flex: 1 }}>
                                {saving ? '⏳ Saving...' : '💾 Save Advisory'}
                            </button>
                            <button className="btn btn-secondary" type="button" onClick={cancelEdit}>Cancel</button>
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
                <div>
                    <h2>📋 Advisory Rules</h2>
                    <p>{rules.length} rules loaded</p>
                </div>
                <button className="btn btn-primary" onClick={openNew} style={{ minHeight: 'auto', padding: '10px 20px' }}>
                    ➕ New Rule
                </button>
            </div>

            {/* Filters */}
            <div className="admin-card mb-3">
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    {[
                        { key: 'region', opts: ['', ...REGIONS], label: 'All Regions' },
                        { key: 'crop', opts: ['', ...CROPS], label: 'All Crops' },
                        { key: 'category', opts: ['', ...CATEGORIES], label: 'All Categories' },
                    ].map(({ key, opts, label }) => (
                        <select key={key} className="form-select" style={{ flex: 1, minWidth: 140 }}
                            value={filter[key]} onChange={(e) => setFilter(f => ({ ...f, [key]: e.target.value }))}>
                            <option value="">{label}</option>
                            {opts.filter(Boolean).map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="admin-loading"><div className="spinner" /><p>Loading rules...</p></div>
            ) : rules.length === 0 ? (
                <div className="admin-card text-center" style={{ padding: 40 }}>
                    <p style={{ fontSize: '2rem' }}>📋</p>
                    <p style={{ color: 'var(--text-muted)' }}>No advisory rules found. Click "New Rule" to create one.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rules.map((rule) => (
                        <div key={rule._id || rule.id} className="admin-card" style={{ borderLeft: `4px solid ${rule.isActive ? 'var(--accent-green)' : 'var(--text-dim)'}` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{rule.title}</div>
                                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                                        <span className="badge badge-blue">{rule.region}</span>
                                        <span className="badge badge-green">{rule.crop}</span>
                                        <span className="badge badge-amber">{rule.category}</span>
                                        <span className="badge badge-blue">{rule.season}</span>
                                        {!rule.isActive && <span className="badge badge-red">Inactive</span>}
                                        {rule.isPrivate && <span className="badge badge-red">🔒 Private</span>}
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                                        {rule.recommendation.slice(0, 120)}{rule.recommendation.length > 120 ? '...' : ''}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <button className="btn btn-secondary" style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => toggleActive(rule)}>
                                        {rule.isActive ? '⏸ Pause' : '▶ Enable'}
                                    </button>
                                    <button className="btn btn-secondary" style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => openEdit(rule)}>✏️ Edit</button>
                                    <button className="btn btn-danger" style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                                        onClick={() => handleDelete(rule._id || rule.id)}>🗑️</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
