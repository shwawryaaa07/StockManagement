import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsOwner, loginAsStaff, loginAsVisitor } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [authMode, setAuthMode] = useState('VISITOR'); // 'VISITOR', 'STAFF', 'OWNER'
    
    // Owner state
    const [ownerPasscode, setOwnerPasscode] = useState('');
    const [showOwnerPass, setShowOwnerPass] = useState(false);
    
    // Staff state
    const [staffUsername, setStaffUsername] = useState('rahul_counter1');
    const [staffPin, setStaffPin] = useState('');
    
    // Global state
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    // 1. Handle Visitor 1-Click Sandbox Login
    const handleVisitorLogin = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await loginAsVisitor();
            if (res.data && res.data.token) {
                login(
                    res.data.token,
                    {
                        username: res.data.username || 'Portfolio Guest',
                        role: res.data.role || 'VISITOR',
                        tenantType: res.data.tenantType || 'DEMO',
                        shopName: res.data.shopName || 'Manisha Electronics (Sandbox)'
                    },
                    false
                );
                navigate('/', { replace: true });
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || '⚠️ Could not connect to demo server. Please retry in a moment.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle Staff PIN Login
    const handleStaffLogin = async (e) => {
        if (e) e.preventDefault();
        if (!staffPin.trim()) {
            setErrorMsg('⚠️ Please enter the 4-digit Counter PIN');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await loginAsStaff(staffUsername, staffPin.trim());
            if (res.data && res.data.token) {
                login(
                    res.data.token,
                    {
                        username: res.data.username,
                        role: res.data.role,
                        tenantType: res.data.tenantType,
                        shopName: res.data.shopName
                    },
                    rememberMe
                );
                navigate('/', { replace: true });
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || '❌ Invalid Staff PIN.');
        } finally {
            setLoading(false);
        }
    };

    // 3. Handle Owner Master Login
    const handleOwnerLogin = async (e) => {
        if (e) e.preventDefault();
        if (!ownerPasscode.trim()) {
            setErrorMsg('⚠️ Please enter Owner PIN or Password');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await loginAsOwner(ownerPasscode.trim());
            if (res.data && res.data.token) {
                login(
                    res.data.token,
                    {
                        username: res.data.username,
                        role: res.data.role,
                        tenantType: res.data.tenantType,
                        shopName: res.data.shopName
                    },
                    rememberMe
                );
                navigate('/', { replace: true });
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || '❌ Invalid Owner Passcode. Default PIN is 1234');
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
            backgroundColor: '#090d16',
            backgroundImage: `
                radial-gradient(circle at 15% 25%, rgba(245, 158, 11, 0.12) 0%, transparent 45%),
                radial-gradient(circle at 85% 75%, rgba(217, 119, 6, 0.08) 0%, transparent 45%)
            `,
            padding: '36px 20px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1060px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '36px',
                alignItems: 'center'
            }}>
                {/* LEFT HERO COLUMN: Minimalist Dark & Gold */}
                <div style={{ padding: '8px 12px', color: '#ffffff' }}>
                    {/* Header Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(245, 158, 11, 0.10)',
                        border: '1px solid rgba(245, 158, 11, 0.30)',
                        borderRadius: '30px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#fbbf24',
                        marginBottom: '16px'
                    }}>
                        <span>✨</span> Retail POS &amp; Inventory System
                    </div>

                    <h1 style={{
                        fontSize: '40px',
                        fontWeight: '900',
                        lineHeight: '1.15',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.5px'
                    }}>
                        MANISHA <span style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>ELECTRONICS</span>
                    </h1>

                    <p style={{
                        fontSize: '15px',
                        color: '#94a3b8',
                        margin: '0 0 24px 0',
                        fontWeight: '500'
                    }}>
                        Fast POS Billing, Stock Control &amp; Credit Ledger
                    </p>

                    {/* 4 Clean Dark & Gold Feature Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                color: '#fbbf24',
                                marginBottom: '8px'
                            }}>
                                ⚡
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc' }}>Instant POS</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>GST billing &amp; thermal print</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                color: '#fbbf24',
                                marginBottom: '8px'
                            }}>
                                📲
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc' }}>WhatsApp Invoices</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Direct digital receipts</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                color: '#fbbf24',
                                marginBottom: '8px'
                            }}>
                                📊
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc' }}>Live Stock &amp; Dues</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>Inventory alerts &amp; ledger</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px'
                        }}>
                            <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px',
                                color: '#fbbf24',
                                marginBottom: '8px'
                            }}>
                                🛡️
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: '#f8fafc' }}>Role Security</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>PIN-protected access</div>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        fontSize: '12px',
                        color: '#64748b',
                        fontWeight: '500'
                    }}>
                        <span>🔒 256-Bit SSL Encrypted</span>
                        <span>•</span>
                        <span>⚡ 100% Client Isolation</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: Dark & Gold Auth Card */}
                <div style={{
                    background: 'rgba(15, 23, 42, 0.90)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '24px',
                    padding: '34px 30px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                    color: '#f8fafc',
                    border: '1px solid rgba(245, 158, 11, 0.25)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            margin: '0 auto 10px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                            boxShadow: '0 8px 18px rgba(245, 158, 11, 0.25)'
                        }}>
                            🏪
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff' }}>
                            Access Portal
                        </h2>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                            Select role to authenticate
                        </p>
                    </div>

                    {/* 3-Tier Navigation Tabs */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        background: 'rgba(2, 6, 23, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '4px',
                        borderRadius: '12px',
                        marginBottom: '22px',
                        gap: '4px'
                    }}>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('VISITOR'); setErrorMsg(''); }}
                            style={{
                                padding: '9px 4px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: authMode === 'VISITOR' ? '800' : '600',
                                background: authMode === 'VISITOR' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'transparent',
                                color: authMode === 'VISITOR' ? '#0f172a' : '#94a3b8',
                                cursor: 'pointer',
                                border: 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            🚀 Demo
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('STAFF'); setErrorMsg(''); }}
                            style={{
                                padding: '9px 4px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: authMode === 'STAFF' ? '800' : '600',
                                background: authMode === 'STAFF' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'transparent',
                                color: authMode === 'STAFF' ? '#0f172a' : '#94a3b8',
                                cursor: 'pointer',
                                border: 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            👤 Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('OWNER'); setErrorMsg(''); }}
                            style={{
                                padding: '9px 4px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: authMode === 'OWNER' ? '800' : '600',
                                background: authMode === 'OWNER' ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'transparent',
                                color: authMode === 'OWNER' ? '#0f172a' : '#94a3b8',
                                cursor: 'pointer',
                                border: 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            👑 Owner
                        </button>
                    </div>

                    {/* Error Display */}
                    {errorMsg && (
                        <div style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '1px solid rgba(239, 68, 68, 0.4)',
                            color: '#fca5a5',
                            padding: '10px 12px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            lineHeight: '1.4'
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    {/* TAB 1: VISITOR DEMO */}
                    {authMode === 'VISITOR' && (
                        <div>
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.10)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '14px',
                                padding: '14px',
                                marginBottom: '20px',
                                textAlign: 'left'
                            }}>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#fbbf24', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🚀</span> Recruiter &amp; Portfolio Sandbox
                                </div>
                                <p style={{ fontSize: '12px', color: '#cbd5e1', margin: 0, lineHeight: '1.5' }}>
                                    Explore live POS billing, add products, and test receipts in an <strong>isolated sandbox environment</strong> with zero risk to real data.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleVisitorLogin}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {loading ? '✨ Initializing Sandbox...' : '✨ Enter Live Demo (1-Click)'}
                            </button>
                        </div>
                    )}

                    {/* TAB 2: STAFF LOGIN */}
                    {authMode === 'STAFF' && (
                        <form onSubmit={handleStaffLogin}>
                            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                                    Staff Counter Login ID
                                </label>
                                <input
                                    type="text"
                                    value={staffUsername}
                                    onChange={(e) => setStaffUsername(e.target.value)}
                                    placeholder="Enter login ID"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '11px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid #334155',
                                        fontSize: '13px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        background: '#020617',
                                        color: '#ffffff'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                                    4-Digit Counter PIN
                                </label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    value={staffPin}
                                    onChange={(e) => setStaffPin(e.target.value)}
                                    placeholder="Enter 4-digit PIN"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '11px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid #334155',
                                        fontSize: '13px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        letterSpacing: '2px',
                                        background: '#020617',
                                        color: '#ffffff'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', textAlign: 'left' }}>
                                <input
                                    type="checkbox"
                                    id="rememberStaff"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ marginRight: '8px', cursor: 'pointer' }}
                                />
                                <label htmlFor="rememberStaff" style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                                    Remember register session
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {loading ? 'Verifying Counter PIN...' : '🔓 Unlock Staff Counter'}
                            </button>
                        </form>
                    )}

                    {/* TAB 3: OWNER LOGIN */}
                    {authMode === 'OWNER' && (
                        <form onSubmit={handleOwnerLogin}>
                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                                    Owner Master PIN or Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showOwnerPass ? 'text' : 'password'}
                                        value={ownerPasscode}
                                        onChange={(e) => setOwnerPasscode(e.target.value)}
                                        placeholder="Enter PIN or password"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '11px 38px 11px 12px',
                                            borderRadius: '10px',
                                            border: '1px solid #334155',
                                            fontSize: '13px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            background: '#020617',
                                            color: '#ffffff'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOwnerPass(!showOwnerPass)}
                                        style={{
                                            position: 'absolute',
                                            right: '10px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            color: '#94a3b8'
                                        }}
                                    >
                                        {showOwnerPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '18px', textAlign: 'left' }}>
                                <input
                                    type="checkbox"
                                    id="rememberOwner"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    style={{ marginRight: '8px', cursor: 'pointer' }}
                                />
                                <label htmlFor="rememberOwner" style={{ fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}>
                                    Keep owner logged in
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '13px',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    color: '#0f172a',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                {loading ? 'Authenticating Store Owner...' : '👑 Enter Owner Portal'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;
