import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { useAuth } from '../auth/AuthContext';
import { getPendingSyncItems, clearSyncQueue } from '../db/indexedDB';

const LANGUAGES = [
    { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇬🇧' },
    { code: 'hi', label: 'Hindi', nativeLabel: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்', flag: '🇮🇳' },
];

const REGIONS = [
    { key: 'upper_godavari', name: 'Upper Godavari', state: 'Telangana/AP' },
    { key: 'north_konkan', name: 'North Konkan', state: 'Maharashtra' },
    { key: 'madhya_plateau', name: 'Madhya Plateau', state: 'MP/Chhattisgarh' },
];

export default function ProfileScreen({ isOnline }) {
    const { language, changeLanguage, t } = useLanguage();
    const { authFetch } = useAuth();
    const [region, setRegion] = useState(localStorage.getItem('farmer_region_key') || '');
    const [consent, setConsent] = useState(localStorage.getItem('consent') === 'true');
    const [gpsCoords, setGpsCoords] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState('');
    const [syncStatus, setSyncStatus] = useState('idle');
    const [pendingCount, setPendingCount] = useState(0);
    const [toast, setToast] = useState('');

    useEffect(() => {
        loadPendingCount();
        const saved = localStorage.getItem('gps_coords');
        if (saved) { try { setGpsCoords(JSON.parse(saved)); } catch (e) { console.error('Invalid GPS coords in localStorage:', e); } }
    }, []);

    const loadPendingCount = async () => {
        const items = await getPendingSyncItems();
        setPendingCount(items.length);
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    };

    const handleLanguageChange = (code) => {
        changeLanguage(code); // This updates context + localStorage + html lang
        showToast('✅ Language updated!');
    };

    const handleRegionChange = (key) => {
        setRegion(key);
        localStorage.setItem('farmer_region_key', key);
        const r = REGIONS.find((r) => r.key === key);
        if (r) localStorage.setItem('farmer_region', JSON.stringify({ name: r.name }));
        showToast('✅ Region updated');
    };

    const detectGPS = () => {
        if (!navigator.geolocation) { setGpsError('GPS not supported'); return; }
        setGpsLoading(true);
        setGpsError('');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords = { lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy };
                setGpsCoords(coords);
                localStorage.setItem('gps_coords', JSON.stringify(coords));
                localStorage.setItem('farmer_region', JSON.stringify({
                    name: `${coords.lat.toFixed(4)}°N, ${coords.lon.toFixed(4)}°E`,
                    lat: coords.lat, lon: coords.lon,
                }));
                setGpsLoading(false);
                showToast('📍 Location detected!');
            },
            () => { setGpsError('Could not get location. Please allow GPS access.'); setGpsLoading(false); },
            { timeout: 10000, enableHighAccuracy: true }
        );
    };

    const handleSync = async () => {
        if (!isOnline) { showToast('📡 No internet connection'); return; }
        setSyncStatus('syncing');
        try {
            const items = await getPendingSyncItems();
            if (items.length === 0) { showToast('✅ Everything is synced!'); setSyncStatus('idle'); return; }

            // Separate logs and soil health items
            const logs = items.filter(i => i.type === 'log').map(i => i.data);
            const soilHealth = items.filter(i => i.type === 'soilHealth').map(i => i.data);

            const res = await authFetch('/api/sync', {
                method: 'POST',
                body: JSON.stringify({ logs, soilHealth }),
            });
            if (res.ok) {
                await clearSyncQueue();
                setPendingCount(0);
                setSyncStatus('done');
                showToast(`✅ Synced ${items.length} records!`);
            } else throw new Error('Server error');
        } catch {
            setSyncStatus('error');
            showToast('⚠️ Sync failed — data saved locally');
        }
        setTimeout(() => setSyncStatus('idle'), 3000);
    };

    return (
        <div className="screen">
            <div className="screen-header">
                <span className="header-icon">👤</span>
                <h2>{t('profile_title')}</h2>
            </div>

            {/* Language Selection */}
            <p className="section-title">{t('profile_language')}</p>
            <div className="card mb-3">
                {LANGUAGES.map((lang, i) => (
                    <div
                        key={lang.code}
                        className="toggle-row"
                        style={{
                            cursor: 'pointer',
                            borderBottom: i < LANGUAGES.length - 1 ? '1px solid var(--border-color)' : 'none',
                            background: language === lang.code ? 'rgba(74, 222, 128, 0.06)' : 'transparent',
                            borderRadius: language === lang.code ? 'var(--radius-sm)' : 0,
                            padding: '14px 8px',
                        }}
                        onClick={() => handleLanguageChange(lang.code)}
                    >
                        <div className="flex items-center gap-3">
                            <span style={{ fontSize: '1.5rem' }}>{lang.flag}</span>
                            <div>
                                <div className="toggle-label">{lang.nativeLabel}</div>
                                <div className="toggle-sub">{lang.label}</div>
                            </div>
                        </div>
                        <div style={{
                            width: 22, height: 22, borderRadius: '50%',
                            border: `2px solid ${language === lang.code ? 'var(--accent-green)' : 'var(--border-color)'}`,
                            background: language === lang.code ? 'var(--accent-green)' : 'transparent',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}>
                            {language === lang.code && <span style={{ color: '#0f1f17', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* Region Selection */}
            <p className="section-title">{t('profile_region')}</p>
            <div className="form-group">
                <select className="form-select" value={region} onChange={(e) => handleRegionChange(e.target.value)}>
                    <option value="">Select your region...</option>
                    {REGIONS.map((r) => (
                        <option key={r.key} value={r.key}>{r.name} — {r.state}</option>
                    ))}
                </select>
            </div>

            {/* GPS Detection */}
            <p className="section-title">{t('profile_gps')}</p>
            <div className="card mb-3">
                {gpsCoords ? (
                    <div>
                        <div className="stat-row">
                            <span className="stat-label">Latitude</span>
                            <span className="stat-value">{gpsCoords.lat.toFixed(6)}°N</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Longitude</span>
                            <span className="stat-value">{gpsCoords.lon.toFixed(6)}°E</span>
                        </div>
                        <div className="stat-row">
                            <span className="stat-label">Accuracy</span>
                            <span className="stat-value">±{Math.round(gpsCoords.accuracy)}m</span>
                        </div>
                    </div>
                ) : (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
                        📍 {t('profile_gps_not_detected')}
                    </p>
                )}
                {gpsError && <p style={{ color: 'var(--accent-red)', fontSize: '0.82rem', marginBottom: 8 }}>{gpsError}</p>}
                <button className="btn btn-secondary btn-full mt-2" onClick={detectGPS} disabled={gpsLoading}>
                    {gpsLoading ? `⏳ ${t('profile_detecting')}` : `📍 ${t('profile_detect')}`}
                </button>
            </div>

            {/* Data Sync */}
            <p className="section-title">{t('profile_sync')}</p>
            <div className="card mb-3">
                <div className="stat-row">
                    <span className="stat-label">{t('profile_pending')}</span>
                    <span className={`badge ${pendingCount > 0 ? 'badge-amber' : 'badge-green'}`}>
                        {pendingCount} unsynced
                    </span>
                </div>
                <div className="stat-row">
                    <span className="stat-label">{t('profile_connection')}</span>
                    <span className={`badge ${isOnline ? 'badge-green' : 'badge-red'}`}>
                        {isOnline ? `🟢 ${t('profile_online')}` : `🔴 ${t('profile_offline')}`}
                    </span>
                </div>
                <button
                    className={`btn btn-full mt-3 ${syncStatus === 'syncing' ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={handleSync}
                    disabled={syncStatus === 'syncing' || !isOnline}
                >
                    {syncStatus === 'syncing' ? `⏳ ${t('profile_syncing')}` :
                        syncStatus === 'done' ? `✅ ${t('profile_synced')}` :
                            syncStatus === 'error' ? `❌ ${t('profile_retry')}` :
                                `🔄 ${t('profile_sync_now')}`}
                </button>
            </div>

            {/* Consent */}
            <p className="section-title">{t('profile_consent')}</p>
            <div className="card mb-3">
                <div className="toggle-row" style={{ border: 'none', padding: 0 }}>
                    <div>
                        <div className="toggle-label">{t('profile_consent_label')}</div>
                        <div className="toggle-sub">{t('profile_consent_sub')}</div>
                    </div>
                    <label className="toggle">
                        <input type="checkbox" checked={consent}
                            onChange={(e) => { setConsent(e.target.checked); localStorage.setItem('consent', e.target.checked.toString()); }} />
                        <span className="toggle-slider" />
                    </label>
                </div>
            </div>

            {/* App Info */}
            <div className="card" style={{ textAlign: 'center', padding: '16px' }}>
                <p style={{ fontSize: '1.5rem', marginBottom: 4 }}>🌾</p>
                <p style={{ fontWeight: 700, color: 'var(--text-primary)' }}>Smart Crop Advisor</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>v2.0.0 · SDG-15 · Build2Gether</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 4 }}>
                    Advisory: KVK · ICAR · IMD · APMC
                </p>
            </div>

            {toast && <div className="toast">{toast}</div>}
        </div>
    );
}
