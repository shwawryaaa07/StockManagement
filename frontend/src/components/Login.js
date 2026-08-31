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
            backgroundColor: '#f8fafc',
            backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(245, 158, 11, 0.06) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(37, 99, 235, 0.05) 0%, transparent 40%)',
            padding: '36px 20px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1140px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: '40px',
                alignItems: 'center'
            }}>
                {/* LEFT HERO COLUMN: Subtle Light Store Showcase */}
                <div style={{ padding: '8px 12px' }}>
                    {/* Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '30px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: '700',
                        color: '#b45309',
                        marginBottom: '18px'
                    }}>
                        <span>✨</span> Cloud POS &amp; Inventory Management ERP
                    </div>

                    <h1 style={{
                        fontSize: '38px',
                        fontWeight: '900',
                        lineHeight: '1.2',
                        margin: '0 0 14px 0',
                        color: '#0f172a',
                        letterSpacing: '-0.5px'
                    }}>
                        MANISHA <span style={{
                            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>ELECTRONICS</span>
                    </h1>

                    <p style={{
                        fontSize: '15px',
                        color: '#64748b',
                        lineHeight: '1.6',
                        margin: '0 0 28px 0',
                        maxWidth: '480px'
                    }}>
                        Complete cloud retail solution powering smart billing, live multi-category stock control, WhatsApp tax invoices, and customer credit ledger tracking.
                    </p>

                    {/* Feature Highlights Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '14px',
                        marginBottom: '28px'
                    }}>
                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>⚡</div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>Instant POS Billing</div>
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Automated GST tax breakdown &amp; thermal invoice printing</div>
                        </div>

                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>📲</div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>WhatsApp Invoicing</div>
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>1-Click digital receipts sent directly to customer phones</div>
                        </div>

                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>📊</div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>Live Stock &amp; Dues</div>
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>Real-time inventory levels, low-stock alerts &amp; ledger</div>
                        </div>

                        <div style={{
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '14px',
                            padding: '16px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                        }}>
                            <div style={{ fontSize: '22px', marginBottom: '6px' }}>🛡️</div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e293b', marginBottom: '2px' }}>Role-Based Access</div>
                            <div style={{ fontSize: '11px', color: '#64748b', lineHeight: '1.4' }}>PIN-protected counters with owner master security</div>
                        </div>
                    </div>

                    {/* Trust Indicators (Location removed) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        fontSize: '12px',
                        color: '#64748b',
                        flexWrap: 'wrap'
                    }}>
                        <span>🔒 256-Bit SSL Encrypted</span>
                        <span>•</span>
                        <span>⚡ 100% Client Isolation</span>
                        <span>•</span>
                        <span>🛡️ Role-Protected POS</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive Login Card */}
                <div style={{
                    background: '#ffffff',
                    borderRadius: '24px',
                    padding: '36px 32px',
                    boxShadow: '0 12px 36px -8px rgba(0, 0, 0, 0.08), 0 4px 12px rgba(0, 0, 0, 0.04)',
                    color: '#0f172a',
                    border: '1px solid #e2e8f0'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '54px',
                            height: '54px',
                            margin: '0 auto 12px',
                            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '26px',
                            boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)'
                        }}>
                            🏪
                        </div>
                        <h2 style={{ fontSize: '20px', fontWeight: '900', margin: '0 0 4px 0', color: '#0f172a' }}>
                            Access Portal
                        </h2>
                        <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                            Select your portal role to authenticate
                        </p>
                    </div>

                    {/* 3-Tier Navigation Tabs */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr 1fr',
                        background: '#f1f5f9',
                        padding: '4px',
                        borderRadius: '12px',
                        marginBottom: '22px',
                        gap: '4px'
                    }}>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('VISITOR'); setErrorMsg(''); }}
                            style={{
                                border: 'none',
                                padding: '9px 4px',
                                borderRadius: '9px',
                                fontSize: '12px',
                                fontWeight: authMode === 'VISITOR' ? '800' : '600',
                                background: authMode === 'VISITOR' ? '#ffffff' : 'transparent',
                                color: authMode === 'VISITOR' ? '#d97706' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: authMode === 'VISITOR' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            🚀 Demo Sandbox
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('STAFF'); setErrorMsg(''); }}
                            style={{
                                border: 'none',
                                padding: '9px 4px',
                                borderRadius: '9px',
                                fontSize: '12px',
                                fontWeight: authMode === 'STAFF' ? '800' : '600',
                                background: authMode === 'STAFF' ? '#ffffff' : 'transparent',
                                color: authMode === 'STAFF' ? '#2563eb' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: authMode === 'STAFF' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            👤 Counter Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('OWNER'); setErrorMsg(''); }}
                            style={{
                                border: 'none',
                                padding: '9px 4px',
                                borderRadius: '9px',
                                fontSize: '12px',
                                fontWeight: authMode === 'OWNER' ? '800' : '600',
                                background: authMode === 'OWNER' ? '#ffffff' : 'transparent',
                                color: authMode === 'OWNER' ? '#d97706' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: authMode === 'OWNER' ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            👑 Store Owner
                        </button>
                    </div>

                    {/* Error Display */}
                    {errorMsg && (
                        <div style={{
                            background: '#fef2f2',
                            border: '1px solid #fecaca',
                            color: '#b91c1c',
                            padding: '10px 14px',
                            borderRadius: '10px',
                            fontSize: '13px',
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
                                background: '#fffbeb',
                                border: '1px solid #fef3c7',
                                borderRadius: '14px',
                                padding: '16px',
                                marginBottom: '22px',
                                textAlign: 'left'
                            }}>
                                <div style={{ fontWeight: '800', fontSize: '13px', color: '#92400e', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🚀</span> Recruiter &amp; Portfolio Guest Access
                                </div>
                                <p style={{ fontSize: '12px', color: '#78350f', margin: 0, lineHeight: '1.5' }}>
                                    Explore the live POS counter, create test invoices, check product inventory, and test WhatsApp receipts in an <strong>isolated sandbox environment</strong> with zero risk to production data.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleVisitorLogin}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                    Staff Counter Login ID
                                </label>
                                <input
                                    type="text"
                                    value={staffUsername}
                                    onChange={(e) => setStaffUsername(e.target.value)}
                                    placeholder="Enter your assigned login ID"
                                    required
                                    style={{
                                        width: '100%',
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
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
                                        padding: '11px 14px',
                                        borderRadius: '10px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        letterSpacing: '2px'
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
                                <label htmlFor="rememberStaff" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                                    Remember register session
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                    Owner Master PIN or Password
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type={showOwnerPass ? 'text' : 'password'}
                                        value={ownerPasscode}
                                        onChange={(e) => setOwnerPasscode(e.target.value)}
                                        placeholder="Enter 4-digit PIN or master password"
                                        required
                                        style={{
                                            width: '100%',
                                            padding: '11px 40px 11px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box'
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
                                            fontSize: '14px',
                                            color: '#64748b'
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
                                <label htmlFor="rememberOwner" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                                    Keep owner logged in
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: '#ffffff',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
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
