import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsOwner, loginAsStaff, loginAsVisitor } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const navigate = useNavigate();

    // Detect if launched as Standalone Desktop App or in ?mode=store
    const queryParams = new URLSearchParams(window.location.search);
    const isStoreMode = queryParams.get('mode') === 'store' || 
                        queryParams.get('mode') === 'pos' || 
                        window.matchMedia('(display-mode: standalone)').matches || 
                        window.navigator.standalone === true;

    const [authMode, setAuthMode] = useState(isStoreMode ? 'STAFF' : 'VISITOR'); // 'VISITOR', 'STAFF', 'OWNER'
    
    // PWA Install prompt state
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showVisitorRestrictedModal, setShowVisitorRestrictedModal] = useState(false);

    // Owner state
    const [ownerPasscode, setOwnerPasscode] = useState('');
    const [showOwnerPass, setShowOwnerPass] = useState(false);
    
    // Staff state
    const [staffUsername, setStaffUsername] = useState('Tejas');
    const [staffPin, setStaffPin] = useState('');
    
    // Global state
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Listen for native install prompt (Chrome / Edge / Android)
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstallApp = async () => {
        // If on visitor demo tab, prevent download and show authorized restriction message
        if (authMode === 'VISITOR' && !isStoreMode) {
            setShowVisitorRestrictedModal(true);
            return;
        }

        if (deferredPrompt) {
            deferredPrompt.prompt();
            await deferredPrompt.userChoice;
            setDeferredPrompt(null);
        } else {
            alert('💡 To install on mobile / desktop:\n1. Open browser menu (⋮)\n2. Tap "Install App" or "Add to Home screen"');
        }
    };

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
            setErrorMsg(err.response?.data?.message || '⚠️ Could not connect to demo server. Please retry.');
        } finally {
            setLoading(false);
        }
    };

    // 2. Handle Staff PIN Login
    const handleStaffLogin = async (e) => {
        if (e) e.preventDefault();
        if (!staffPin.trim()) {
            setErrorMsg('⚠️ Please enter your 4-digit Counter PIN');
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
            setErrorMsg(err.response?.data?.message || '❌ Invalid Owner Passcode.');
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
            padding: '24px 16px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* Top Right Desktop/Mobile App Install Button */}
            {!isStoreMode && (
                <div style={{ position: 'absolute', top: '12px', right: '16px', zIndex: 10 }}>
                    <button
                        onClick={handleInstallApp}
                        style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#fbbf24',
                            borderRadius: '20px',
                            padding: '5px 12px',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.15s ease'
                        }}
                        title="Install as native app shortcut"
                    >
                        <span>📲</span> Install POS App
                    </button>
                </div>
            )}

            <div style={{
                width: '100%',
                maxWidth: '1040px',
                display: 'flex',
                flexWrap: 'wrap-reverse', // On mobile, Auth Card sits on top!
                justifyContent: 'center',
                alignItems: 'center',
                gap: '32px',
                marginTop: '10px'
            }}>
                {/* BRAND SHOWCASE COLUMN */}
                <div style={{ flex: '1 1 340px', maxWidth: '500px', padding: '4px', color: '#ffffff' }}>
                    {/* Header Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isStoreMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.10)',
                        border: isStoreMode ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.30)',
                        borderRadius: '30px',
                        padding: '4px 12px',
                        fontSize: '11px',
                        fontWeight: '700',
                        color: isStoreMode ? '#34d399' : '#fbbf24',
                        marginBottom: '12px'
                    }}>
                        <span>{isStoreMode ? '🏪' : '✨'}</span> {isStoreMode ? 'STORE TERMINAL - PRODUCTION POS' : 'Retail POS & Inventory System'}
                    </div>

                    <h1 style={{
                        fontSize: '34px',
                        fontWeight: '900',
                        lineHeight: '1.15',
                        margin: '0 0 6px 0',
                        letterSpacing: '-0.5px'
                    }}>
                        MANISHA <span style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>ELECTRONICS</span>
                    </h1>

                    <p style={{
                        fontSize: '14px',
                        color: '#94a3b8',
                        margin: '0 0 20px 0',
                        fontWeight: '500'
                    }}>
                        Fast POS Billing, Stock Control &amp; Credit Ledger
                    </p>

                    {/* 4 Clean Dark & Gold Feature Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                color: '#fbbf24',
                                marginBottom: '6px'
                            }}>
                                ⚡
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#f8fafc' }}>Instant POS</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>GST billing &amp; thermal print</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                color: '#fbbf24',
                                marginBottom: '6px'
                            }}>
                                📲
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#f8fafc' }}>WhatsApp Invoices</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Direct digital receipts</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                color: '#fbbf24',
                                marginBottom: '6px'
                            }}>
                                📊
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#f8fafc' }}>Live Stock &amp; Dues</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>Inventory alerts &amp; ledger</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.8)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '12px',
                            padding: '12px'
                        }}>
                            <div style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '7px',
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                color: '#fbbf24',
                                marginBottom: '6px'
                            }}>
                                🛡️
                            </div>
                            <div style={{ fontWeight: '700', fontSize: '12px', color: '#f8fafc' }}>Role Security</div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>PIN-protected access</div>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '11px',
                        color: '#64748b',
                        fontWeight: '500'
                    }}>
                        <span>🔒 256-Bit SSL Encrypted</span>
                        <span>•</span>
                        <span>⚡ 100% Client Isolation</span>
                    </div>
                </div>

                {/* ACCESS PORTAL AUTH CARD (Centered and Prioritized) */}
                <div style={{
                    flex: '1 1 340px',
                    maxWidth: '460px',
                    width: '100%',
                    background: 'rgba(15, 23, 42, 0.94)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '22px',
                    padding: '28px 24px',
                    boxShadow: '0 20px 50px -10px rgba(0, 0, 0, 0.7)',
                    color: '#f8fafc',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            margin: '0 auto 10px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            boxShadow: '0 6px 16px rgba(245, 158, 11, 0.25)'
                        }}>
                            🏪
                        </div>
                        <h2 style={{ fontSize: '19px', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff' }}>
                            {isStoreMode ? 'Counter Terminal Login' : 'Access Portal'}
                        </h2>
                        <p style={{ fontSize: '12px', color: '#94a3b8', margin: 0 }}>
                            {isStoreMode ? 'Enter register credentials to unlock terminal' : 'Select role to authenticate'}
                        </p>
                    </div>

                    {/* Role Navigation Tabs (Auto-hides Demo in Store Mode!) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isStoreMode ? '1fr 1fr' : '1fr 1fr 1fr',
                        background: 'rgba(2, 6, 23, 0.7)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '4px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        gap: '4px'
                    }}>
                        {!isStoreMode && (
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
                        )}
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
                    {!isStoreMode && authMode === 'VISITOR' && (
                        <div>
                            <div style={{
                                background: 'rgba(245, 158, 11, 0.10)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                borderRadius: '12px',
                                padding: '14px',
                                marginBottom: '18px',
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
                                    padding: '12px',
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
                                    placeholder="e.g. Tejas or rahul_counter1"
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
                                    padding: '12px',
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
                                        placeholder="Enter PIN (e.g. 2006 or 1234)"
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
                                    padding: '12px',
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

            {/* Modal: Protected Action for Visitors */}
            {showVisitorRestrictedModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(6px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 99999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: '#0f172a',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '20px',
                        padding: '28px',
                        maxWidth: '400px',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                        color: '#f8fafc'
                    }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '14px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '24px',
                            margin: '0 auto 14px'
                        }}>
                            🔒
                        </div>

                        <h3 style={{ fontSize: '17px', fontWeight: '800', color: '#fbbf24', margin: '0 0 8px 0' }}>
                            Authorized Terminals Only
                        </h3>

                        <p style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5', margin: '0 0 18px 0' }}>
                            Desktop POS App installation is reserved for authorized <strong>Counter Staff</strong> and <strong>Store Owner</strong> registers.
                        </p>

                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                            <button
                                onClick={() => setShowVisitorRestrictedModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.15)',
                                    color: '#cbd5e1',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    setShowVisitorRestrictedModal(false);
                                    setAuthMode('STAFF');
                                }}
                                style={{
                                    padding: '8px 16px',
                                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                    border: 'none',
                                    color: '#0f172a',
                                    borderRadius: '10px',
                                    fontSize: '12px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                👤 Staff Login
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Login;
