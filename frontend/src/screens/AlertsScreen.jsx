import React, { useState, useEffect, useCallback } from 'react';
import { cacheAlerts, getCachedAlerts } from '../db/indexedDB';
import { useAuth } from '../auth/AuthContext';

const SAMPLE_ALERTS = [
    {
        id: 'w1',
        type: 'weather',
        title: 'Heavy Rainfall Warning',
        message: 'IMD predicts 80-100mm rainfall in Upper Godavari region over next 48 hours. Avoid field operations. Ensure proper drainage.',
        region: 'Upper Godavari',
        severity: 'high',
        date: new Date(Date.now() - 2 * 3600000).toISOString(),
    },
    {
        id: 'p1',
        type: 'pest',
        title: 'Fall Armyworm Alert',
        message: 'Fall armyworm outbreak reported in Madhya Plateau maize fields. Scout fields immediately. Apply Spinetoram 11.7SC if >1 egg mass/plant.',
        region: 'Madhya Plateau',
        severity: 'high',
        date: new Date(Date.now() - 5 * 3600000).toISOString(),
    },
    {
        id: 'm1',
        type: 'market',
        title: 'Soybean Price Rise',
        message: 'Soybean prices at APMC Indore: ₹4,850/quintal (+₹250 from last week). Good time to sell. MSP: ₹4,600/quintal.',
        region: 'Madhya Plateau',
        severity: 'medium',
        date: new Date(Date.now() - 8 * 3600000).toISOString(),
    },
    {
        id: 'w2',
        type: 'weather',
        title: 'Dry Spell Advisory',
        message: 'No significant rainfall expected in North Konkan for 10 days. Irrigate paddy at critical stages. Mulch to conserve moisture.',
        region: 'North Konkan',
        severity: 'medium',
        date: new Date(Date.now() - 12 * 3600000).toISOString(),
    },
    {
        id: 'p2',
        type: 'pest',
        title: 'Brown Plant Hopper',
        message: 'BPH populations building up in Upper Godavari paddy fields. Apply Imidacloprid 17.8SL @ 0.5 ml/L. Drain field for 3 days.',
        region: 'Upper Godavari',
        severity: 'medium',
        date: new Date(Date.now() - 24 * 3600000).toISOString(),
    },
    {
        id: 'm2',
        type: 'market',
        title: 'Paddy MSP Procurement',
        message: 'FCI paddy procurement starts Oct 1. Register at nearest PACS. Ensure moisture <14%. MSP: ₹2,183/quintal.',
        region: 'All Regions',
        severity: 'low',
        date: new Date(Date.now() - 48 * 3600000).toISOString(),
    },
];

const ALERT_ICONS = { weather: '🌦️', pest: '🐛', market: '📊' };
const ALERT_LABELS = { weather: 'Weather', pest: 'Pest', market: 'Market' };
const SEVERITY_BADGE = { high: 'badge-red', medium: 'badge-amber', low: 'badge-green' };

export default function AlertsScreen({ isOnline }) {
    const { authFetch } = useAuth();
    const [alerts, setAlerts] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [now] = useState(() => Date.now());

    const loadAlerts = useCallback(async () => {
        setLoading(true);
        if (isOnline) {
            try {
                const res = await authFetch('/api/alerts/public');
                if (res.ok) {
                    const data = await res.json();
                    const backendAlerts = (data.alerts || []).map(a => ({
                        id: a.id,
                        type: a.type,
                        title: a.title,
                        message: a.message,
                        region: a.region || 'All Regions',
                        severity: a.severity,
                        date: a.createdAt || a.date || new Date().toISOString(),
                    }));
                    if (backendAlerts.length > 0) {
                        await cacheAlerts(backendAlerts);
                        setAlerts(backendAlerts);
                        setLoading(false);
                        return;
                    }
                }
            } catch (err) {
                console.error('Failed to fetch alerts:', err);
            }
            // Fallback to sample if backend returned empty or failed
            await cacheAlerts(SAMPLE_ALERTS);
            setAlerts(SAMPLE_ALERTS);
        } else {
            const cached = await getCachedAlerts();
            setAlerts(cached.length > 0 ? cached : SAMPLE_ALERTS);
        }
        setLoading(false);
    }, [isOnline, authFetch]);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) loadAlerts();
        });
        return () => { active = false; };
    }, [loadAlerts]);

    const filtered = filter === 'all' ? alerts : alerts.filter((a) => a.type === filter);

    const timeAgo = (dateStr) => {
        const diff = now - new Date(dateStr).getTime();
        const h = Math.floor(diff / 3600000);
        if (h < 1) return 'Just now';
        if (h < 24) return `${h}h ago`;
        return `${Math.floor(h / 24)}d ago`;
    };

    return (
        <div className="screen">
            <div className="screen-header">
                <span className="header-icon">🔔</span>
                <h2>Alerts</h2>
                <span className={`badge ${isOnline ? 'badge-green' : 'badge-amber'}`} style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                    {isOnline ? '🟢 Live' : '📦 Cached'}
                </span>
            </div>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {['all', 'weather', 'pest', 'market'].map((f) => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f === 'all' ? '📋 All' : `${ALERT_ICONS[f]} ${ALERT_LABELS[f]}`}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="loading-container">
                    <div className="spinner" />
                    <p>Loading alerts...</p>
                </div>
            ) : (
                <>
                    <p className="section-title">{filtered.length} Alert{filtered.length !== 1 ? 's' : ''}</p>
                    {filtered.map((alert) => (
                        <div key={alert.id} className={`alert-card ${alert.type}`}>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span style={{ fontSize: '1.2rem' }}>{ALERT_ICONS[alert.type]}</span>
                                    <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
                                        {ALERT_LABELS[alert.type]}
                                    </span>
                                </div>
                                <div className="flex gap-2 items-center">
                                    <span className={`badge ${SEVERITY_BADGE[alert.severity]}`} style={{ fontSize: '0.7rem' }}>
                                        {alert.severity.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{timeAgo(alert.date)}</span>
                                </div>
                            </div>
                            <h4 style={{ marginBottom: 6, color: 'var(--text-primary)' }}>{alert.title}</h4>
                            <p style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                                {alert.message}
                            </p>
                            <div className="mt-2">
                                <span className="badge badge-green" style={{ fontSize: '0.7rem' }}>📍 {alert.region}</span>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}
