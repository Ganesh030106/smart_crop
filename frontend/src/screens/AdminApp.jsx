import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import AdminHome from './admin/AdminHome';
import FarmersList from './admin/FarmersList';
import AdvisoryEditor from './admin/AdvisoryEditor';
import AlertsEditor from './admin/AlertsEditor';
import SmartPlanScreen from './SmartPlanScreen';
import '../admin.css';

const ADMIN_TABS = [
    { id: 'home', icon: '📊', label: 'Dashboard' },
    { id: 'smart_plan', icon: '🌱', label: 'Smart Planning' },
    { id: 'farmers', icon: '👨‍🌾', label: 'Farmers' },
    { id: 'advisory', icon: '📋', label: 'Advisories' },
    { id: 'alerts', icon: '🔔', label: 'Alerts' },
];

export default function AdminApp() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('home');

    const renderScreen = () => {
        switch (activeTab) {
            case 'home': return <AdminHome />;
            case 'smart_plan': return <div className="admin-screen"><SmartPlanScreen /></div>;
            case 'farmers': return <FarmersList />;
            case 'advisory': return <AdvisoryEditor />;
            case 'alerts': return <AlertsEditor />;
            default: return <AdminHome />;
        }
    };

    return (
        <div className="admin-layout">
            {/* Admin Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <span className="admin-brand-icon">🌾</span>
                    <div>
                        <div className="admin-brand-name">Smart Crop</div>
                        <div className="admin-brand-sub">Admin Panel</div>
                    </div>
                </div>

                <div className="admin-user-info">
                    <div className="admin-avatar">{user?.name?.[0]?.toUpperCase() || 'A'}</div>
                    <div>
                        <div className="admin-user-name">{user?.name}</div>
                        <div className="admin-user-role">🔑 Administrator</div>
                    </div>
                </div>

                <nav className="admin-nav">
                    {ADMIN_TABS.map((tab) => (
                        <button
                            key={tab.id}
                            className={`admin-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <span className="admin-nav-icon">{tab.icon}</span>
                            <span className="admin-nav-label">{tab.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout-btn" onClick={logout}>
                        🚪 Logout
                    </button>
                    <p className="admin-version">v2.0.0 · SDG-15</p>
                </div>
            </aside>

            {/* Admin Main Content */}
            <main className="admin-main">
                {renderScreen()}
            </main>
        </div>
    );
}
