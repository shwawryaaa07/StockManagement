import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

export function Navbar() {
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
          <Icon name="shield" size={14} />
          <span><strong>Demo Sandbox Mode</strong> &bull; Real store database is isolated.</span>
        </div>
      )}

      {/* TOP DESKTOP & MOBILE HEADER */}
      <nav className="navbar" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
        <div className="navbar-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center' }}>
            <Icon name="store" size={20} />
          </div>
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
            <Icon name="dashboard" size={16} /> Dashboard
          </NavLink>
          <NavLink to="/products" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name="products" size={16} /> Products
          </NavLink>
          <NavLink to="/create-invoice" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name="receipt" size={16} /> New Bill
          </NavLink>
          <NavLink to="/invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name="file-text" size={16} /> Invoices
          </NavLink>
          <NavLink to="/due-invoices" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
            <Icon name="alert-circle" size={16} /> Due Bills
          </NavLink>

          {/* Reports (Owner & Demo) */}
          {(isOwner || isVisitor) && (
            <NavLink to="/reports" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name="reports" size={16} /> Reports
            </NavLink>
          )}

          {/* Stock Purchases (Owner & Demo) */}
          {(isOwner || isVisitor) && (
            <NavLink to="/purchases" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name="truck" size={16} /> Stock-In
            </NavLink>
          )}

          {/* Staff & Store Settings */}
          {(isOwner || isVisitor) && (
            <NavLink to="/staff-management" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name="users" size={16} /> Staff &amp; Store
            </NavLink>
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
              gap: '6px',
              transition: 'all 0.2s ease',
              marginLeft: '4px'
            }}
          >
            <Icon name={darkMode ? 'sun' : 'moon'} size={14} />
            {darkMode ? 'Light' : 'Dark'}
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
              gap: '6px',
              transition: 'all 0.2s ease',
              marginLeft: '4px',
              flexShrink: 0
            }}
          >
            <Icon name="logout" size={14} /> Lock
          </button>
        </div>

        {/* Mobile Header Quick Actions (Top Right) */}
        <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setDarkMode(!darkMode)}
            title="Toggle dark mode"
            style={{
              background: 'rgba(255,255,255,0.12)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Icon name={darkMode ? 'sun' : 'moon'} size={15} />
          </button>

          <button
            type="button"
            onClick={logout}
            title="Lock / Sign Out"
            style={{
              background: 'rgba(239, 83, 80, 0.25)',
              border: '1px solid rgba(239, 83, 80, 0.4)',
              color: '#ffcdd2',
              padding: '6px 10px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Icon name="logout" size={14} /> Lock
          </button>
        </div>
      </nav>

      {/* CLEAN NATIVE MOBILE BOTTOM NAVIGATION BAR */}
      <div className="mobile-bottom-bar no-print">
        <NavLink to="/" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`} end>
          <span className="tab-icon"><Icon name="dashboard" size={18} /></span>
          <span className="tab-label">Dashboard</span>
        </NavLink>

        <NavLink to="/products" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon"><Icon name="products" size={18} /></span>
          <span className="tab-label">Products</span>
        </NavLink>

        <NavLink to="/create-invoice" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon"><Icon name="receipt" size={18} /></span>
          <span className="tab-label">New Bill</span>
        </NavLink>

        <NavLink to="/invoices" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
          <span className="tab-icon"><Icon name="file-text" size={18} /></span>
          <span className="tab-label">Invoices</span>
        </NavLink>

        {(isOwner || isVisitor) ? (
          <NavLink to="/reports" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
            <span className="tab-icon"><Icon name="reports" size={18} /></span>
            <span className="tab-label">Reports</span>
          </NavLink>
        ) : (
          <NavLink to="/due-invoices" className={({ isActive }) => `mobile-tab ${isActive ? 'active' : ''}`}>
            <span className="tab-icon"><Icon name="alert-circle" size={18} /></span>
            <span className="tab-label">Due Bills</span>
          </NavLink>
        )}
      </div>
    </>
  );
}

export default Navbar;
