import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';

const REGIONS = [
    { key: '', label: 'Select your region' },
    { key: 'upper_godavari', label: 'Upper Godavari (Telangana/AP)' },
    { key: 'vidarbha', label: 'Vidarbha (Maharashtra)' },
    { key: 'malwa_plateau', label: 'Malwa Plateau (MP/Rajasthan)' },
];

export default function RegisterScreen({ onGoLogin }) {
    const { register } = useAuth();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', region: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register(form.name.trim(), form.email.trim(), form.password, form.region);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                <div className="auth-logo">
                    <span className="auth-logo-icon">🌾</span>
                    <div>
                        <h1 className="auth-app-name">Smart Crop Advisor</h1>
                        <p className="auth-app-sub">SDG-15 · Sustainable Farming</p>
                    </div>
                </div>

                <h2 className="auth-title">Create Account</h2>
                <p className="auth-subtitle">Register as a farmer to get started</p>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">👤 Full Name</label>
                        <input className="form-input" type="text" placeholder="Your full name" value={form.name} onChange={set('name')} required />
                    </div>

                    <div className="form-group">
                        <label className="form-label">📧 Email Address</label>
                        <input className="form-input" type="email" placeholder="yourname@gmail.com" value={form.email} onChange={set('email')} required autoComplete="email" />
                    </div>

                    <div className="form-group">
                        <label className="form-label">🌍 Region</label>
                        <select className="form-select" value={form.region} onChange={set('region')}>
                            {REGIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">🔒 Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Min 6 characters"
                                value={form.password}
                                onChange={set('password')}
                                required
                                style={{ paddingRight: 52 }}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">🔒 Confirm Password</label>
                        <input className="form-input" type={showPass ? 'text' : 'password'} placeholder="Repeat password"
                            value={form.confirm} onChange={set('confirm')} required />
                    </div>

                    <button className="btn btn-primary btn-full mt-3" type="submit" disabled={loading}>
                        {loading ? '⏳ Creating account...' : '✅ Create Account'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <p className="auth-switch">
                    Already have an account?{' '}
                    <button className="auth-link" onClick={onGoLogin}>Sign In</button>
                </p>
            </div>
        </div>
    );
}
