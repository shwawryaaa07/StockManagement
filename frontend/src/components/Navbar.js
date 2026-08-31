import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { isVisitor, isOwner, isStaff, logout } = useAuth();
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    const getRoleBadge = () => {
        if (isOwner) {
            return (
                <span style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#000',
                    fontWeight: '900',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    letterSpacing: '0.5px'
                }}>
                    👑 OWNER
                </span>
            );
        }
        if (isStaff) {
            return (
                <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#93c5fd',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    fontWeight: '800',
                    fontSize: '11px',
                    padding: '3px 8px',
                    borderRadius: '6px'
                }}>
                    👤 STAFF
                </span>
            );
        }
        return (
            <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#6ee7b7',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                fontWeight: '800',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px'
            }}>
                🚀 DEMO
            </span>
        );
    };

    return (
        <>
            {/* Visitor Sandbox Top Banner */}
            {isVisitor && (
                <div style={{
                    background: 'linear-gradient(90deg, #d97706, #b45309)',
                    color: '#ffffff',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                }}>
                    <span>🚀</span>
                    <span><strong>Demo Sandbox Mode</strong> • Real store database is isolated.</span>
                </div>
            )}

            {/* TOP DESKTOP & MOBILE HEADER */}
            <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="navbar-logo" style={{ fontSize: '24px' }}>🏪</span>
                    <div className="navbar-brand">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="main" style={{ fontWeight: '900', letterSpacing: '-0.3px' }}>
                                MANISHA <span className="gold">ELECTRONICS</span>
                            </span>
                            {getRoleBadge()}
                        </div>
                        <span className="tagline desktop-only">★ Complete Electronics &amp; Home Appliances Store</span>
                    </div>
                </div>

                {/* Desktop Navigation Links */}
                <div className="navbar-links desktop-only">
                    <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} end>
                        <span className="icon">📊</span> Dashboard
                    </NavLink>
                    <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="icon">📦</span> Products
                    </NavLink>
                    <NavLink to="/create-invoice" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="icon">🧾</span> New Invoice
                    </NavLink>
                    <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="icon">📋</span> Invoices
                    </NavLink>
                    <NavLink to="/due-invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                        <span className="icon">🟡</span> Due Bills
                    </NavLink>

                    {/* Staff & Store Settings */}
                    {(isOwner || isVisitor) && (
                        <NavLink to="/staff-management" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                            <span className="icon">👥</span> Staff &amp; Accounts
                        </NavLink>
                    )}

                    {/* Desktop App Shortcut for Staff and Owner */}
                    {(isStaff || isOwner) && (
                        <button
                            type="button"
                            onClick={() => {
                                alert('💡 To install Manisha POS on your desktop:\n1. Click the ⊕ Install icon in your browser address bar (top right)\n2. Or click Menu (⋮) → "Install Manisha POS"');
                            }}
                            title="Install as native Windows desktop app"
                            style={{
                                background: 'rgba(245, 158, 11, 0.15)',
                                border: '1px solid rgba(245, 158, 11, 0.4)',
                                color: '#fbbf24',
                                padding: '7px 12px',
                                borderRadius: '8px',
                                fontSize: '12px',
                                fontWeight: '700',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px',
                                transition: 'all 0.2s ease',
                                marginLeft: '4px'
                            }}
                        >
                            📲 Install POS
                        </button>
                    )}

                    <button
                        className="dark-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            marginLeft: '4px'
                        }}
                    >
                        {darkMode ? '☀️ Light' : '🌙 Dark'}
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                        title="Lock Application / Sign Out"
                        style={{
                            background: 'rgba(239, 83, 80, 0.2)',
                            border: '1px solid rgba(239, 83, 80, 0.4)',
                            color: '#ffcdd2',
                            padding: '7px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            transition: 'all 0.2s ease',
                            marginLeft: '4px',
                            flexShrink: 0
                        }}
                    >
                        🔒 Lock
                    </button>
                </div>

                {/* Mobile Header Quick Actions (Top Right) */}
                <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setDarkMode(!darkMode)}
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer'
                        }}
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>

                    <button
                        type="button"
                        onClick={logout}
                        style={{
                            background: 'rgba(239, 83, 80, 0.25)',
                            border: '1px solid rgba(239, 83, 80, 0.4)',
                            color: '#ffcdd2',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '800',
                            cursor: 'pointer'
                        }}
                    >
                        🔒 Lock
                    </button>
                </div>
            </nav>

            {/* MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom for easy thumb access) */}
            <div className="mobile-bottom-bar no-print">
                <NavLink to="/" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`} end>
                    <span className="tab-icon">📊</span>
                    <span className="tab-label">Dashboard</span>
                </NavLink>

                <NavLink to="/products" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
                    <span className="tab-icon">📦</span>
                    <span className="tab-label">Products</span>
                </NavLink>

                {/* Primary Center Action: New POS Bill */}
                <NavLink to="/create-invoice" className="mobile-tab-pos">
                    <div className="pos-btn-inner">
                        <span style={{ fontSize: '18px' }}>🧾</span>
                        <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>POS Bill</span>
                    </div>
                </NavLink>

                <NavLink to="/invoices" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
                    <span className="tab-icon">📋</span>
                    <span className="tab-label">Invoices</span>
                </NavLink>

                {(isOwner || isVisitor) ? (
                    <NavLink to="/staff-management" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
                        <span className="tab-icon">👥</span>
                        <span className="tab-label">Staff</span>
                    </NavLink>
                ) : (
                    <NavLink to="/due-invoices" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
                        <span className="tab-icon">🟡</span>
                        <span className="tab-label">Dues</span>
                    </NavLink>
                )}
            </div>
        </>
    );
}

export default Navbar;
