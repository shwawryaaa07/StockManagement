import React, { useState } from 'react';
import { loginAsOwner, loginAsStaff, loginAsVisitor } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const { login } = useAuth();
    const [authMode, setAuthMode] = useState('VISITOR'); // 'VISITOR', 'STAFF', 'OWNER'
    
    // Owner state
    const [ownerPasscode, setOwnerPasscode] = useState('');
    const [showOwnerPass, setShowOwnerPass] = useState(false);
    
    // Staff state
    const [staffUsername, setStaffUsername] = useState('staff1');
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
            }
        } catch (err) {
            setErrorMsg(err.response?.data?.message || '❌ Invalid Staff PIN. Default is 1234');
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
            backgroundColor: '#0f172a',
            padding: '24px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '480px',
                background: '#ffffff',
                borderRadius: '24px',
                padding: '36px 32px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                textAlign: 'center',
                color: '#0f172a'
            }}>
                {/* Shop Branding Header */}
                <div style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 16px',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    boxShadow: '0 10px 20px rgba(245, 158, 11, 0.3)'
                }}>
                    🏪
                </div>

                <h1 style={{ fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px', margin: '0 0 4px', color: '#0f172a' }}>
                    MANISHA <span style={{ color: '#d97706' }}>ELECTRONICS</span>
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '500', margin: '0 0 24px' }}>
                    Cloud Retail POS &amp; Enterprise Inventory ERP
                </p>

                {/* 3-Way Role Selector Tabs */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '6px',
                    background: '#f1f5f9',
                    padding: '5px',
                    borderRadius: '14px',
                    marginBottom: '24px'
                }}>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('VISITOR'); setErrorMsg(''); }}
                        style={{
                            padding: '10px 4px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: authMode === 'VISITOR' ? '#ffffff' : 'transparent',
                            color: authMode === 'VISITOR' ? '#d97706' : '#64748b',
                            boxShadow: authMode === 'VISITOR' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                        }}
                    >
                        🚀 Demo Sandbox
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('STAFF'); setErrorMsg(''); }}
                        style={{
                            padding: '10px 4px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: authMode === 'STAFF' ? '#ffffff' : 'transparent',
                            color: authMode === 'STAFF' ? '#0f172a' : '#64748b',
                            boxShadow: authMode === 'STAFF' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                        }}
                    >
                        👤 Counter Staff
                    </button>
                    <button
                        type="button"
                        onClick={() => { setAuthMode('OWNER'); setErrorMsg(''); }}
                        style={{
                            padding: '10px 4px',
                            fontSize: '12px',
                            fontWeight: '700',
                            borderRadius: '10px',
                            border: 'none',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            background: authMode === 'OWNER' ? '#ffffff' : 'transparent',
                            color: authMode === 'OWNER' ? '#0f172a' : '#64748b',
                            boxShadow: authMode === 'OWNER' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
                        }}
                    >
                        👑 Store Owner
                    </button>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div style={{
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        color: '#b91c1c',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        marginBottom: '20px',
                        textAlign: 'left'
                    }}>
                        {errorMsg}
                    </div>
                )}

                {/* MODE 1: VISITOR / DEMO SANDBOX */}
                {authMode === 'VISITOR' && (
                    <div style={{ textAlign: 'left' }}>
                        <div style={{
                            background: '#fffbeb',
                            border: '1px solid #fef3c7',
                            padding: '16px',
                            borderRadius: '14px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ fontSize: '14px', fontWeight: '800', color: '#b45309', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>🚀</span> Recruiter &amp; Portfolio Guest Access
                            </div>
                            <div style={{ fontSize: '12px', color: '#92400e', marginTop: '6px', lineHeight: '1.5' }}>
                                Explore the live POS counter, create test invoices, check product catalog, and test WhatsApp receipts in an <strong>isolated sandbox environment</strong> with zero risk to production data.
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleVisitorLogin}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '15px',
                                fontSize: '15px',
                                fontWeight: '800',
                                color: '#ffffff',
                                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? '⚡ Connecting to Sandbox...' : '✨ Enter Live Demo (1-Click)'}
                        </button>
                    </div>
                )}

                {/* MODE 2: COUNTER STAFF LOGIN */}
                {authMode === 'STAFF' && (
                    <form onSubmit={handleStaffLogin} style={{ textAlign: 'left' }}>
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                Staff Register / ID
                            </label>
                            <input
                                type="text"
                                value={staffUsername}
                                onChange={(e) => setStaffUsername(e.target.value)}
                                placeholder="Enter staff register ID"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                4-Digit Counter PIN
                            </label>
                            <input
                                type="password"
                                inputMode="numeric"
                                maxLength={6}
                                value={staffPin}
                                onChange={(e) => setStaffPin(e.target.value)}
                                placeholder="Enter 4-digit PIN"
                                style={{
                                    width: '100%',
                                    padding: '12px 14px',
                                    borderRadius: '10px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '14px',
                                    letterSpacing: '2px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '15px',
                                fontWeight: '800',
                                color: '#ffffff',
                                background: '#0f172a',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? '🔓 Unlocking Register...' : '✅ Open Counter Register'}
                        </button>
                    </form>
                )}

                {/* MODE 3: STORE OWNER LOGIN */}
                {authMode === 'OWNER' && (
                    <form onSubmit={handleOwnerLogin} style={{ textAlign: 'left' }}>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '6px' }}>
                                Owner Passcode or PIN
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showOwnerPass ? "text" : "password"}
                                    value={ownerPasscode}
                                    onChange={(e) => setOwnerPasscode(e.target.value)}
                                    placeholder="Enter Owner PIN or Password"
                                    style={{
                                        width: '100%',
                                        padding: '12px 42px 12px 14px',
                                        borderRadius: '10px',
                                        border: '1px solid #cbd5e1',
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
                                        fontSize: '16px',
                                        color: '#64748b'
                                    }}
                                >
                                    {showOwnerPass ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <input
                                type="checkbox"
                                id="ownerRemember"
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                style={{ cursor: 'pointer', accentColor: '#d97706' }}
                            />
                            <label htmlFor="ownerRemember" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                                Keep owner counter signed in (30 days)
                            </label>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '15px',
                                fontWeight: '800',
                                color: '#ffffff',
                                background: 'linear-gradient(135deg, #0f172a, #1e293b)',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {loading ? '👑 Authenticating Owner...' : '👑 Sign in as Store Owner'}
                        </button>
                    </form>
                )}

                {/* Footer Security Badge */}
                <div style={{
                    marginTop: '28px',
                    paddingTop: '16px',
                    borderTop: '1px solid #f1f5f9',
                    fontSize: '11px',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}>
                    <span>🛡️</span> 256-Bit SSL Encrypted • Rate-Limited Protection
                </div>
            </div>
        </div>
    );
}

export default Login;
