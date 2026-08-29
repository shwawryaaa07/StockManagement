import React, { useState } from 'react';
import { loginWithPin, loginWithCredentials } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const [authMode, setAuthMode] = useState('PIN'); // 'PIN' or 'PASSWORD'
    const [pin, setPin] = useState('');
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    const handlePinSubmit = async (e) => {
        if (e) e.preventDefault();
        if (!pin.trim()) {
            setErrorMsg('⚠️ Please enter your Security PIN');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const res = await loginWithPin(pin.trim());
            if (res.data && res.data.token) {
                login(res.data.token, { username: res.data.username, role: res.data.role, shopName: res.data.shopName }, rememberMe);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '❌ Invalid PIN. Please try again.';
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!username.trim() || !password.trim()) {
            setErrorMsg('⚠️ Please enter both username and password');
            return;
        }

        setLoading(true);
        setErrorMsg('');

        try {
            const res = await loginWithCredentials(username.trim(), password);
            if (res.data && res.data.token) {
                login(res.data.token, { username: res.data.username, role: res.data.role, shopName: res.data.shopName }, rememberMe);
            }
        } catch (error) {
            const msg = error.response?.data?.message || '❌ Invalid username or password.';
            setErrorMsg(msg);
        } finally {
            setLoading(false);
        }
    };

    // Quick PIN pad helper
    const handleKeypadPress = (val) => {
        if (val === 'CLEAR') {
            setPin('');
        } else if (val === 'BACK') {
            setPin(prev => prev.slice(0, -1));
        } else if (pin.length < 8) {
            const newPin = pin + val;
            setPin(newPin);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background: 'radial-gradient(circle at top right, #1a237e 0%, #0d1445 100%)'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '420px',
                background: 'var(--bg-card)',
                borderRadius: '16px',
                padding: '32px 28px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                border: '1px solid var(--border-color)',
                textAlign: 'center'
            }}>
                {/* Shop Branding Header */}
                <div style={{ fontSize: '42px', marginBottom: '8px' }}>🏪</div>
                <h1 style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, letterSpacing: '0.5px' }}>
                    MANISHA <span style={{ color: 'var(--gold)' }}>ELECTRONICS</span>
                </h1>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 20px 0' }}>
                    Stock &amp; POS Cloud Security Portal
                </p>

                {/* Tab Switcher: PIN vs Password */}
                <div style={{
                    display: 'flex',
                    background: 'var(--bg-body)',
                    borderRadius: '10px',
                    padding: '4px',
                    marginBottom: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('PIN'); setErrorMsg(''); }}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '7px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: authMode === 'PIN' ? 'var(--primary)' : 'transparent',
                            color: authMode === 'PIN' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        ⚡ Fast PIN Unlock
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('PASSWORD'); setErrorMsg(''); }}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: 'none',
                            borderRadius: '7px',
                            fontSize: '13px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            background: authMode === 'PASSWORD' ? 'var(--primary)' : 'transparent',
                            color: authMode === 'PASSWORD' ? '#ffffff' : 'var(--text-muted)',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        🔑 Password
                    </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div style={{
                        padding: '10px 14px',
                        background: 'rgba(239, 83, 80, 0.15)',
                        border: '1px solid rgba(239, 83, 80, 0.3)',
                        borderRadius: '8px',
                        color: '#c62828',
                        fontSize: '12px',
                        fontWeight: '700',
                        marginBottom: '16px',
                        textAlign: 'left'
                    }}>
                        {errorMsg}
                    </div>
                )}

                {/* PIN MODE */}
                {authMode === 'PIN' && (
                    <form onSubmit={handlePinSubmit}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                Enter 4-Digit Security PIN
                            </label>
                            <input
                                type="password"
                                value={pin}
                                onChange={(e) => setPin(e.target.value)}
                                placeholder="••••"
                                maxLength="8"
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    fontSize: '24px',
                                    textAlign: 'center',
                                    letterSpacing: '10px',
                                    borderRadius: '10px',
                                    border: '2px solid var(--primary)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)',
                                    fontWeight: '900'
                                }}
                            />
                        </div>

                        {/* Fast Touch Keypad */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '10px',
                            marginBottom: '16px'
                        }}>
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 'CLEAR', 0, 'BACK'].map((btn, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleKeypadPress(btn)}
                                    style={{
                                        padding: '12px 0',
                                        fontSize: typeof btn === 'number' ? '18px' : '11px',
                                        fontWeight: '800',
                                        borderRadius: '8px',
                                        border: '1px solid var(--border-color)',
                                        background: typeof btn === 'number' ? 'var(--bg-body)' : 'rgba(0,0,0,0.06)',
                                        color: typeof btn === 'number' ? 'var(--text-primary)' : 'var(--text-muted)',
                                        cursor: 'pointer',
                                        transition: 'transform 0.1s'
                                    }}
                                >
                                    {btn === 'BACK' ? '⌫' : btn}
                                </button>
                            ))}
                        </div>

                        {/* Remember Me */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                            <input
                                type="checkbox"
                                id="rememberMePin"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <label htmlFor="rememberMePin" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                                Keep me signed in (30 Days)
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '15px',
                                fontWeight: '800',
                                borderRadius: '8px',
                                boxShadow: '0 4px 14px rgba(249, 168, 37, 0.4)'
                            }}
                        >
                            {loading ? 'Unlocking...' : '🔓 Unlock System'}
                        </button>
                    </form>
                )}

                {/* PASSWORD MODE */}
                {authMode === 'PASSWORD' && (
                    <form onSubmit={handlePasswordSubmit}>
                        <div style={{ textAlign: 'left', marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Username
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="admin"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        <div style={{ textAlign: 'left', marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                                Password
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '10px 14px',
                                    fontSize: '13px',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border-color)',
                                    background: 'var(--bg-body)',
                                    color: 'var(--text-primary)'
                                }}
                            />
                        </div>

                        {/* Remember Me */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '16px' }}>
                            <input
                                type="checkbox"
                                id="rememberMePass"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                            <label htmlFor="rememberMePass" style={{ fontSize: '12px', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
                                Keep me signed in (30 Days)
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{
                                width: '100%',
                                padding: '12px',
                                fontSize: '15px',
                                fontWeight: '800',
                                borderRadius: '8px',
                                boxShadow: '0 4px 14px rgba(249, 168, 37, 0.4)'
                            }}
                        >
                            {loading ? 'Logging in...' : '🔑 Sign In'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default Login;
