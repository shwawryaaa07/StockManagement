import React, { useState } from 'react';
import { loginWithPin, loginWithCredentials } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const [passcode, setPasscode] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const trimmed = passcode.trim();

        if (!trimmed) {
            setErrorMsg('⚠️ Please enter your Security PIN or Password');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            let res;
            // If numeric (e.g. 4-6 digits), try PIN auth; otherwise try password
            if (/^\d+$/.test(trimmed)) {
                res = await loginWithPin(trimmed);
            } else {
                res = await loginWithCredentials('admin', trimmed);
            }

            if (res.data && res.data.token) {
                login(
                    res.data.token,
                    { username: res.data.username, role: res.data.role, shopName: res.data.shopName },
                    rememberMe
                );
            }
        } catch (error) {
            // If PIN failed and was numeric, fallback attempt with password
            try {
                const retryRes = await loginWithCredentials('admin', trimmed);
                if (retryRes.data && retryRes.data.token) {
                    login(
                        retryRes.data.token,
                        { username: retryRes.data.username, role: retryRes.data.role, shopName: retryRes.data.shopName },
                        rememberMe
                    );
                    return;
                }
            } catch (err2) {
                const msg = error.response?.data?.message || '❌ Invalid PIN or Password. Please try again.';
                setErrorMsg(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '440px',
                background: 'var(--bg-card)',
                borderRadius: '20px',
                padding: '36px 32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textAlign: 'center'
            }}>
                {/* Shop Crest Logo */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, var(--gold), #d97706)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 8px 24px rgba(245, 158, 11, 0.35)'
                }}>
                    🏪
                </div>

                <h1 style={{ fontSize: '22px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.5px' }}>
                    MANISHA <span style={{ color: 'var(--gold)' }}>ELECTRONICS</span>
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '6px 0 24px 0', fontWeight: '500' }}>
                    Shop Counter &amp; Inventory Management Portal
                </p>

                {/* Error Banner */}
                {errorMsg && (
                    <div style={{
                        padding: '12px 16px',
                        background: 'rgba(244, 63, 94, 0.12)',
                        border: '1px solid rgba(244, 63, 94, 0.3)',
                        borderRadius: '10px',
                        color: '#e11d48',
                        fontSize: '13px',
                        fontWeight: '700',
                        marginBottom: '20px',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <span>{errorMsg}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Security Passcode / PIN
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                placeholder="Enter PIN (e.g. 1234)"
                                autoFocus
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 44px 14px 16px',
                                    fontSize: '18px',
                                    borderRadius: '12px',
                                    border: '2px solid var(--border-color)',
                                    background: 'var(--bg-surface)',
                                    color: 'var(--text-primary)',
                                    fontWeight: '700',
                                    letterSpacing: showPassword ? 'normal' : '4px',
                                    transition: 'all 0.2s ease',
                                    outline: 'none'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--gold)'}
                                onBlur={(e) => e.target.style.borderColor = 'var(--border-color)'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                title={showPassword ? "Hide Passcode" : "Show Passcode"}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '18px',
                                    cursor: 'pointer',
                                    opacity: 0.6,
                                    padding: '4px'
                                }}
                            >
                                {showPassword ? '👁️' : '🔒'}
                            </button>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                            💡 Default PIN: <strong style={{ color: 'var(--text-primary)' }}>1234</strong>
                        </div>
                    </div>

                    {/* Remember Counter Option */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', marginBottom: '24px' }}>
                        <input
                            type="checkbox"
                            id="rememberMe"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'var(--gold)' }}
                        />
                        <label htmlFor="rememberMe" style={{ fontSize: '13px', color: 'var(--text-secondary)', cursor: 'pointer', userSelect: 'none', fontWeight: '500' }}>
                            Keep this counter signed in (30 Days)
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '16px',
                            fontWeight: '800',
                            borderRadius: '12px',
                            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.4)'
                        }}
                    >
                        {loading ? '🔓 Unlocking Register...' : '✅ Open Shop Register'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
