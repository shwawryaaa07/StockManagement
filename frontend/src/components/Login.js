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
    const [staffUsername, setStaffUsername] = useState('');
    const [staffPin, setStaffPin] = useState('');
    
    // Global state
    const [rememberMe, setRememberMe] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstall);
        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    }, []);

    const handleInstallApp = async () => {
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
        if (!staffUsername.trim()) {
            setErrorMsg('⚠️ Please enter your Staff Login ID');
            return;
        }
        if (!staffPin.trim()) {
            setErrorMsg('⚠️ Please enter your 4-digit Counter PIN');
            return;
        }
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await loginAsStaff(staffUsername.trim(), staffPin.trim());
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
            setErrorMsg(err.response?.data?.message || '❌ Invalid Staff ID or PIN.');
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
                radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.12) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(217, 119, 6, 0.08) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.6) 0%, transparent 100%)
            `,
            padding: '32px 20px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box',
            position: 'relative'
        }}>
            {/* Top Right Desktop/Mobile App Install Button */}
            {!isStoreMode && (
                <div style={{ position: 'absolute', top: '16px', right: '20px', zIndex: 10 }}>
                    <button
                        onClick={handleInstallApp}
                        style={{
                            background: 'rgba(245, 158, 11, 0.12)',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            color: '#fbbf24',
                            borderRadius: '20px',
                            padding: '6px 14px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backdropFilter: 'blur(8px)',
                            transition: 'all 0.15s ease'
                        }}
                        title="Install as native app shortcut"
                    >
                        <span>📲</span> Install POS App
                    </button>
                </div>
            )}

            {/* MAIN TWO-COLUMN CONTAINER */}
            <div style={{
                width: '100%',
                maxWidth: '1080px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                alignItems: 'center',
                gap: '48px',
                margin: 'auto 0'
            }}>
                {/* LEFT COLUMN: BRANDING & 2x2 BALANCED FEATURE GRID */}
                <div style={{ padding: '8px', color: '#ffffff' }}>
                    {/* Header Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: isStoreMode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        border: isStoreMode ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '30px',
                        padding: '5px 14px',
                        fontSize: '11px',
                        fontWeight: '800',
                        color: isStoreMode ? '#34d399' : '#fbbf24',
                        marginBottom: '16px',
                        letterSpacing: '0.5px'
                    }}>
                        <span>{isStoreMode ? '🏪' : '✨'}</span> {isStoreMode ? 'STORE TERMINAL - PRODUCTION POS' : 'RETAIL POS & INVENTORY MANAGEMENT'}
                    </div>

                    <h1 style={{
                        fontSize: '36px',
                        fontWeight: '900',
                        lineHeight: '1.15',
                        margin: '0 0 8px 0',
                        letterSpacing: '-0.8px'
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
                        fontWeight: '500',
                        lineHeight: '1.5'
                    }}>
                        Fast POS Billing, Stock Control &amp; Credit Ledger
                    </p>

                    {/* Perfectly Balanced 2x2 Feature Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '12px',
                        marginBottom: '24px'
                    }}>
                        <div style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '18px' }}>⚡</span>
                                <span style={{ fontWeight: '800', fontSize: '13px', color: '#f8fafc' }}>Instant POS</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>GST billing &amp; thermal print</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '18px' }}>📲</span>
                                <span style={{ fontWeight: '800', fontSize: '13px', color: '#f8fafc' }}>WhatsApp Invoices</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Direct digital receipts</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '18px' }}>📊</span>
                                <span style={{ fontWeight: '800', fontSize: '13px', color: '#f8fafc' }}>Live Stock &amp; Dues</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>Inventory alerts &amp; ledger</div>
                        </div>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.75)',
                            border: '1px solid rgba(245, 158, 11, 0.20)',
                            borderRadius: '14px',
                            padding: '14px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                                <span style={{ fontSize: '18px' }}>🛡️</span>
                                <span style={{ fontWeight: '800', fontSize: '13px', color: '#f8fafc' }}>Role Security</span>
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>PIN-protected access</div>
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
                        <span>•</span>
                        <span>📍 Valpoi, Goa</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: ACCESS PORTAL AUTH CARD */}
                <div style={{
                    width: '100%',
                    maxWidth: '440px',
                    margin: '0 auto',
                    background: 'rgba(15, 23, 42, 0.95)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    padding: '32px 28px',
                    boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(245, 158, 11, 0.08)',
                    color: '#f8fafc',
                    border: '1px solid rgba(245, 158, 11, 0.28)',
                    boxSizing: 'border-box'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                        <div style={{
                            width: '52px',
                            height: '52px',
                            margin: '0 auto 12px',
                            background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                            boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)'
                        }}>
                            🏪
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', margin: '0 0 4px 0', color: '#ffffff', letterSpacing: '-0.3px' }}>
                            {isStoreMode ? 'Counter Terminal Login' : 'Access Portal'}
                        </h2>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                            {isStoreMode ? 'Enter register credentials to unlock terminal' : 'Select role to authenticate'}
                        </p>
                    </div>

                    {/* Role Navigation Tabs (Auto-hides Demo in Store Mode!) */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isStoreMode ? '1fr 1fr' : '1fr 1fr 1fr',
                        background: 'rgba(2, 6, 23, 0.75)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        padding: '4px',
                        borderRadius: '12px',
                        marginBottom: '22px',
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
                            padding: '11px 14px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: '600',
                            marginBottom: '18px',
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
                                padding: '16px',
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
                                    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
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
                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                                    Staff Counter Login ID
                                </label>
                                <input
                                    type="text"
                                    value={staffUsername}
                                    onChange={(e) => setStaffUsername(e.target.value)}
                                    placeholder="Enter Staff ID"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
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

                            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                                    4-Digit Counter PIN
                                </label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    value={staffPin}
                                    onChange={(e) => setStaffPin(e.target.value)}
                                    placeholder="••••"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '12px 14px',
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

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', textAlign: 'left' }}>
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
                                    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
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
                            <div style={{ marginBottom: '18px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#cbd5e1', marginBottom: '6px' }}>
                                    Owner Master PIN or Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showOwnerPass ? 'text' : 'password'}
                                        value={ownerPasscode}
                                        onChange={(e) => setOwnerPasscode(e.target.value)}
                                        placeholder="Enter PIN or Password"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '12px 42px 12px 14px',
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
                                            right: '12px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            fontSize: '15px',
                                            color: '#94a3b8'
                                        }}
                                    >
                                        {showOwnerPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px', textAlign: 'left' }}>
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
                                    boxShadow: '0 6px 18px rgba(245, 158, 11, 0.35)',
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
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
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
