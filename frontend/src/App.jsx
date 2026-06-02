import React, { useState } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { LanguageProvider, useLanguage } from './i18n/LanguageContext';
import { useDevice } from './hooks/useDevice';

// Auth screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';

// Admin app
import AdminApp from './screens/AdminApp';

// Farmer screens
import HomeScreen from './screens/HomeScreen';
import PlanningScreen from './screens/PlanningScreen';
import AdvisoryScreen from './screens/AdvisoryScreen';
import AlertsScreen from './screens/AlertsScreen';
import LogsScreen from './screens/LogsScreen';
import SoilHealthScreen from './screens/SoilHealthScreen';
import SoilAnalysisScreen from './screens/SoilAnalysisScreen';
import ProfileScreen from './screens/ProfileScreen';

import './App.css';
import './admin.css';

const TABS = [
  { id: 'home', icon: '🌾', labelKey: 'nav_home' },
  { id: 'planning', icon: '📅', labelKey: 'nav_planning' },
  { id: 'advisory', icon: '🤖', labelKey: 'nav_advisory' },
  { id: 'soil_ai', icon: '🔬', labelKey: 'nav_soil' },
  { id: 'soil_health', icon: '🌍', labelKey: 'nav_soil_health' },
  { id: 'alerts', icon: '🔔', labelKey: 'nav_alerts' },
  { id: 'logs', icon: '📋', labelKey: 'nav_logs' },
  { id: 'profile', icon: '👤', labelKey: 'nav_profile' },
];

// ── Farmer App (role=user) ─────────────────────────────────────────────────
function FarmerApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const { device } = useDevice();
  const { t } = useLanguage();
  const { user, logout } = useAuth();

  React.useEffect(() => {
    const up = () => setIsOnline(true);
    const dn = () => setIsOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', dn);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', dn); };
  }, []);

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen isOnline={isOnline} setActiveTab={setActiveTab} />;
      case 'planning': return <PlanningScreen />;
      case 'advisory': return <AdvisoryScreen isOnline={isOnline} />;
      case 'soil_ai': return <SoilAnalysisScreen isOnline={isOnline} />;
      case 'alerts': return <AlertsScreen isOnline={isOnline} />;
      case 'logs': return <LogsScreen isOnline={isOnline} />;
      case 'soil_health': return <SoilHealthScreen isOnline={isOnline} />;
      case 'profile': return <ProfileScreen isOnline={isOnline} />;
      default: return <HomeScreen isOnline={isOnline} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className={`app layout-${device}`}>
      {!isOnline && (
        <div className="offline-banner"><span>📡</span> {t('offline_banner') || 'You are offline — data saved locally'}</div>
      )}

      {/* Sidebar (tablet/desktop) */}
      <aside className="sidebar-nav">
        <div className="sidebar-brand">
          <span className="sidebar-logo">🌾</span>
          <div className="sidebar-brand-text">
            <div className="sidebar-title">Smart Crop</div>
            <div className="sidebar-sub">Advisor</div>
          </div>
        </div>
        <div className="sidebar-status">
          <span className={`status-dot ${isOnline ? 'online' : 'offline'}`} />
          <span className="sidebar-status-text">{isOnline ? t('status_online') || 'Online' : t('status_offline') || 'Offline'}</span>
        </div>
        <nav className="sidebar-links">
          {TABS.map((tab) => (
            <button key={tab.id} className={`sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              <span className="sidebar-icon">{tab.icon}</span>
              <span className="sidebar-label">{t(tab.labelKey)}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 8 }}>
            👤 {user?.name}
          </p>
          <button onClick={logout} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Outfit', fontWeight: 600 }}>
            🚪 {t('logout') || 'Logout'}
          </button>
          <p style={{ marginTop: 8 }}>SDG-15 · Build2Gether</p>
          <p>v2.0.0</p>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">{renderScreen()}</main>

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {TABS.map((tab) => (
          <button key={tab.id} className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)} aria-label={t(tab.labelKey)}>
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── Auth Gate ──────────────────────────────────────────────────────────────
function AuthGate() {
  const { user, loading } = useAuth();
  const [screen, setScreen] = useState('login'); // 'login' | 'register'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Loading Smart Crop Advisor...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth screens
  if (!user) {
    if (screen === 'register') return <RegisterScreen onGoLogin={() => setScreen('login')} />;
    return <LoginScreen onGoRegister={() => setScreen('register')} />;
  }

  // Admin → show admin dashboard
  if (user.role === 'admin') return <AdminApp />;

  // Farmer → show farmer app
  return <FarmerApp />;
}

// ── Root App ───────────────────────────────────────────────────────────────
export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AuthGate />
      </AuthProvider>
    </LanguageProvider>
  );
}
