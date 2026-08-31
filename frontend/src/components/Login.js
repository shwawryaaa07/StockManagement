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
            backgroundColor: '#f1f5f9',
            backgroundImage: `
                radial-gradient(at 10% 15%, rgba(245, 158, 11, 0.18) 0px, transparent 50%),
                radial-gradient(at 90% 10%, rgba(99, 102, 241, 0.18) 0px, transparent 50%),
                radial-gradient(at 85% 85%, rgba(16, 185, 129, 0.15) 0px, transparent 50%),
                radial-gradient(at 15% 85%, rgba(236, 72, 153, 0.12) 0px, transparent 50%),
                radial-gradient(at 50% 50%, rgba(59, 130, 246, 0.08) 0px, transparent 50%)
            `,
            padding: '36px 20px',
            fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
            boxSizing: 'border-box'
        }}>
            <div style={{
                width: '100%',
                maxWidth: '1160px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
                gap: '40px',
                alignItems: 'center'
            }}>
                {/* LEFT HERO COLUMN: Colorful & Brand-Rich Showcase */}
                <div style={{ padding: '8px 12px' }}>
                    {/* Header Badge */}
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                        border: '1px solid #f59e0b',
                        borderRadius: '30px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        fontWeight: '800',
                        color: '#92400e',
                        marginBottom: '18px',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                    }}>
                        <span>✨</span> Enterprise Cloud POS &amp; Inventory ERP
                    </div>

                    <h1 style={{
                        fontSize: '40px',
                        fontWeight: '900',
                        lineHeight: '1.15',
                        margin: '0 0 14px 0',
                        color: '#0f172a',
                        letterSpacing: '-0.5px'
                    }}>
                        MANISHA <span style={{
                            background: 'linear-gradient(135deg, #d97706 0%, #ea580c 50%, #b45309 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                        }}>ELECTRONICS</span>
                    </h1>

                    <p style={{
                        fontSize: '15px',
                        color: '#475569',
                        lineHeight: '1.6',
                        margin: '0 0 24px 0',
                        maxWidth: '490px'
                    }}>
                        Complete cloud retail management system powering smart billing, live multi-category stock control, WhatsApp invoice receipts, and customer credit ledger settlements.
                    </p>

                    {/* Quick Micro Feature Chips */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '28px' }}>
                        <span style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                            ⚡ Thermal &amp; GST POS
                        </span>
                        <span style={{ background: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                            📲 WhatsApp Invoicing
                        </span>
                        <span style={{ background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                            📊 Credit Dues Ledger
                        </span>
                        <span style={{ background: '#f3e8ff', color: '#6b21a8', border: '1px solid #e9d5ff', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '700' }}>
                            🔐 PIN Multi-Terminal
                        </span>
                    </div>

                    {/* 4 Colorful Themed Feature Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: '16px',
                        marginBottom: '28px'
                    }}>
                        {/* Card 1: POS Billing (Amber Glow) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #fffbeb 100%)',
                            border: '1.5px solid #fde68a',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(245, 158, 11, 0.08)',
                            transition: 'transform 0.15s ease'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: '#ffffff',
                                marginBottom: '10px',
                                boxShadow: '0 3px 10px rgba(245, 158, 11, 0.3)'
                            }}>
                                ⚡
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#92400e', marginBottom: '3px' }}>
                                Instant POS Billing
                            </div>
                            <div style={{ fontSize: '11px', color: '#78350f', lineHeight: '1.4' }}>
                                Automated GST tax computation &amp; thermal print receipts
                            </div>
                        </div>

                        {/* Card 2: WhatsApp Receipts (Emerald Glow) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%)',
                            border: '1.5px solid #a7f3d0',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
                            transition: 'transform 0.15s ease'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: '#ffffff',
                                marginBottom: '10px',
                                boxShadow: '0 3px 10px rgba(16, 185, 129, 0.3)'
                            }}>
                                📲
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#065f46', marginBottom: '3px' }}>
                                WhatsApp Invoicing
                            </div>
                            <div style={{ fontSize: '11px', color: '#047857', lineHeight: '1.4' }}>
                                1-Click direct digital bills sent straight to customer phones
                            </div>
                        </div>

                        {/* Card 3: Stock & Ledger (Royal Blue Glow) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #eff6ff 100%)',
                            border: '1.5px solid #bfdbfe',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(59, 130, 246, 0.08)',
                            transition: 'transform 0.15s ease'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: '#ffffff',
                                marginBottom: '10px',
                                boxShadow: '0 3px 10px rgba(59, 130, 246, 0.3)'
                            }}>
                                📊
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#1e40af', marginBottom: '3px' }}>
                                Live Stock &amp; Dues
                            </div>
                            <div style={{ fontSize: '11px', color: '#1e3a8a', lineHeight: '1.4' }}>
                                Real-time inventory levels, low-stock warnings &amp; ledger
                            </div>
                        </div>

                        {/* Card 4: Role-Based Access (Purple Glow) */}
                        <div style={{
                            background: 'linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)',
                            border: '1.5px solid #e9d5ff',
                            borderRadius: '16px',
                            padding: '16px',
                            boxShadow: '0 4px 14px rgba(139, 92, 246, 0.08)',
                            transition: 'transform 0.15s ease'
                        }}>
                            <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                color: '#ffffff',
                                marginBottom: '10px',
                                boxShadow: '0 3px 10px rgba(139, 92, 246, 0.3)'
                            }}>
                                🛡️
                            </div>
                            <div style={{ fontWeight: '800', fontSize: '13px', color: '#5b21b6', marginBottom: '3px' }}>
                                Role-Based Access
                            </div>
                            <div style={{ fontSize: '11px', color: '#4c1d95', lineHeight: '1.4' }}>
                                PIN-protected counters with owner master passcode
                            </div>
                        </div>
                    </div>

                    {/* Trust Indicators */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        fontSize: '12px',
                        color: '#64748b',
                        flexWrap: 'wrap',
                        fontWeight: '600'
                    }}>
                        <span>🔒 256-Bit SSL Encrypted</span>
                        <span>•</span>
                        <span>⚡ 100% Client Isolation</span>
                        <span>•</span>
                        <span>🛡️ Role-Protected POS</span>
                    </div>
                </div>

                {/* RIGHT COLUMN: Interactive Glassmorphism Auth Card */}
                <div style={{
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(16px)',
                    borderRadius: '26px',
                    padding: '36px 32px',
                    boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.1), 0 8px 20px rgba(0, 0, 0, 0.04)',
                    color: '#0f172a',
                    border: '1.5px solid rgba(255, 255, 255, 0.8)'
                }}>
                    <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            margin: '0 auto 12px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '28px',
                            boxShadow: '0 10px 22px rgba(245, 158, 11, 0.35)'
                        }}>
                            🏪
                        </div>
                        <h2 style={{ fontSize: '22px', fontWeight: '900', margin: '0 0 4px 0', color: '#0f172a' }}>
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
                        background: '#e2e8f0',
                        padding: '4px',
                        borderRadius: '14px',
                        marginBottom: '24px',
                        gap: '4px'
                    }}>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('VISITOR'); setErrorMsg(''); }}
                            style={{
                                padding: '10px 4px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: authMode === 'VISITOR' ? '800' : '600',
                                background: authMode === 'VISITOR' ? 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)' : 'transparent',
                                color: authMode === 'VISITOR' ? '#d97706' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: authMode === 'VISITOR' ? '0 3px 8px rgba(245, 158, 11, 0.15)' : 'none',
                                border: authMode === 'VISITOR' ? '1px solid #fde68a' : '1px solid transparent',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            🚀 Demo Sandbox
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('STAFF'); setErrorMsg(''); }}
                            style={{
                                padding: '10px 4px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: authMode === 'STAFF' ? '800' : '600',
                                background: authMode === 'STAFF' ? 'linear-gradient(135deg, #dbeafe 0%, #ffffff 100%)' : 'transparent',
                                color: authMode === 'STAFF' ? '#2563eb' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: authMode === 'STAFF' ? '0 3px 8px rgba(37, 99, 235, 0.15)' : 'none',
                                border: authMode === 'STAFF' ? '1px solid #bfdbfe' : '1px solid transparent',
                                transition: 'all 0.15s ease'
                            }}
                        >
                            👤 Counter Staff
                        </button>
                        <button
                            type="button"
                            onClick={() => { setAuthMode('OWNER'); setErrorMsg(''); }}
                            style={{
                                padding: '10px 4px',
                                borderRadius: '10px',
                                fontSize: '12px',
                                fontWeight: authMode === 'OWNER' ? '800' : '600',
                                background: authMode === 'OWNER' ? 'linear-gradient(135deg, #fef3c7 0%, #ffffff 100%)' : 'transparent',
                                color: authMode === 'OWNER' ? '#d97706' : '#64748b',
                                cursor: 'pointer',
                                boxShadow: authMode === 'OWNER' ? '0 3px 8px rgba(245, 158, 11, 0.15)' : 'none',
                                border: authMode === 'OWNER' ? '1px solid #fde68a' : '1px solid transparent',
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
                            padding: '11px 14px',
                            borderRadius: '12px',
                            fontSize: '13px',
                            fontWeight: '600',
                            marginBottom: '18px',
                            lineHeight: '1.4'
                        }}>
                            {errorMsg}
                        </div>
                    )}

                    {/* TAB 1: VISITOR DEMO */}
                    {authMode === 'VISITOR' && (
                        <div>
                            <div style={{
                                background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                                border: '1.5px solid #fde68a',
                                borderRadius: '16px',
                                padding: '18px',
                                marginBottom: '24px',
                                textAlign: 'left',
                                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.08)'
                            }}>
                                <div style={{ fontWeight: '900', fontSize: '14px', color: '#92400e', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <span>🚀</span> Recruiter &amp; Portfolio Guest Access
                                </div>
                                <p style={{ fontSize: '12px', color: '#78350f', margin: 0, lineHeight: '1.55' }}>
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
                                    borderRadius: '14px',
                                    fontSize: '15px',
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
                            <div style={{ marginBottom: '14px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        background: '#f8fafc'
                                    }}
                                />
                            </div>

                            <div style={{ marginBottom: '16px', textAlign: 'left' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                                        padding: '12px 14px',
                                        borderRadius: '12px',
                                        border: '1.5px solid #cbd5e1',
                                        fontSize: '14px',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        letterSpacing: '2px',
                                        background: '#f8fafc'
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
                                <label htmlFor="rememberStaff" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}>
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
                                    borderRadius: '14px',
                                    fontSize: '15px',
                                    fontWeight: '800',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    boxShadow: '0 6px 18px rgba(37, 99, 235, 0.35)',
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
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
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
                                            padding: '12px 42px 12px 14px',
                                            borderRadius: '12px',
                                            border: '1.5px solid #cbd5e1',
                                            fontSize: '14px',
                                            outline: 'none',
                                            boxSizing: 'border-box',
                                            background: '#f8fafc'
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
                                <label htmlFor="rememberOwner" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer', fontWeight: '500' }}>
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
                                    borderRadius: '14px',
                                    fontSize: '15px',
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
        </div>
    );
}

export default Login;
