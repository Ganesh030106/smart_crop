import React, { useEffect, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';

export default function AdminHome() {
    const { authFetch } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        authFetch('/api/admin/stats')
            .then(r => r.json())
            .then(d => setStats(d))
            .catch(() => setStats({ totalFarmers: 0, totalAdvisories: 0, totalAlerts: 0 }))
            .finally(() => setLoading(false));
    }, [authFetch]);

    const STAT_CARDS = stats ? [
        { icon: '👨‍🌾', label: 'Total Farmers', value: stats.totalFarmers, color: '#4ade80' },
        { icon: '📋', label: 'Advisory Rules', value: stats.totalAdvisories, color: '#60a5fa' },
        { icon: '🔔', label: 'Active Alerts', value: stats.totalAlerts, color: '#fbbf24' },
    ] : [];

    return (
        <div className="admin-screen">
            <div className="admin-screen-header">
                <h2>📊 Admin Dashboard</h2>
                <p>Smart Crop Advisor — Control Panel</p>
            </div>

            {loading ? (
                <div className="admin-loading"><div className="spinner" /><p>Loading stats...</p></div>
            ) : (
                <>
                    <div className="admin-stats-grid">
                        {STAT_CARDS.map((s) => (
                            <div key={s.label} className="admin-stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
                                <span className="admin-stat-icon">{s.icon}</span>
                                <div className="admin-stat-value" style={{ color: s.color }}>{s.value}</div>
                                <div className="admin-stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    <div className="admin-card mt-4">
                        <h3>🚀 Quick Actions</h3>
                        <div className="admin-quick-actions">
                            {[
                                { icon: '📋', label: 'Edit Advisory Rules', desc: 'Update crop recommendations, pest treatments, fertilizer schedules' },
                                { icon: '👨‍🌾', label: 'View Farmers', desc: 'Search, filter, and manage farmer accounts' },
                                { icon: '🔔', label: 'Manage Alerts', desc: 'Create and update weather, pest, and market alerts' },
                            ].map((a) => (
                                <div key={a.label} className="admin-quick-action-card">
                                    <span style={{ fontSize: '1.8rem' }}>{a.icon}</span>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{a.label}</div>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{a.desc}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="admin-card mt-3" style={{ background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                            🌍 <strong style={{ color: 'var(--accent-green)' }}>SDG-15 Mission:</strong> Supporting sustainable land management for rainfed smallholder farmers across India. Build2Gether · v2.0.0
                        </p>
                    </div>
                </>
            )}
        </div>
    );
}
