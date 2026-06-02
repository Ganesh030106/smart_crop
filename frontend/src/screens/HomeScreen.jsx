import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const QUICK_ACTIONS = [
    { icon: '🌾', labelKey: 'qa_crop_guide', tab: 'advisory', color: '#4ade80' },
    { icon: '🐛', labelKey: 'qa_pest_disease', tab: 'advisory', color: '#f87171' },
    { icon: '🧪', labelKey: 'qa_fertilizer', tab: 'advisory', color: '#60a5fa' },
    { icon: '📈', labelKey: 'qa_market_msp', tab: 'advisory', color: '#fbbf24' },
    { icon: '🔬', labelKey: 'nav_soil', tab: 'soil_ai', color: '#a78bfa' },
];

const TIPS = {
    en: [
        'Apply urea in split doses — 50% at sowing, 50% at tillering for better uptake.',
        'Intercrop with legumes to fix nitrogen and improve soil health naturally.',
        'Use pheromone traps to monitor stem borer populations in paddy fields.',
        'Conserve rainwater with contour bunds to reduce runoff on sloped lands.',
        'Apply neem-based pesticides in the evening to protect beneficial insects.',
    ],
    hi: [
        'यूरिया को विभाजित खुराक में लगाएं — 50% बुवाई पर, 50% कल्ले निकलते समय।',
        'नाइट्रोजन स्थिरीकरण के लिए दलहन के साथ अंतरफसल करें।',
        'धान के खेतों में तना छेदक की निगरानी के लिए फेरोमोन ट्रैप का उपयोग करें।',
        'ढलान वाली भूमि पर बहाव कम करने के लिए समोच्च बंड से वर्षा जल संरक्षित करें।',
        'लाभकारी कीटों की रक्षा के लिए शाम को नीम आधारित कीटनाशक लगाएं।',
    ],
    ta: [
        'யூரியாவை பிரித்து இடுங்கள் — 50% விதைப்பில், 50% தூர் விடும் போது.',
        'நைட்ரஜன் நிலைப்படுத்த பயிர்களுடன் இடைப்பயிர் செய்யுங்கள்.',
        'நெல் வயல்களில் தண்டு துளைப்பானை கண்காணிக்க ஃபெரோமோன் பொறிகளை பயன்படுத்துங்கள்.',
        'சரிவு நிலங்களில் மழைநீரை சேமிக்க சமவரை மேடுகள் அமையுங்கள்.',
        'நன்மை செய்யும் பூச்சிகளை பாதுகாக்க மாலையில் வேப்ப கீடநாசினி தெளியுங்கள்.',
    ],
};

