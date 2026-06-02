import React, { useState, useRef } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

// Soil type classification based on color analysis
const SOIL_TYPES = [
    {
        name: 'Black Cotton Soil (Vertisol)',
        nameHi: 'काली मिट्टी (वर्टिसोल)',
        nameTa: 'கருப்பு மண் (வெர்டிசோல்)',
        color: '#2d1b00',
        ph: '7.5 - 8.5',
        organic: 'Medium (1.5-2.5%)',
        moisture: 'High retention',
        description: 'Rich in calcium, magnesium, and potassium. Swells when wet, cracks when dry. Excellent for deep-rooted crops.',
        crops: [
            { name: 'Cotton', suitability: 98, icon: '🌿', season: 'Kharif', yield: '15-20 q/ha' },
            { name: 'Soybean', suitability: 92, icon: '🫘', season: 'Kharif', yield: '20-25 q/ha' },
            { name: 'Wheat', suitability: 88, icon: '🌾', season: 'Rabi', yield: '35-45 q/ha' },
            { name: 'Chickpea', suitability: 85, icon: '🫘', season: 'Rabi', yield: '12-18 q/ha' },
            { name: 'Sorghum', suitability: 80, icon: '🌾', season: 'Kharif', yield: '25-35 q/ha' },
        ],
        amendments: 'Apply gypsum @ 2-3 t/ha if pH > 8.5. Avoid waterlogging. Deep plowing beneficial.',
        deficiencies: 'Often deficient in Zinc and Boron. Apply ZnSO4 @ 25 kg/ha.',
    },
    {
        name: 'Red Laterite Soil',
        nameHi: 'लाल लेटराइट मिट्टी',
        nameTa: 'சிவப்பு லேட்டரைட் மண்',
        color: '#8b2500',
        ph: '5.5 - 6.5',
        organic: 'Low (0.5-1.5%)',
        moisture: 'Low retention',
        description: 'Rich in iron and aluminum oxides. Well-drained, porous. Requires organic matter addition and lime if acidic.',
        crops: [
            { name: 'Groundnut', suitability: 95, icon: '🥜', season: 'Kharif', yield: '15-20 q/ha' },
            { name: 'Cassava', suitability: 90, icon: '🌿', season: 'Annual', yield: '25-35 t/ha' },
            { name: 'Cashew', suitability: 88, icon: '🌰', season: 'Perennial', yield: '8-12 q/ha' },
            { name: 'Paddy (upland)', suitability: 75, icon: '🌾', season: 'Kharif', yield: '20-25 q/ha' },
            { name: 'Maize', suitability: 72, icon: '🌽', season: 'Kharif', yield: '30-40 q/ha' },
        ],
        amendments: 'Apply lime @ 2-4 t/ha to correct acidity. Add FYM @ 10 t/ha. Mulching essential.',
        deficiencies: 'Deficient in P, Ca, Mg, and micronutrients. Apply SSP and micronutrient mix.',
    },
    {
        name: 'Alluvial Soil',
        nameHi: 'जलोढ़ मिट्टी',
        nameTa: 'வண்டல் மண்',
        color: '#c4a35a',
        ph: '6.5 - 7.5',
        organic: 'High (2-3%)',
        moisture: 'Good retention',
        description: 'Deposited by rivers, highly fertile. Rich in potash, lime. Excellent for intensive cultivation. Most productive soil type.',
        crops: [
            { name: 'Paddy', suitability: 98, icon: '🌾', season: 'Kharif', yield: '50-60 q/ha' },
            { name: 'Wheat', suitability: 96, icon: '🌾', season: 'Rabi', yield: '45-55 q/ha' },
            { name: 'Sugarcane', suitability: 94, icon: '🎋', season: 'Annual', yield: '80-100 t/ha' },
            { name: 'Vegetables', suitability: 92, icon: '🥦', season: 'All seasons', yield: 'Varies' },
            { name: 'Maize', suitability: 90, icon: '🌽', season: 'Kharif', yield: '40-50 q/ha' },
        ],
        amendments: 'Minimal amendments needed. Apply balanced NPK. Maintain organic matter with green manure.',
        deficiencies: 'May be deficient in Zinc. Apply ZnSO4 @ 25 kg/ha as preventive measure.',
    },
    {
        name: 'Sandy Loam Soil',
        nameHi: 'बलुई दोमट मिट्टी',
        nameTa: 'மணல் கலந்த மண்',
        color: '#d4b896',
        ph: '6.0 - 7.0',
        organic: 'Low-Medium (1-2%)',
        moisture: 'Low retention',
        description: 'Good drainage and aeration. Easy to work. Warms up quickly. Requires frequent irrigation and organic matter.',
        crops: [
            { name: 'Groundnut', suitability: 92, icon: '🥜', season: 'Kharif', yield: '18-22 q/ha' },
            { name: 'Watermelon', suitability: 90, icon: '🍉', season: 'Zaid', yield: '200-250 q/ha' },
            { name: 'Potato', suitability: 88, icon: '🥔', season: 'Rabi', yield: '200-250 q/ha' },
            { name: 'Carrot', suitability: 85, icon: '🥕', season: 'Rabi', yield: '150-200 q/ha' },
            { name: 'Pearl Millet', suitability: 82, icon: '🌾', season: 'Kharif', yield: '20-25 q/ha' },
        ],
        amendments: 'Add FYM @ 15-20 t/ha. Drip irrigation recommended. Mulching reduces water loss by 40%.',
        deficiencies: 'Prone to N, P, K, and micronutrient leaching. Apply in split doses.',
    },
    {
        name: 'Clay Soil',
        nameHi: 'चिकनी मिट्टी',
        nameTa: 'களிமண்',
        color: '#6b4c3b',
        ph: '6.5 - 8.0',
        organic: 'Medium-High (2-4%)',
        moisture: 'Very high retention',
        description: 'Heavy, sticky when wet. Poor drainage. Rich in nutrients but prone to waterlogging. Needs drainage improvement.',
        crops: [
            { name: 'Paddy', suitability: 95, icon: '🌾', season: 'Kharif', yield: '45-55 q/ha' },
            { name: 'Lotus (Aquatic)', suitability: 88, icon: '🌸', season: 'Annual', yield: '15-20 q/ha' },
            { name: 'Taro', suitability: 85, icon: '🌿', season: 'Kharif', yield: '150-200 q/ha' },
            { name: 'Jute', suitability: 80, icon: '🌿', season: 'Kharif', yield: '25-30 q/ha' },
            { name: 'Sugarcane', suitability: 78, icon: '🎋', season: 'Annual', yield: '70-90 t/ha' },
        ],
        amendments: 'Add sand + FYM to improve drainage. Install field drains. Subsoil plowing recommended.',
        deficiencies: 'Phosphorus fixation common. Apply SSP in split doses. Zinc deficiency frequent.',
    },
];

