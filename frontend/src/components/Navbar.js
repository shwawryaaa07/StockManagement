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
                    <span className="tagline">★ Trusted Shop Since 2024</span>
                </div>
            </div>

            <div className="navbar-links">
                <NavLink to="/" className="nav-link" end>
                    <span className="icon">📊</span> Dashboard
                </NavLink>
                <NavLink to="/products" className="nav-link">
                    <span className="icon">📦</span> Products
                </NavLink>
                <NavLink to="/create-invoice" className="nav-link">
                    <span className="icon">🧾</span> New Invoice
                </NavLink>
                <NavLink to="/invoices" className="nav-link">
                    <span className="icon">📋</span> Invoices
                </NavLink>
                <NavLink to="/due-invoices" className="nav-link">
                    <span className="icon">🟡</span> Due
                </NavLink>

                {/* ✅ FIX 4: Dark Mode Toggle - Matching size */}
                <button
                    className="dark-toggle"
                    onClick={() => setDarkMode(!darkMode)}
                    title="Toggle Dark Mode"
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        color: '#fff',
                        padding: '8px 14px',
                        borderRadius: '5px',
                        fontSize: '16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    {darkMode ? '☀️' : '🌙'}
                </button>
            </div>
        </nav>
    );
}

export default Navbar;