export default function HomeScreen({ isOnline, setActiveTab }) {
    const { t, language } = useLanguage();
    
    const [region] = useState(() => {
        const saved = localStorage.getItem('farmer_region');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (err) {
                console.error('Error parsing region:', err);
            }
        }
        return null;
    });

    const [tip, setTip] = useState(() => {
        const tips = TIPS[language] || TIPS.en;
        return tips[Math.floor(Math.random() * tips.length)];
    });

    const isMounted = useRef(false);
    useEffect(() => {
        if (!isMounted.current) {
            isMounted.current = true;
            return;
        }
        const tips = TIPS[language] || TIPS.en;
        Promise.resolve().then(() => {
            setTip(tips[Math.floor(Math.random() * tips.length)]);
        });
    }, [language]);

    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(false);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? t('home_greeting_morning') : hour < 17 ? t('home_greeting_afternoon') : t('home_greeting_evening');

    const fetchWeatherData = useCallback(async () => {
        const coords = localStorage.getItem('gps_coords');
        let lat = 17.38, lon = 78.49; // Default: Hyderabad
        if (coords) {
            try {
                const c = JSON.parse(coords);
                lat = c.lat;
                lon = c.lon;
            } catch (err) {
                console.error('Error parsing GPS coordinates:', err);
            }
        }
        setWeatherLoading(true);
        try {
            const res = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,precipitation&timezone=Asia/Kolkata`
            );
            const data = await res.json();
            const c = data.current;
            setWeather({
                temp: Math.round(c.temperature_2m),
                humidity: c.relative_humidity_2m,
                wind: Math.round(c.wind_speed_10m),
                rain: c.precipitation,
                code: c.weather_code,
            });
        } catch (err) {
            console.error('Error fetching weather data:', err);
            setWeather(null);
        }
        setWeatherLoading(false);
    }, []);

    useEffect(() => {
        let active = true;
        Promise.resolve().then(() => {
            if (active) fetchWeatherData();
        });
        return () => { active = false; };
    }, [fetchWeatherData]);

    // Alias for retry button
    const fetchWeather = fetchWeatherData;

    const getWeatherIcon = (code) => {
        if (!code) return '🌤️';
        if (code === 0) return '☀️';
        if (code <= 3) return '⛅';
        if (code <= 67) return '🌧️';
        if (code <= 77) return '❄️';
        if (code <= 99) return '⛈️';
        return '🌤️';
    };

    const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

    const getSeason = () => {
        const month = new Date().getMonth() + 1;
        if (month >= 6 && month <= 9) return { name: 'Kharif (Monsoon)', icon: '🌧️', color: '#60a5fa' };
        if (month >= 10 && month <= 11) return { name: 'Rabi Sowing', icon: '🌾', color: '#fbbf24' };
        if (month >= 12 || month <= 3) return { name: 'Rabi (Winter)', icon: '❄️', color: '#c084fc' };
        return { name: 'Zaid (Summer)', icon: '☀️', color: '#f97316' };
    };

    const season = getSeason();

    return (
        <div className="screen home-screen">
            <div className="screen-header">
                <span className="header-icon">🌾</span>
                <div style={{ flex: 1 }}>
                    <h2 style={{ fontSize: '1rem' }}>Smart Crop Advisor</h2>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', margin: 0 }}>SDG-15 · Sustainable Farming</p>
                </div>
                <div className={`status-dot ${isOnline ? 'online' : 'offline'}`} title={isOnline ? 'Online' : 'Offline'} />
            </div>

            {/* Hero */}
            <div className="hero-card card">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 4 }}>{today}</p>
                <h1 style={{ fontSize: '1.5rem', marginBottom: 8 }}>{greeting}, {t('home_farmer')} 👋</h1>
                <div className="season-badge" style={{ background: `${season.color}20`, color: season.color }}>
                    <span>{season.icon}</span> {season.name}
                </div>
                {region && (
                    <div className="mt-2">
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            📍 {region.name || `${region.lat?.toFixed(3)}°N, ${region.lon?.toFixed(3)}°E`}
                        </span>
                    </div>
                )}
            </div>

            {/* Weather Widget */}
            <p className="section-title">{t('home_weather')}</p>
            <div className="card mb-3">
                {weatherLoading ? (
                    <div className="flex items-center gap-3">
                        <div className="spinner" style={{ width: 24, height: 24, borderWidth: 2 }} />
                        <p style={{ margin: 0 }}>{t('home_fetching_weather')}</p>
                    </div>
                ) : weather ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr', gap: 12, alignItems: 'center' }}>
                        <span style={{ fontSize: '2.5rem' }}>{getWeatherIcon(weather.code)}</span>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)' }}>{weather.temp}°C</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Temperature</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-blue)' }}>{weather.humidity}%</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>💧 Humidity</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-green)' }}>{weather.wind} km/h</div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>💨 Wind</div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <span style={{ fontSize: '1.5rem' }}>🌤️</span>
                        <div>
                            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                Weather unavailable. Set GPS in Profile for live weather.
                            </p>
                            <button className="btn btn-secondary mt-2" style={{ padding: '6px 14px', minHeight: 'auto', fontSize: '0.8rem' }}
                                onClick={fetchWeather}>
                                🔄 Retry
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── 📅 Crop Planning CTA — prominent button ── */}
            {/* ── 📅 Crop Planning CTA — Major Feature ── */}
            <div style={{ marginBottom: 24, padding: '0 4px' }}>
                <button
                    onClick={() => setActiveTab('planning')}
                    style={{
                        width: '100%',
                        background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                        border: '2px solid rgba(255,255,255,0.1)',
                        borderRadius: 24,
                        padding: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        boxShadow: '0 8px 32px rgba(16, 185, 129, 0.25)',
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s ease',
                    }}
                >
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
                        background: 'rgba(255,255,255,0.2)'
                    }} />

                    <span style={{ fontSize: '3rem', marginBottom: 12, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}>�</span>

                    <h2 style={{
                        color: '#fff', fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px',
                        textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }}>
                        Start Smart Crop Planning
                    </h2>

                    <p style={{
                        color: 'rgba(255,255,255,0.9)', fontSize: '0.9rem', margin: '0 0 16px', lineHeight: 1.5,
                        maxWidth: '90%'
                    }}>
                        Use our <b>AI/ML Model</b> to analyze Soil, Water, IMD Weather & Market Rates for the best yield & profit.
                    </p>

                    <div style={{
                        display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center',
                        marginBottom: 16
                    }}>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>🌱 Soil Health</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>💧 Water</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>☁️ Weather</span>
                        <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>💰 Profit</span>
                    </div>

                    <div style={{
                        background: '#fff', color: '#059669', padding: '10px 24px', borderRadius: 99,
                        fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8
                    }}>
                        Plan Now <span style={{ fontSize: '1.1rem' }}>→</span>
                    </div>
                </button>
            </div>

            {/* Quick Actions */}
            <p className="section-title">{t('home_quick_actions')}</p>
            <div className="category-grid">
                {QUICK_ACTIONS.map((action) => (
                    <button key={action.labelKey} className="category-btn" onClick={() => setActiveTab(action.tab)}
                        style={{ '--cat-color': action.color }}>
                        <span className="cat-icon">{action.icon}</span>
                        <span className="cat-label">{t(action.labelKey)}</span>
                    </button>
                ))}
            </div>

            {/* Daily Tip */}
            <p className="section-title">{t('home_todays_tip')}</p>
            <div className="card tip-card">
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '1.5rem', flexShrink: 0 }}>💡</span>
                    <p style={{ color: 'var(--text-primary)', lineHeight: 1.6, fontSize: '0.9rem' }}>{tip}</p>
                </div>
            </div>

            {/* SDG Badge */}
            <div className="card mt-3" style={{ textAlign: 'center', padding: '14px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                    🌍 {t('home_sdg_badge')}
                </p>
            </div>
        </div>
    );
}
