import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAsOwner, loginAsStaff, loginAsVisitor } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

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
        <div className="login-page">
            {/* Ambient card backlight glow blob */}
            <div className="login-bg-glow-card" aria-hidden="true"></div>

            {/* Top Right Ghost Install POS Button */}
            {!isStoreMode && (
                <button
                    type="button"
                    onClick={handleInstallApp}
                    className="install-btn"
                    title="Install as native app shortcut"
                >
                    <span>📲</span> Install POS App
                </button>
            )}

            {/* MAIN TWO-COLUMN CONTAINER */}
            <div className="login-page-layout">
                {/* LEFT COLUMN: HERO SECTION */}
                <div className="login-hero">
                    {/* Glowing Tagline Badge */}
                    <div className={`login-tagline-badge ${isStoreMode ? 'store-mode' : ''}`}>
                        {isStoreMode ? '🏪 STORE TERMINAL - PRODUCTION POS' : '⚡ RETAIL POS & INVENTORY MANAGEMENT'}
                    </div>

                    {/* Main Brand Title with Animated Gold Shimmer */}
                    <h1 className="login-title">
                        MANISHA <span className="gold">ELECTRONICS</span>
                    </h1>

                    {/* Subtitle */}
                    <p className="login-subtitle">
                        Fast POS Billing, Stock Control &amp; Credit Ledger
                    </p>

                    {/* Feature List — Vertical Stack with Modern Icon Badges */}
                    <div className="login-features">
                        <div className="login-feature-item">
                            <div className="feature-icon feature-icon-gold">⚡</div>
                            <div>
                                <div className="feature-title">Instant POS Billing</div>
                                <div className="feature-desc">GST invoicing &amp; thermal print in seconds</div>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div className="feature-icon feature-icon-green">📲</div>
                            <div>
                                <div className="feature-title">WhatsApp Invoices</div>
                                <div className="feature-desc">Share digital receipts directly to customers</div>
                            </div>
                        </div>

                        <div className="login-feature-item">
                            <div className="feature-icon feature-icon-blue">📊</div>
                            <div>
                                <div className="feature-title">Live Stock &amp; Dues</div>
                                <div className="feature-desc">Real-time inventory alerts &amp; credit ledger</div>
                            </div>
                        </div>
                    </div>

                    {/* Trust Badges */}
                    <div className="login-trust-row">
                        <span className="trust-badge">🔒 256-Bit SSL</span>
                        <span className="trust-divider">•</span>
                        <span className="trust-badge">⚡ 100% Client Isolation</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: ACCESS PORTAL AUTH CARD */}
                <div className="login-card">
                    <div className="login-card-icon">
                        🏪
                    </div>
                    <h2 className="login-card-title">
                        {isStoreMode ? 'Counter Terminal Login' : 'Welcome Back'}
                    </h2>
                    <p className="login-card-subtitle">
                        {isStoreMode ? 'Enter register credentials to unlock terminal' : 'Select role to access your portal'}
                    </p>

                    {/* Role Navigation Tabs */}
                    <div className="role-selector">
                        {!isStoreMode && (
                            <button
                                type="button"
                                onClick={() => { setAuthMode('VISITOR'); setErrorMsg(''); }}
                                className={`role-tab ${authMode === 'VISITOR' ? 'active' : ''}`}
                            >
                                🚀 Demo
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={() => { setAuthMode('STAFF'); setErrorMsg(''); }}
                            className={`role-tab ${authMode === 'STAFF' ? 'active' : ''}`}
                        >
                            👤 Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('OWNER'); setErrorMsg(''); }}
                            className={`role-tab ${authMode === 'OWNER' ? 'active' : ''}`}
                        >
                            👑 Owner
                        </button>
                    </div>

                    {/* Error Banner */}
                    {errorMsg && (
                        <div className="login-error-banner">
                            <span>⚠️</span>
                            <span>{errorMsg}</span>
                        </div>
                    )}

                    {/* TAB 1: VISITOR DEMO */}
                    {!isStoreMode && authMode === 'VISITOR' && (
                        <div>
                            <div className="sandbox-info">
                                <div className="sandbox-info-title">
                                    <span>🚀</span> Recruiter &amp; Portfolio Sandbox
                                </div>
                                <p className="sandbox-info-desc">
                                    Explore live POS billing, add products, and test receipts in an <strong>isolated sandbox environment</strong> with zero risk to real data.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleVisitorLogin}
                                disabled={loading}
                                className="login-cta"
                            >
                                {loading ? '✨ Initializing Sandbox...' : '✨ Enter Live Demo (1-Click)'}
                            </button>
                        </div>
                    )}

                    {/* TAB 2: STAFF LOGIN */}
                    {authMode === 'STAFF' && (
                        <form onSubmit={handleStaffLogin}>
                            <div className="login-form-group">
                                <label className="login-form-label">
                                    Staff Counter Login ID
                                </label>
                                <input
                                    type="text"
                                    value={staffUsername}
                                    onChange={(e) => setStaffUsername(e.target.value)}
                                    placeholder="Enter staff login ID"
                                    required
                                    className="login-input"
                                />
                            </div>

                            <div className="login-form-group">
                                <label className="login-form-label" style={{ textAlign: 'center' }}>
                                    4-Digit Counter PIN
                                </label>
                                <div className="pin-input-group">
                                    {[0, 1, 2, 3].map((idx) => (
                                        <input
                                            key={idx}
                                            id={`staff-pin-${idx}`}
                                            type="password"
                                            inputMode="numeric"
                                            maxLength={1}
                                            value={staffPin[idx] || ''}
                                            className={`pin-digit ${staffPin[idx] ? 'filled' : ''}`}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                let digits = staffPin.split('');
                                                while (digits.length < 4) digits.push('');
                                                digits[idx] = val ? val[val.length - 1] : '';
                                                const newPin = digits.join('').slice(0, 4);
                                                setStaffPin(newPin);
                                                if (val && idx < 3) {
                                                    document.getElementById(`staff-pin-${idx + 1}`)?.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !staffPin[idx] && idx > 0) {
                                                    document.getElementById(`staff-pin-${idx - 1}`)?.focus();
                                                }
                                            }}
                                            onPaste={(e) => {
                                                e.preventDefault();
                                                const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
                                                if (pasted) {
                                                    setStaffPin(pasted);
                                                    const focusIdx = Math.min(pasted.length, 3);
                                                    document.getElementById(`staff-pin-${focusIdx}`)?.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="login-remember-row">
                                <input
                                    type="checkbox"
                                    id="rememberStaff"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="login-remember-checkbox"
                                />
                                <label htmlFor="rememberStaff" className="login-remember-label">
                                    Remember register session
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="login-cta"
                            >
                                {loading ? 'Verifying Counter PIN...' : '🔓 Unlock Staff Counter'}
                            </button>
                        </form>
                    )}

                    {/* TAB 3: OWNER LOGIN */}
                    {authMode === 'OWNER' && (
                        <form onSubmit={handleOwnerLogin}>
                            <div className="login-form-group">
                                <label className="login-form-label">
                                    Owner Master PIN or Password
                                </label>
                                <div className="login-input-wrapper">
                                    <input
                                        type={showOwnerPass ? 'text' : 'password'}
                                        value={ownerPasscode}
                                        onChange={(e) => setOwnerPasscode(e.target.value)}
                                        placeholder="Enter owner master PIN or password"
                                        required
                                        className="login-input login-input-has-toggle"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOwnerPass(!showOwnerPass)}
                                        className="password-toggle-btn"
                                        aria-label={showOwnerPass ? 'Hide password' : 'Show password'}
                                    >
                                        {showOwnerPass ? '🙈' : '👁️'}
                                    </button>
                                </div>
                            </div>

                            <div className="login-remember-row">
                                <input
                                    type="checkbox"
                                    id="rememberOwner"
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="login-remember-checkbox"
                                />
                                <label htmlFor="rememberOwner" className="login-remember-label">
                                    Keep owner logged in
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="login-cta"
                            >
                                {loading ? 'Authenticating Store Owner...' : '👑 Enter Owner Portal'}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            {/* Modal: Protected Action for Visitors */}
            {showVisitorRestrictedModal && (
                <div
                    className="modal-overlay"
                    style={{
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
                    }}
                    onClick={() => setShowVisitorRestrictedModal(false)}
                >
                    <div
                        className="modal-card"
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: '#0f172a',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            borderRadius: '20px',
                            padding: '28px',
                            maxWidth: '400px',
                            width: '100%',
                            textAlign: 'center',
                            boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
                            color: '#f8fafc'
                        }}
                    >
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
