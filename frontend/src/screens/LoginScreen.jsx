import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';


export default function LoginScreen({ onGoRegister }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email.trim(), password);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card">
                {/* Logo */}
                <div className="auth-logo">
                    <span className="auth-logo-icon">🌾</span>
                    <div>
                        <h1 className="auth-app-name">Smart Crop Advisor</h1>
                        <p className="auth-app-sub">SDG-15 · Sustainable Farming</p>
                    </div>
                </div>

                <h2 className="auth-title">Sign In</h2>

                {error && (
                    <div className="auth-error">
                        <span>⚠️</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label className="form-label">📧 Email</label>
                        <input
                            className="form-input"
                            type="email"
                            placeholder="yourname@gmail.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">🔒 Password</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                className="form-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                autoComplete="current-password"
                                style={{ paddingRight: 52 }}
                            />
                            <button type="button" onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem' }}>
                                {showPass ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    <button className="btn btn-primary btn-full mt-3" type="submit" disabled={loading}>
                        {loading ? '⏳ Signing in...' : '🚀 Sign In'}
                    </button>
                </form>

                <div className="auth-divider"><span>or</span></div>

                <p className="auth-switch">
                    New farmer?{' '}
                    <button className="auth-link" onClick={onGoRegister}>Create Account</button>
                </p>
            </div>
        </div>
    );
}
