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
                    fontWeight: '800',
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
                    fontWeight: '700',
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
                fontWeight: '700',
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: '6px'
            }}>
                🚀 DEMO SANDBOX
            </span>
        );
    };

    return (
        <>
            {/* Visitor Sandbox Top Notification Bar */}
            {isVisitor && (
                <div style={{
                    background: 'linear-gradient(90deg, #d97706, #b45309)',
                    color: '#ffffff',
                    padding: '6px 16px',
                    fontSize: '12px',
                    fontWeight: '700',
                    textAlign: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                }}>
                    <span>🚀</span>
                    <span>You are exploring in <strong>Portfolio Sandbox Mode</strong>. Feel free to create test bills &amp; explore all features!</span>
                </div>
            )}

            <nav className="navbar">
                <div className="navbar-left">
                    <span className="navbar-logo">🏪</span>
                    <div className="navbar-brand">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="main">
                                MANISHA <span className="gold">ELECTRONICS</span>
                            </span>
                            {getRoleBadge()}
                        </div>
                        <span className="tagline">★ Complete Electronics &amp; Home Appliances Store</span>
                    </div>
                </div>

                <div className="navbar-links">
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

                    <button
                        className="dark-toggle"
                        onClick={() => setDarkMode(!darkMode)}
                        title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        style={{
                            background: 'rgba(255,255,255,0.12)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#fff',
                            padding: '8px 14px',
                            borderRadius: '8px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
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
                            padding: '8px 12px',
                            borderRadius: '8px',
                            fontSize: '13px',
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
            </nav>
        </>
    );
}

export default Navbar;
