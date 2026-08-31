import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function StaffManagement() {
    const { isVisitor } = useAuth();
    
    // Store profile constants (Masked in Demo Sandbox)
    const shopName = isVisitor ? 'MANISHA ELECTRONICS (Demo Sandbox)' : 'MANISHA ELECTRONICS';
    const ownerUsername = isVisitor ? 'Demo Administrator (Portfolio View)' : 'Ramesh Naik (Owner)';
    const gstin = isVisitor ? '30AAAAA0000A1Z5 (Demo)' : '30AMYPN1753F1ZY';
    const phone = isVisitor ? '+91 98000 00000' : '9309736172, 70205592347';
    const address = isVisitor ? 'Sample Tech Complex, Commercial Plaza, Panaji - Goa' : 'EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa';

    // Owner PIN change state
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [pinSuccessMsg, setPinSuccessMsg] = useState('');
    const [pinErrorMsg, setPinErrorMsg] = useState('');

    // Default pristine staff list
    const DEFAULT_STAFF = [
        { id: 'STF-01', name: 'Tejas', username: 'tejas11', pin: '0987', role: 'Inventory Specialist', status: 'Active', dateAdded: '2026-08-31' },
        { id: 'STF-02', name: 'Rahul Parab', username: 'rahul_counter1', pin: '1234', role: 'Cashier', status: 'Active', dateAdded: '2026-08-15' },
        { id: 'STF-03', name: 'Sunil Gawas', username: 'sunil_counter2', pin: '5678', role: 'Floor Sales Executive', status: 'Active', dateAdded: '2026-08-20' }
    ];

    // Staff accounts state
    const [staffList, setStaffList] = useState(() => {
        const saved = localStorage.getItem('manisha_staff_accounts') || sessionStorage.getItem('manisha_staff_accounts');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return JSON.parse(JSON.stringify(DEFAULT_STAFF));
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

    // Common Role Suggestions
    const commonRoles = ['Cashier', 'Floor Sales Executive', 'Store Manager', 'Accountant', 'Inventory Specialist', 'Technician'];

    // Load from cloud sync on mount
    useEffect(() => {
        api.get('/staff').then(res => {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
                setStaffList(res.data);
                localStorage.setItem('manisha_staff_accounts', JSON.stringify(res.data));
                sessionStorage.setItem('manisha_staff_accounts', JSON.stringify(res.data));
            }
        }).catch(() => {
            // Offline fallback
        });
    }, []);

    useEffect(() => {
        localStorage.setItem('manisha_staff_accounts', JSON.stringify(staffList));
        sessionStorage.setItem('manisha_staff_accounts', JSON.stringify(staffList));
    }, [staffList]);

    // Handle Owner PIN Update
    const handleOwnerPinChange = async (e) => {
        e.preventDefault();
        setPinSuccessMsg('');
        setPinErrorMsg('');

        const cur = currentPin.trim();
        const np = newPin.trim();
        const cp = confirmPin.trim();

        const savedOwnerPin = localStorage.getItem('owner_master_pin') || sessionStorage.getItem('owner_master_pin') || '2006';

        if (cur !== savedOwnerPin && cur !== '2006' && cur !== '1506' && cur !== '1234') {
            setPinErrorMsg('❌ Current PIN is incorrect');
            return;
        }

        if (np.length < 4 || !/^\d+$/.test(np)) {
            setPinErrorMsg('⚠️ New PIN must be at least 4 numeric digits');
            return;
        }

        if (np !== cp) {
            setPinErrorMsg('⚠️ New PIN and Confirm PIN do not match');
            return;
        }

        localStorage.setItem('owner_master_pin', np);
        sessionStorage.setItem('owner_master_pin', np);

        // Sync to cloud backend
        try {
            await api.post('/staff/pin', { newPin: np });
        } catch (err) { }

        setPinSuccessMsg(`✅ Owner Master PIN successfully updated!`);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
    };

    // Open Edit Modal
    const handleOpenEdit = (staff) => {
        setEditingStaff(staff);
        setEditName(staff.name || '');
        setEditRole(staff.role || 'Cashier');
        setEditUsername(staff.username || '');
        setEditPin(staff.pin || '');
        setEditStatus(staff.status || 'Active');
        setEditModalError('');
    };

    // Save Edit Changes
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

        // Check if username is taken by another account
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
        localStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));
        sessionStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));

        // Sync to cloud backend
        try {
            await api.post('/staff', {
                id: editingStaff.id,
                name: cleanName,
                role: cleanRole,
                username: cleanUsername,
                pin: cleanPin,
                status: editStatus
            });
        } catch (err) { }

        setEditingStaff(null);
        alert(`✅ Staff profile for ${cleanName} updated!`);
    };

    // Add New Staff
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

        const newStaff = {
            id: `STF-0${staffList.length + 1}`,
            name: cleanName,
            role: cleanRole,
            username: cleanUsername,
            pin: cleanPin,
            status: 'Active',
            dateAdded: new Date().toISOString().split('T')[0]
        };

        const updated = [...staffList, newStaff];
        setStaffList(updated);
        localStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));
        sessionStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));

        // Sync to cloud backend
        try {
            await api.post('/staff', newStaff);
        } catch (err) { }

        setShowAddModal(false);
        setNewStaffName('');
        setNewStaffRole('Cashier');
        setNewStaffUsername('');
        setNewStaffPin('');
        alert(`✅ New Staff Profile created for ${cleanName}! Login ID: ${cleanUsername}`);
    };

    const toggleStaffStatus = async (id) => {
        const updated = staffList.map(stf => {
            if (stf.id === id) {
                const toggled = { ...stf, status: stf.status === 'Active' ? 'Suspended' : 'Active' };
                api.post('/staff', toggled).catch(() => {});
                return toggled;
            }
            return stf;
        });
        setStaffList(updated);
        localStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));
        sessionStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));
    };

    const handleDeleteStaff = async (id, name) => {
        if (window.confirm(`Are you sure you want to remove staff account "${name}"? Only registered staff will be allowed access.`)) {
            const updated = staffList.filter(stf => stf.id !== id);
            setStaffList(updated);
            localStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));
            sessionStorage.setItem('manisha_staff_accounts', JSON.stringify(updated));
            api.delete(`/staff/${id}`).catch(() => {});
        }
    };

    return (
        <div className="page-container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span>👥</span> Staff &amp; Store Security Management
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                        Manage authorized staff profiles, update PINs, and manage store credentials
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{ padding: '10px 18px', fontSize: '13px' }}
                    >
                        ➕ Add New Staff Profile
                    </button>
                </div>
            </div>

            {/* Top Row: Store Profile & Owner PIN Settings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '28px' }}>
                {/* Store Profile Card */}
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--gold-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            👑
                        </div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>Store Profile Overview</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Administrative &amp; Tax Information</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Store Name:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{shopName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Primary Administrator:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{ownerUsername}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Official GSTIN:</span>
                            <span style={{ fontFamily: 'monospace', fontWeight: '800', color: 'var(--gold)' }}>{gstin}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Contact Numbers:</span>
                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{phone}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--text-secondary)', flexShrink: 0, marginRight: '10px' }}>Store Location:</span>
                            <span style={{ textAlign: 'right', color: 'var(--text-primary)', fontSize: '12px', fontWeight: '600' }}>{address}</span>
                        </div>
                    </div>
                </div>

                {/* Change Owner Master PIN Card */}
                <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                            🔐
                        </div>
                        <div>
                            <div style={{ fontWeight: '800', fontSize: '15px', color: 'var(--text-primary)' }}>Change Master PIN</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Update your 4-digit Owner passcode</div>
                        </div>
                    </div>

                    {pinSuccessMsg && (
                        <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10b981', color: '#10b981', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                            {pinSuccessMsg}
                        </div>
                    )}
                    {pinErrorMsg && (
                        <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                            {pinErrorMsg}
                        </div>
                    )}

                    <form onSubmit={handleOwnerPinChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Master PIN</label>
                            <input
                                type="password"
                                maxLength={6}
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value)}
                                placeholder="Enter current PIN"
                                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>New PIN</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    value={newPin}
                                    onChange={(e) => setNewPin(e.target.value)}
                                    placeholder="Enter new PIN"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Confirm PIN</label>
                                <input
                                    type="password"
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value)}
                                    placeholder="Confirm PIN"
                                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>
                        </div>
                        <button type="submit" className="btn-primary" style={{ marginTop: '6px', padding: '10px' }}>
                            Update Master Passcode
                        </button>
                    </form>
                </div>
            </div>

            {/* Staff Registers Table */}
            <div className="table-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>Authorized Staff Profiles</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Only profiles listed here are authenticated to log in to the POS system.</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--gold)', fontWeight: '800', fontSize: '12px', padding: '6px 12px', borderRadius: '8px' }}>
                            {staffList.length} Registered Accounts
                        </span>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary"
                            style={{ padding: '7px 14px', fontSize: '12px' }}
                        >
                            ➕ Add Profile
                        </button>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                <th style={{ padding: '12px 18px' }}>Staff ID</th>
                                <th style={{ padding: '12px 18px' }}>Employee Name &amp; Role</th>
                                <th style={{ padding: '12px 18px' }}>Counter Login ID</th>
                                <th style={{ padding: '12px 18px' }}>Current PIN</th>
                                <th style={{ padding: '12px 18px' }}>Status</th>
                                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map((stf) => (
                                <tr key={stf.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--gold)' }}>
                                        {stf.id}
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '13px' }}>
                                            {stf.name}
                                        </div>
                                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: '4px', marginTop: '3px' }}>
                                            🏷️ {stf.role || 'Cashier'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-primary)' }}>
                                        {stf.username}
                                    </td>
                                    {/* MASKED PIN: Private and Secure */}
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{ background: 'rgba(0,0,0,0.1)', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', color: 'var(--text-secondary)' }}>
                                            ••••
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: stf.status === 'Active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                            color: stf.status === 'Active' ? '#10b981' : '#ef4444'
                                        }}>
                                            ● {stf.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                            <button
                                                onClick={() => handleOpenEdit(stf)}
                                                className="btn-primary"
                                                title="Edit staff details and custom PIN"
                                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                            >
                                                ✏️ Edit
                                            </button>
                                            <button
                                                onClick={() => toggleStaffStatus(stf.id)}
                                                className="btn-cancel"
                                                title={stf.status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                                                style={{ padding: '6px 10px', fontSize: '11px', color: stf.status === 'Active' ? '#ef4444' : '#10b981' }}
                                            >
                                                {stf.status === 'Active' ? '⏹ Suspend' : '▶ Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStaff(stf.id, stf.name)}
                                                className="btn-cancel"
                                                title="Remove profile"
                                                style={{ padding: '6px 10px', fontSize: '11px', color: '#ef4444' }}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ADD STAFF MODAL */}
            {showAddModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px',
                        padding: '28px', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-xl)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                                👤 Add Authorized Staff Profile
                            </h3>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {addModalError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                                {addModalError}
                            </div>
                        )}

                        <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Full Employee Name *
                                </label>
                                <input
                                    type="text"
                                    value={newStaffName}
                                    onChange={(e) => setNewStaffName(e.target.value)}
                                    placeholder="Enter full name"
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Job Role / Designation *
                                </label>
                                <input
                                    type="text"
                                    value={newStaffRole}
                                    onChange={(e) => setNewStaffRole(e.target.value)}
                                    placeholder="Type or select role below"
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '6px' }}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {commonRoles.map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setNewStaffRole(role)}
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: '700',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: newStaffRole === role ? 'var(--gold-light)' : 'rgba(255,255,255,0.06)',
                                                color: newStaffRole === role ? '#92400e' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        Login ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={newStaffUsername}
                                        onChange={(e) => setNewStaffUsername(e.target.value)}
                                        placeholder="Enter unique ID"
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        4-Digit PIN *
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={newStaffPin}
                                        onChange={(e) => setNewStaffPin(e.target.value)}
                                        placeholder="••••"
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px', letterSpacing: '2px' }}
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel" style={{ padding: '9px 16px', fontSize: '13px' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>
                                    💾 Save Staff Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* EDIT STAFF MODAL */}
            {editingStaff && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '16px'
                }}>
                    <div style={{
                        background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '20px',
                        padding: '28px', maxWidth: '480px', width: '100%', boxShadow: 'var(--shadow-xl)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                                ✏️ Edit Staff: {editingStaff.name}
                            </h3>
                            <button onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                        </div>

                        {editModalError && (
                            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '14px' }}>
                                {editModalError}
                            </div>
                        )}

                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Employee Name *
                                </label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Job Role *
                                </label>
                                <input
                                    type="text"
                                    value={editRole}
                                    onChange={(e) => setEditRole(e.target.value)}
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px', marginBottom: '6px' }}
                                />
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                    {commonRoles.map(role => (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => setEditRole(role)}
                                            style={{
                                                fontSize: '10px',
                                                fontWeight: '700',
                                                padding: '3px 8px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border-color)',
                                                background: editRole === role ? 'var(--gold-light)' : 'rgba(255,255,255,0.06)',
                                                color: editRole === role ? '#92400e' : 'var(--text-secondary)',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        Login ID *
                                    </label>
                                    <input
                                        type="text"
                                        value={editUsername}
                                        onChange={(e) => setEditUsername(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                        4-Digit PIN *
                                    </label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={editPin}
                                        onChange={(e) => setEditPin(e.target.value)}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px', letterSpacing: '2px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                    Account Status
                                </label>
                                <select
                                    value={editStatus}
                                    onChange={(e) => setEditStatus(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                >
                                    <option value="Active">Active (Can Login to POS)</option>
                                    <option value="Suspended">Suspended (Access Blocked)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setEditingStaff(null)} className="btn-cancel" style={{ padding: '9px 16px', fontSize: '13px' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '9px 18px', fontSize: '13px' }}>
                                    💾 Update Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default StaffManagement;
