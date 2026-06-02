import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function FarmersList() {
    const { authFetch } = useAuth();
    const [farmers, setFarmers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [region, setRegion] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [toggling, setToggling] = useState(null);

    const fetchFarmers = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 15 });
            if (search) params.set('search', search);
            if (region) params.set('region', region);
            const res = await authFetch(`/api/admin/farmers?${params}`);
            const data = await res.json();
            setFarmers(data.farmers || []);
            setTotal(data.total || 0);
            setPages(data.pages || 1);
        } catch (err) {
            console.error('Error fetching farmers:', err);
            setFarmers([]);
        }
        setLoading(false);
    }, [page, search, region, authFetch]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) fetchFarmers();
        });
        return () => { active = false; };
    }, [fetchFarmers]);

    const handleSearch = (e) => { e.preventDefault(); setPage(1); fetchFarmers(); };

    const toggleActive = async (farmer) => {
        const fid = farmer._id || farmer.id;
        setToggling(fid);
        try {
            await authFetch(`/api/admin/farmers/${fid}`, {
                method: 'PUT',
                body: JSON.stringify({ isActive: !farmer.isActive }),
            });
            setFarmers(f => f.map(x => (x._id || x.id) === fid ? { ...x, isActive: !x.isActive } : x));
        } catch (err) {
            console.error('Error toggling farmer active status:', err);
        }
        setToggling(null);
    };

    const REGIONS = [
        { key: '', label: 'All Regions' },
        { key: 'upper_godavari', label: 'Upper Godavari' },
        { key: 'vidarbha', label: 'Vidarbha' },
        { key: 'malwa_plateau', label: 'Malwa Plateau' },
    ];

    return (
        <div className="admin-screen">
            <div className="admin-screen-header">
                <h2>👨‍🌾 Farmers</h2>
                <p>{total} registered farmers</p>
            </div>

            {/* Search & Filter */}
            <div className="admin-card mb-3">
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <input className="form-input" style={{ flex: 1, minWidth: 180 }} placeholder="🔍 Search by name or email..."
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                    <select className="form-select" style={{ width: 180 }} value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }}>
                        {REGIONS.map(r => <option key={r.key} value={r.key}>{r.label}</option>)}
                    </select>
                    <button className="btn btn-primary" type="submit" style={{ minHeight: 'auto', padding: '10px 20px' }}>Search</button>
                </form>
            </div>

            {loading ? (
                <div className="admin-loading"><div className="spinner" /><p>Loading farmers...</p></div>
            ) : farmers.length === 0 ? (
                <div className="admin-card text-center" style={{ padding: 40 }}>
                    <p style={{ fontSize: '2rem' }}>👨‍🌾</p>
                    <p style={{ color: 'var(--text-muted)' }}>No farmers found</p>
                </div>
            ) : (
                <div className="admin-table-wrapper">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Farmer</th>
                                <th>Email</th>
                                <th>Region</th>
                                <th>Joined</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {farmers.map((f) => (
                                <tr key={f._id || f.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div className="admin-avatar-sm">{f.name?.[0]?.toUpperCase()}</div>
                                            <span style={{ fontWeight: 600 }}>{f.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{f.email}</td>
                                    <td><span className="badge badge-blue">{f.region || '—'}</span></td>
                                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                                        {new Date(f.createdAt).toLocaleDateString('en-IN')}
                                    </td>
                                    <td>
                                        <span className={`badge ${f.isActive ? 'badge-green' : 'badge-red'}`}>
                                            {f.isActive ? '✅ Active' : '❌ Disabled'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className={`btn ${f.isActive ? 'btn-danger' : 'btn-secondary'}`}
                                            style={{ minHeight: 'auto', padding: '6px 14px', fontSize: '0.8rem' }}
                                            onClick={() => toggleActive(f)}
                                            disabled={toggling === (f._id || f.id)}>
                                            {toggling === (f._id || f.id) ? '...' : f.isActive ? 'Disable' : 'Enable'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {pages > 1 && (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16 }}>
                    <button className="btn btn-secondary" style={{ minHeight: 'auto', padding: '8px 16px' }}
                        onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
                    <span style={{ padding: '8px 16px', color: 'var(--text-muted)' }}>Page {page} of {pages}</span>
                    <button className="btn btn-secondary" style={{ minHeight: 'auto', padding: '8px 16px' }}
                        onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}>Next →</button>
                </div>
            )}
        </div>
    );
}
