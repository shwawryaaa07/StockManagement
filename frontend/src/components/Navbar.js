import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

function Navbar() {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true';
    });

    useEffect(() => {
        document.body.classList.toggle('dark-mode', darkMode);
        localStorage.setItem('darkMode', darkMode);
    }, [darkMode]);

    return (
        <nav className="navbar">
            <div className="navbar-left">
                <span className="navbar-logo">🏪</span>
                <div className="navbar-brand">
                    <span className="main">
                        MANISHA <span className="gold">ELECTRONICS</span>
                    </span>
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
                        fontSize: '15px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.2s ease',
                        marginLeft: '6px'
                    }}
                >
                    {darkMode ? '☀️ Light' : '🌙 Dark'}
                </button>
            </div>
        </nav>
    );
}

export default Navbar;
