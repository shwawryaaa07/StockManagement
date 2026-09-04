import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { getStoreProfile } from '../services/storeProfile';
import StoreProfileCard from './StoreProfileCard';
import OwnerPinChange from './OwnerPinChange';
import Icon from './Icon';
import usePageTitle from '../utils/usePageTitle';

const DEMO_STAFF_ACCOUNTS = [
  { id: 'DEMO-01', name: 'Demo Cashier 1', username: 'demo_counter1', pin: '1234', role: 'Cashier', status: 'Active', dateAdded: '2026-09-01' },
  { id: 'DEMO-02', name: 'Demo Sales Specialist', username: 'demo_sales', pin: '5678', role: 'Floor Sales Executive', status: 'Active', dateAdded: '2026-09-01' }
];

const COMMON_ROLES = ['Cashier', 'Floor Sales Executive', 'Store Manager', 'Accountant', 'Inventory Specialist', 'Technician'];

export const StaffManagement = () => {
  usePageTitle('Staff & Store Access');
  const { isVisitor } = useAuth();
  const toast = useToast();

  const [storeProfile, setStoreProfile] = useState(() => getStoreProfile(isVisitor));
  const [staffList, setStaffList] = useState(() => {
    if (isVisitor) {
      return JSON.parse(JSON.stringify(DEMO_STAFF_ACCOUNTS));
    }
    return [];
  });

  // Add Staff Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffRole, setNewStaffRole] = useState('Cashier');
  const [newStaffUsername, setNewStaffUsername] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [addModalError, setAddModalError] = useState('');

  // Edit Staff Modal State
  const [editingStaff, setEditingStaff] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('Cashier');
  const [editUsername, setEditUsername] = useState('');
  const [editPin, setEditPin] = useState('');
  const [editStatus, setEditStatus] = useState('Active');
  const [editModalError, setEditModalError] = useState('');

  // Load staff and store profile on mount
  useEffect(() => {
    if (isVisitor) {
      setStaffList(JSON.parse(JSON.stringify(DEMO_STAFF_ACCOUNTS)));
      setStoreProfile(getStoreProfile(true));
      return;
    }

    localStorage.removeItem('manisha_staff_accounts');
    sessionStorage.removeItem('manisha_staff_accounts');

    // 1. Fetch Real Staff List from Backend
    api.get('/staff').then(res => {
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setStaffList(res.data);
      }
    }).catch(() => {});

    // 2. Fetch Store Profile from Backend
    api.get('/staff/store-profile').then(res => {
      if (res.data && res.data.shopName) {
        setStoreProfile(res.data);
      }
    }).catch(() => {});
  }, [isVisitor]);

  const handleOpenEdit = (staff) => {
    setEditingStaff(staff);
    setEditName(staff.name || '');
    setEditRole(staff.role || 'Cashier');
    setEditUsername(staff.username || '');
    setEditPin(staff.pin || '');
    setEditStatus(staff.status || 'Active');
    setEditModalError('');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setEditModalError('');

    const cleanName = editName.trim();
    const cleanRole = editRole.trim();
    const cleanUsername = editUsername.trim().toLowerCase();
    const cleanPin = editPin.trim();

    if (!cleanName || !cleanUsername || !cleanPin || !cleanRole) {
      setEditModalError('⚠️ Please fill all required fields');
      return;
    }

    if (cleanPin.length < 4 || !/^\d+$/.test(cleanPin)) {
      setEditModalError('⚠️ Staff PIN must be a 4-digit number');
      return;
    }

    const duplicate = staffList.some(stf => stf.id !== editingStaff.id && stf.username.toLowerCase() === cleanUsername);
    if (duplicate) {
      setEditModalError(`⚠️ Login ID "${cleanUsername}" is already in use by another staff profile.`);
      return;
    }

    const updated = staffList.map(stf => {
      if (stf.id === editingStaff.id) {
        return {
          ...stf,
          name: cleanName,
          role: cleanRole,
          username: cleanUsername,
          pin: cleanPin,
          status: editStatus
        };
      }
      return stf;
    });

    setStaffList(updated);

    if (!isVisitor) {
      try {
        await api.post('/staff', {
          id: editingStaff.id,
          name: cleanName,
          role: cleanRole,
          username: cleanUsername,
          pin: cleanPin,
          status: editStatus
        });
      } catch (err) {}
    }

    setEditingStaff(null);
    toast.success(`Staff profile for ${cleanName} updated!`);
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    setAddModalError('');

    const cleanName = newStaffName.trim();
    const cleanRole = newStaffRole.trim();
    const cleanUsername = newStaffUsername.trim().toLowerCase();
    const cleanPin = newStaffPin.trim();

    if (!cleanName || !cleanUsername || !cleanPin || !cleanRole) {
      setAddModalError('⚠️ Please fill all required fields');
      return;
    }

    if (cleanPin.length < 4 || !/^\d+$/.test(cleanPin)) {
      setAddModalError('⚠️ Staff PIN must be a 4-digit number');
      return;
    }

    const exists = staffList.some(stf => stf.username.toLowerCase() === cleanUsername);
    if (exists) {
      setAddModalError(`⚠️ Login ID "${cleanUsername}" is already in use. Please choose a unique ID.`);
      return;
    }

    const prefix = isVisitor ? 'DEMO-0' : 'STF-0';
    const newStaff = {
      id: `${prefix}${staffList.length + 1}`,
      name: cleanName,
      role: cleanRole,
      username: cleanUsername,
      pin: cleanPin,
      status: 'Active',
      dateAdded: new Date().toISOString().split('T')[0]
    };

    const updated = [...staffList, newStaff];
    setStaffList(updated);

    if (!isVisitor) {
      try {
        await api.post('/staff', newStaff);
      } catch (err) {}
    }

    setShowAddModal(false);
    setNewStaffName('');
    setNewStaffRole('Cashier');
    setNewStaffUsername('');
    setNewStaffPin('');
    toast.success(`New Staff Profile created for ${cleanName}!`);
  };

  const toggleStaffStatus = async (id) => {
    const updated = staffList.map(stf => {
      if (stf.id === id) {
        const toggled = { ...stf, status: stf.status === 'Active' ? 'Suspended' : 'Active' };
        if (!isVisitor) {
          api.post('/staff', toggled).catch(() => {});
        }
        return toggled;
      }
      return stf;
    });
    setStaffList(updated);
  };

  const handleDeleteStaff = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove staff account "${name}"? Only registered staff will be allowed access.`)) {
      const updated = staffList.filter(stf => stf.id !== id);
      setStaffList(updated);

      if (!isVisitor) {
        try {
          await api.delete(`/staff/${id}`);
        } catch (err) {}
      }
    }
  };

  return (
    <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="bg-primary-subtle text-primary" style={{ padding: '10px', borderRadius: '12px' }}>
            <Icon name="staff" size={26} />
          </div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
              Staff Profiles &amp; Access Control
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Manage authorized staff profiles, update PINs, and manage store credentials
            </p>
          </div>
        </div>
      </div>

      {/* Sandbox Notice for Visitors */}
      {isVisitor && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.1)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          fontSize: '13px',
          color: '#60a5fa',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Icon name="shield" size={18} />
          <span><strong>100% Isolated Demo Sandbox:</strong> Real store accounts, employee records, and business numbers are masked and hidden. Any edits here are strictly ephemeral for this browser session.</span>
        </div>
      )}

      {/* Top Cards: Store Overview & Change Master PIN */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        <StoreProfileCard
          storeProfile={storeProfile}
          setStoreProfile={setStoreProfile}
          isVisitor={isVisitor}
        />
        <OwnerPinChange isVisitor={isVisitor} />
      </div>

      {/* Staff Profiles Table Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-primary)' }}>
            Authorized Staff Profiles
          </h2>
          <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
            Only profiles listed here are authenticated to log in to the POS system.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            {staffList.length} Registered Accounts
          </span>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="plus" size={16} /> Add Profile
          </button>
        </div>
      </div>

      {/* Staff Accounts Table */}
      <div className="table-card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-surface)' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>STAFF ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>EMPLOYEE NAME &amp; ROLE</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)' }}>COUNTER LOGIN ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>CURRENT PIN</th>
              <th style={{ padding: '12px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>STATUS</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--text-secondary)' }}>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {staffList.length === 0 ? (
              <tr>
                <td colSpan="6" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  No staff accounts configured. Click "+ Add Profile" to create one.
                </td>
              </tr>
            ) : (
              staffList.map((stf) => (
                <tr key={stf.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '800', color: 'var(--gold)' }}>
                    {stf.id}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{stf.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Icon name="user-check" size={12} /> {stf.role || 'Cashier'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {stf.username}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontFamily: 'monospace',
                      letterSpacing: '2px',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      ••••
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '20px',
                      fontSize: '11px',
                      fontWeight: '700',
                      background: stf.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: stf.status === 'Active' ? '#10b981' : '#ef4444'
                    }}>
                      ● {stf.status || 'Active'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        onClick={() => handleOpenEdit(stf)}
                        className="btn-cancel"
                        style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px', background: 'var(--gold)', color: '#0f172a', border: 'none', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Icon name="edit" size={12} /> Edit
                      </button>
                      <button
                        onClick={() => toggleStaffStatus(stf.id)}
                        className="btn-cancel"
                        style={{ padding: '5px 10px', fontSize: '11px', borderRadius: '6px', color: stf.status === 'Active' ? '#ef4444' : '#10b981' }}
                      >
                        {stf.status === 'Active' ? 'Suspend' : 'Activate'}
                      </button>
                      <button
                        onClick={() => handleDeleteStaff(stf.id, stf.name)}
                        className="btn-cancel"
                        style={{ padding: '5px 8px', fontSize: '11px', borderRadius: '6px', color: '#ef4444' }}
                        title="Delete Account"
                      >
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '460px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 20px',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="plus-circle" size={20} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Add New Staff Profile
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="Enter staff full name"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Assigned Store Role *
                </label>
                <select
                  className="form-input"
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value)}
                  style={{ width: '100%', boxSizing: 'border-box' }}
                >
                  {COMMON_ROLES.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Login ID *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={newStaffUsername}
                    onChange={(e) => setNewStaffUsername(e.target.value)}
                    placeholder="Enter staff login username"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    maxLength="4"
                    inputMode="numeric"
                    className="form-input"
                    value={newStaffPin}
                    onChange={(e) => setNewStaffPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {addModalError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>{addModalError}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-cancel"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Icon name="check" size={16} /> Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Modal */}
      {editingStaff && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100000,
          padding: '20px'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '460px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 20px',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon name="edit" size={20} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Edit Staff Profile ({editingStaff.name})
                </h3>
              </div>
              <button
                onClick={() => setEditingStaff(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Staff Full Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Enter staff full name"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Assigned Role *
                  </label>
                  <select
                    className="form-input"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {COMMON_ROLES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Account Status *
                  </label>
                  <select
                    className="form-input"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Login ID *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Enter staff login username"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    4-Digit PIN *
                  </label>
                  <input
                    type="password"
                    maxLength="4"
                    inputMode="numeric"
                    className="form-input"
                    value={editPin}
                    onChange={(e) => setEditPin(e.target.value)}
                    placeholder="Enter 4-digit PIN"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              {editModalError && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>{editModalError}</div>}

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingStaff(null)}
                  className="btn-cancel"
                  style={{ flex: 1, padding: '10px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Icon name="check" size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