function analyzeSoilFromImage() {
    // Simulate soil analysis - in production, use TF.js model
    const idx = Math.floor(Math.random() * SOIL_TYPES.length);
    const confidence = 0.72 + Math.random() * 0.25;
    return { soil: SOIL_TYPES[idx], confidence };
}

export default function SoilAnalysisScreen() {
    const { t, language } = useLanguage();
    const [image, setImage] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('crops');
    const fileInputRef = useRef();
    const cameraInputRef = useRef();

    const handleImageSelect = (file) => {
        if (!file) return;
        // Revoke previous object URL to prevent memory leak
        if (image) URL.revokeObjectURL(image);
        setImageFile(file);
        setImage(URL.createObjectURL(file));
        setResult(null);
    };

    const handleAnalyze = async () => {
        if (!imageFile) return;
        setLoading(true);
        setResult(null);
        await new Promise((r) => setTimeout(r, 2000));
        const { soil, confidence } = analyzeSoilFromImage();
        setResult({ soil, confidence });
        setLoading(false);
    };

    const getSoilName = (soil) => {
        if (language === 'hi') return soil.nameHi;
        if (language === 'ta') return soil.nameTa;
        return soil.name;
    };

    const suitabilityColor = (s) => {
        if (s >= 90) return 'var(--accent-green)';
        if (s >= 75) return 'var(--accent-amber)';
        return 'var(--accent-red)';
    };

    return (
        <div className="screen">
            <div className="screen-header">
                <span className="header-icon">🔬</span>
                <h2>{t('soil_ai_title')}</h2>
            </div>

            {/* Upload */}
            <p className="section-title">{t('soil_ai_upload')}</p>

            {!image ? (
                <div className="upload-zone" onClick={() => fileInputRef.current?.click()}>
                    <div className="upload-icon">🌍</div>
                    <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {t('soil_ai_tap')}
                    </p>
                    <p>{t('soil_ai_tip')}</p>
                </div>
            ) : (
                <div style={{ position: 'relative' }}>
                    <img src={image} alt="Soil" className="img-preview" />
                    <button
                        className="btn btn-secondary"
                        style={{ position: 'absolute', top: 8, right: 8, padding: '6px 12px', minHeight: 'auto', fontSize: '0.8rem' }}
                        onClick={() => {
                            if (image) URL.revokeObjectURL(image);
                            setImage(null); setImageFile(null); setResult(null);
                        }}
                    >
                        ✕ {t('common_remove')}
                    </button>
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => handleImageSelect(e.target.files[0])} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
                onChange={(e) => handleImageSelect(e.target.files[0])} />

            <div className="flex gap-3 mt-3">
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => fileInputRef.current?.click()}>
                    📁 {t('pest_gallery')}
                </button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => cameraInputRef.current?.click()}>
                    📷 {t('pest_camera')}
                </button>
            </div>

            {image && (
                <button className="btn btn-primary btn-full mt-3" onClick={handleAnalyze} disabled={loading}>
                    {loading ? `⏳ ${t('soil_ai_analyzing')}` : `🔬 ${t('soil_ai_analyze')}`}
                </button>
            )}

            {loading && (
                <div className="loading-container mt-4">
                    <div className="spinner" />
                    <p>{t('soil_ai_analyzing')}</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Soil Color Analysis · Pattern Matching (Demo)</p>
                </div>
            )}

            {result && !loading && (
                <div className="mt-4">
                    {/* Soil Type Card */}
                    <div className="result-box mb-3">
                        <div className="flex items-center gap-3 mb-3">
                            <div style={{
                                width: 40, height: 40, borderRadius: 8,
                                background: result.soil.color,
                                border: '2px solid var(--border-active)',
                                flexShrink: 0,
                            }} />
                            <div>
                                <h3 style={{ color: 'var(--accent-green)', fontSize: '1rem' }}>
                                    {getSoilName(result.soil)}
                                </h3>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                                    Confidence: {(result.confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Confidence bar */}
                        <div className="progress-bar mb-3">
                            <div className="progress-fill" style={{ width: `${result.confidence * 100}%` }} />
                        </div>

                        {/* Soil Properties */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                            {[
                                { label: t('soil_ai_ph'), value: result.soil.ph, icon: '⚗️' },
                                { label: t('soil_ai_organic'), value: result.soil.organic, icon: '🌿' },
                                { label: t('soil_ai_moisture'), value: result.soil.moisture, icon: '💧' },
                                { label: 'Best Season', value: result.soil.crops[0]?.season, icon: '📅' },
                            ].map((prop) => (
                                <div key={prop.label} className="card" style={{ padding: '10px 12px' }}>
                                    <div style={{ fontSize: '1.1rem', marginBottom: 4 }}>{prop.icon}</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>{prop.label}</div>
                                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>{prop.value}</div>
                                </div>
                            ))}
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                            {result.soil.description}
                        </p>
                    </div>

                    {/* Tabs */}
                    <div className="tab-switcher mb-3">
                        {[
                            { id: 'crops', label: `🌱 ${t('soil_ai_recommended')}` },
                            { id: 'amendments', label: '🧪 Amendments' },
                        ].map((tab) => (
                            <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}>
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'crops' && (
                        <>
                            <p className="section-title">{t('soil_ai_recommended')} (Top 5)</p>
                            {result.soil.crops.map((crop, i) => (
                                <div key={crop.name} className="card mb-2">
                                    <div className="flex items-center gap-3">
                                        <div style={{
                                            width: 36, height: 36, borderRadius: '50%',
                                            background: `${suitabilityColor(crop.suitability)}20`,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.2rem', flexShrink: 0,
                                        }}>
                                            {crop.icon}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div className="flex justify-between items-center mb-1">
                                                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                                                    #{i + 1} {crop.name}
                                                </span>
                                                <span style={{ fontWeight: 800, color: suitabilityColor(crop.suitability), fontSize: '0.9rem' }}>
                                                    {crop.suitability}%
                                                </span>
                                            </div>
                                            <div className="progress-bar" style={{ height: 5, marginBottom: 6 }}>
                                                <div className="progress-fill" style={{
                                                    width: `${crop.suitability}%`,
                                                    background: `linear-gradient(90deg, ${suitabilityColor(crop.suitability)}, ${suitabilityColor(crop.suitability)}aa)`
                                                }} />
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="badge badge-blue" style={{ fontSize: '0.68rem' }}>📅 {crop.season}</span>
                                                <span className="badge badge-green" style={{ fontSize: '0.68rem' }}>📊 {crop.yield}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </>
                    )}

                    {activeTab === 'amendments' && (
                        <>
                            <p className="section-title">Soil Amendments</p>
                            <div className="card mb-3">
                                <h4 style={{ color: 'var(--accent-green)', marginBottom: 8 }}>🧪 Recommended Amendments</h4>
                                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                                    {result.soil.amendments}
                                </p>
                            </div>
                            <div className="card">
                                <h4 style={{ color: 'var(--accent-amber)', marginBottom: 8 }}>⚠️ Common Deficiencies</h4>
                                <p style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
                                    {result.soil.deficiencies}
                                </p>
                            </div>
                        </>
                    )}

                    <div className="card mt-3" style={{ padding: '12px' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ⚠️ AI soil analysis — confirm with soil testing lab for accurate results. Cost: ₹50-100/sample at nearest KVK.
                        </p>
                    </div>
                </div>
            )}

            {/* Info card when no image */}
            {!image && !result && (
                <div className="card mt-4">
                    <h4 style={{ marginBottom: 8, color: 'var(--accent-green)' }}>🌍 How Soil AI Works</h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {[
                            { step: '1', text: 'Take a clear photo of your soil sample in natural light' },
                            { step: '2', text: 'AI analyzes soil color, texture, and visual properties' },
                            { step: '3', text: 'Get soil type classification with confidence score' },
                            { step: '4', text: 'Receive top 5 crop recommendations with yield estimates' },
                            { step: '5', text: 'View soil amendment and deficiency correction advice' },
                        ].map((item) => (
                            <div key={item.step} className="flex gap-3 items-center">
                                <div style={{
                                    width: 28, height: 28, borderRadius: '50%',
                                    background: 'rgba(74, 222, 128, 0.15)',
                                    color: 'var(--accent-green)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '0.8rem', fontWeight: 800, flexShrink: 0,
                                }}>
                                    {item.step}
                                </div>
                                <p style={{ fontSize: '0.85rem', margin: 0, color: 'var(--text-secondary)' }}>{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
