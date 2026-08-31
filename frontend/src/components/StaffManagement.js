import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

function StaffManagement() {
    const { isOwner, isVisitor } = useAuth();
    
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

    // Staff accounts state
    const [staffList, setStaffList] = useState(() => {
        const saved = localStorage.getItem('manisha_staff_accounts');
        if (saved) {
            try { return JSON.parse(saved); } catch (e) { }
        }
        return [
            { id: 'STF-01', name: 'Rahul Parab', username: 'rahul_counter1', pin: '1234', counter: 'Counter 1 (Main POS)', role: 'Cashier', status: 'Active', dateAdded: '2026-08-15' },
            { id: 'STF-02', name: 'Sunil Gawas', username: 'sunil_counter2', pin: '5678', counter: 'Counter 2 (Appliances)', role: 'Floor Sales Executive', status: 'Active', dateAdded: '2026-08-20' }
        ];
    });

    // Add Staff Modal State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newStaffName, setNewStaffName] = useState('');
    const [newStaffRole, setNewStaffRole] = useState('Cashier');
    const [newStaffUsername, setNewStaffUsername] = useState('');
    const [newStaffPin, setNewStaffPin] = useState('');
    const [newStaffCounter, setNewStaffCounter] = useState('Counter 1 (Main POS)');
    const [addModalError, setAddModalError] = useState('');

    // Edit Staff Modal State
    const [editingStaff, setEditingStaff] = useState(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('Cashier');
    const [editUsername, setEditUsername] = useState('');
    const [editPin, setEditPin] = useState('');
    const [editCounter, setEditCounter] = useState('Counter 1 (Main POS)');
    const [editStatus, setEditStatus] = useState('Active');
    const [editModalError, setEditModalError] = useState('');

    useEffect(() => {
        localStorage.setItem('manisha_staff_accounts', JSON.stringify(staffList));
    }, [staffList]);

    // Handle Owner PIN Update
    const handleOwnerPinChange = (e) => {
        e.preventDefault();
        setPinSuccessMsg('');
        setPinErrorMsg('');

        const savedOwnerPin = localStorage.getItem('owner_master_pin') || '1234';

        if (currentPin !== savedOwnerPin && currentPin !== '1506') {
            setPinErrorMsg('❌ Current PIN is incorrect');
            return;
        }

        if (newPin.length < 4 || !/^\d+$/.test(newPin)) {
            setPinErrorMsg('⚠️ New PIN must be at least 4 numeric digits');
            return;
        }

        if (newPin !== confirmPin) {
            setPinErrorMsg('⚠️ New PIN and Confirm PIN do not match');
            return;
        }

        localStorage.setItem('owner_master_pin', newPin);
        setPinSuccessMsg('✅ Owner Master PIN successfully updated');
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
        setEditCounter(staff.counter || 'Counter 1 (Main POS)');
        setEditStatus(staff.status || 'Active');
        setEditModalError('');
    };

    // Save Edited Staff
    const handleSaveEdit = (e) => {
        e.preventDefault();
        setEditModalError('');

        if (!editName.trim() || !editUsername.trim() || !editPin.trim()) {
            setEditModalError('⚠️ Please fill all required fields');
            return;
        }

        if (editPin.length < 4 || !/^\d+$/.test(editPin)) {
            setEditModalError('⚠️ Staff PIN must be at least 4 numeric digits');
            return;
        }

        const cleanUsername = editUsername.trim().toLowerCase();

        // Check unique username among other staff
        const duplicate = staffList.some(stf => stf.id !== editingStaff.id && stf.username.toLowerCase() === cleanUsername);
        if (duplicate) {
            setEditModalError(`⚠️ Login ID "${cleanUsername}" is already assigned to another staff member.`);
            return;
        }

        const updated = staffList.map(stf => {
            if (stf.id === editingStaff.id) {
                return {
                    ...stf,
                    name: editName.trim(),
                    role: editRole,
                    username: cleanUsername,
                    pin: editPin.trim(),
                    counter: editCounter,
                    status: editStatus
                };
            }
            return stf;
        });

        setStaffList(updated);
        setEditingStaff(null);
    };

    // Add New Staff
    const handleAddStaff = (e) => {
        e.preventDefault();
        setAddModalError('');

        if (!newStaffName.trim() || !newStaffUsername.trim() || !newStaffPin.trim()) {
            setAddModalError('⚠️ Please fill all required fields');
            return;
        }

        if (newStaffPin.length < 4 || !/^\d+$/.test(newStaffPin)) {
            setAddModalError('⚠️ Staff PIN must be a 4-digit number');
            return;
        }

        const cleanUsername = newStaffUsername.trim().toLowerCase();

        // Check if username already exists
        const exists = staffList.some(stf => stf.username.toLowerCase() === cleanUsername);
        if (exists) {
            setAddModalError(`⚠️ Login ID "${cleanUsername}" is already in use. Please choose a unique ID.`);
            return;
        }

        const newStaff = {
            id: `STF-0${staffList.length + 1}`,
            name: newStaffName.trim(),
            role: newStaffRole,
            username: cleanUsername,
            pin: newStaffPin.trim(),
            counter: newStaffCounter,
            status: 'Active',
            dateAdded: new Date().toISOString().split('T')[0]
        };

        setStaffList([...staffList, newStaff]);
        setShowAddModal(false);
        setNewStaffName('');
        setNewStaffRole('Cashier');
        setNewStaffUsername('');
        setNewStaffPin('');
    };

    const toggleStaffStatus = (id) => {
        setStaffList(staffList.map(stf => {
            if (stf.id === id) {
                return { ...stf, status: stf.status === 'Active' ? 'Suspended' : 'Active' };
            }
            return stf;
        }));
    };

    const handleDeleteStaff = (id, name) => {
        if (window.confirm(`Are you sure you want to remove staff account "${name}"? Only registered staff will be allowed access.`)) {
            setStaffList(staffList.filter(stf => stf.id !== id));
        }
    };

    const handleResetStaffPin = (id, name) => {
        const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
        setStaffList(staffList.map(stf => {
            if (stf.id === id) {
                return { ...stf, pin: generatedPin };
            }
            return stf;
        }));
        alert(`✅ New 4-Digit PIN for ${name}: ${generatedPin}`);
    };

    return (
        <div className="page-container" style={{ paddingBottom: '60px' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div>
                    <h1 style={{ fontSize: '24px', fontWeight: '900', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>👥</span> Staff &amp; Store Security Management
                    </h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                        Manage authorized staff profiles, update custom PINs, and enforce role-based register access
                    </p>
                </div>

                {(isOwner || isVisitor) && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="btn-primary"
                        style={{ padding: '10px 20px', fontSize: '14px', fontWeight: '800' }}
                    >
                        ➕ Add New Staff Profile
                    </button>
                )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* 1. Owner Store Profile Card */}
                <div className="dashboard-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                            👑
                        </div>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-primary)' }}>Store Profile Overview</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administrative &amp; Tax Information</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Store Name:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{shopName}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Primary Administrator:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{ownerUsername}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Official GSTIN:</span>
                            <strong style={{ color: '#d97706' }}>{gstin}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Contact Numbers:</span>
                            <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '4px' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Store Location:</span>
                            <span style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '200px' }}>{address}</span>
                        </div>
                    </div>
                </div>

                {/* 2. Change Owner Master PIN */}
                <div className="dashboard-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                            🔐
                        </div>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: '16px', color: 'var(--text-primary)' }}>Change Master PIN</div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Update your 4-digit Owner passcode</div>
                        </div>
                    </div>

                    {pinSuccessMsg && (
                        <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                            {pinSuccessMsg}
                        </div>
                    )}
                    {pinErrorMsg && (
                        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                            {pinErrorMsg}
                        </div>
                    )}

                    <form onSubmit={handleOwnerPinChange} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Current Master PIN</label>
                            <input
                                type="password"
                                maxLength={6}
                                value={currentPin}
                                onChange={(e) => setCurrentPin(e.target.value)}
                                placeholder={isVisitor ? "Enter current PIN (1234)" : "Enter current PIN"}
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
                                    placeholder="New 4-digit PIN"
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
                        <div style={{ fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>Authorized Staff Profiles &amp; Counter Registers</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Only profiles listed here are authenticated to log in to the POS registers.</div>
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-body)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                                <th style={{ padding: '12px 18px' }}>Staff ID</th>
                                <th style={{ padding: '12px 18px' }}>Employee Name &amp; Role</th>
                                <th style={{ padding: '12px 18px' }}>Counter Login ID</th>
                                <th style={{ padding: '12px 18px' }}>Assigned Register</th>
                                <th style={{ padding: '12px 18px' }}>Current PIN</th>
                                <th style={{ padding: '12px 18px' }}>Status</th>
                                <th style={{ padding: '12px 18px', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {staffList.map((stf) => (
                                <tr key={stf.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '14px 18px', fontWeight: '800', color: 'var(--gold)' }}>{stf.id}</td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <div style={{ fontWeight: '800', color: 'var(--text-primary)' }}>{stf.name}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--primary-accent)', fontWeight: '600', marginTop: '2px' }}>
                                            🏷️ {stf.role || 'Staff Cashier'}
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 18px', fontFamily: 'monospace', fontWeight: '700', color: 'var(--text-primary)' }}>
                                        {stf.username}
                                    </td>
                                    <td style={{ padding: '14px 18px', color: 'var(--text-primary)' }}>{stf.counter}</td>
                                    <td style={{ padding: '14px 18px' }}>
                                        <span style={{ background: 'rgba(0,0,0,0.1)', padding: '3px 8px', borderRadius: '6px', fontFamily: 'monospace', fontWeight: '800', letterSpacing: '1px' }}>
                                            •••• ({stf.pin})
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
                                                onClick={() => handleResetStaffPin(stf.id, stf.name)}
                                                className="btn-cancel"
                                                title="Quick Auto-Generate PIN"
                                                style={{ padding: '6px 12px', fontSize: '11px' }}
                                            >
                                                🔑 Quick PIN
                                            </button>
                                            <button
                                                onClick={() => toggleStaffStatus(stf.id)}
                                                className="btn-cancel"
                                                style={{ padding: '6px 12px', fontSize: '11px', color: stf.status === 'Active' ? '#ef4444' : '#10b981' }}
                                            >
                                                {stf.status === 'Active' ? '⏸️ Suspend' : '▶️ Activate'}
                                            </button>
                                            <button
                                                onClick={() => handleDeleteStaff(stf.id, stf.name)}
                                                className="btn-delete"
                                                style={{ padding: '6px 10px', fontSize: '11px' }}
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

            {/* Modal 1: Edit Staff Profile & Custom PIN */}
            {editingStaff && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '20px',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '460px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' }}>
                                ✏️ Edit Staff Profile &amp; PIN
                            </div>
                            <button onClick={() => setEditingStaff(null)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                ✕
                            </button>
                        </div>

                        {editModalError && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                                {editModalError}
                            </div>
                        )}

                        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Staff Full Name *</label>
                                    <input
                                        type="text"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Full name"
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Job Role</label>
                                    <select
                                        value={editRole}
                                        onChange={(e) => setEditRole(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    >
                                        <option value="Cashier">Cashier</option>
                                        <option value="Floor Sales Executive">Floor Sales Executive</option>
                                        <option value="Store Manager">Store Manager</option>
                                        <option value="Inventory Specialist">Inventory Specialist</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Counter Login ID * (Must be Unique)</label>
                                <input
                                    type="text"
                                    value={editUsername}
                                    onChange={(e) => setEditUsername(e.target.value)}
                                    placeholder="Login username"
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>4-Digit Counter PIN *</label>
                                    <input
                                        type="text"
                                        maxLength={6}
                                        value={editPin}
                                        onChange={(e) => setEditPin(e.target.value)}
                                        placeholder="Enter PIN"
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '700' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Account Status</label>
                                    <select
                                        value={editStatus}
                                        onChange={(e) => setEditStatus(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Suspended">Suspended</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Assigned Register</label>
                                <select
                                    value={editCounter}
                                    onChange={(e) => setEditCounter(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                >
                                    <option value="Counter 1 (Main POS)">Counter 1 (Main POS)</option>
                                    <option value="Counter 2 (Appliances)">Counter 2 (Appliances)</option>
                                    <option value="Floor Sales Mobile">Floor Sales Mobile</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setEditingStaff(null)} className="btn-cancel" style={{ padding: '10px 16px' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal 2: Add New Staff Profile */}
            {showAddModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(4px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: '16px'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '20px',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '460px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <div style={{ fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' }}>
                                ➕ Add New Staff Profile
                            </div>
                            <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                ✕
                            </button>
                        </div>

                        {addModalError && (
                            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: '700', marginBottom: '14px' }}>
                                {addModalError}
                            </div>
                        )}

                        <form onSubmit={handleAddStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Staff Full Name *</label>
                                    <input
                                        type="text"
                                        value={newStaffName}
                                        onChange={(e) => setNewStaffName(e.target.value)}
                                        placeholder={isVisitor ? "e.g. Rahul Parab" : "Staff full name"}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Job Role</label>
                                    <select
                                        value={newStaffRole}
                                        onChange={(e) => setNewStaffRole(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    >
                                        <option value="Cashier">Cashier</option>
                                        <option value="Floor Sales Executive">Floor Sales Executive</option>
                                        <option value="Store Manager">Store Manager</option>
                                        <option value="Inventory Specialist">Inventory Specialist</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Staff Counter Login ID *</label>
                                <input
                                    type="text"
                                    value={newStaffUsername}
                                    onChange={(e) => setNewStaffUsername(e.target.value)}
                                    placeholder={isVisitor ? "e.g. rahul_counter1" : "Unique login ID"}
                                    required
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>4-Digit Counter PIN *</label>
                                    <input
                                        type="password"
                                        maxLength={6}
                                        value={newStaffPin}
                                        onChange={(e) => setNewStaffPin(e.target.value)}
                                        placeholder={isVisitor ? "e.g. 4321" : "4-digit PIN"}
                                        required
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>Counter Register</label>
                                    <select
                                        value={newStaffCounter}
                                        onChange={(e) => setNewStaffCounter(e.target.value)}
                                        style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-body)', color: 'var(--text-primary)', fontSize: '13px' }}
                                    >
                                        <option value="Counter 1 (Main POS)">Counter 1 (Main POS)</option>
                                        <option value="Counter 2 (Appliances)">Counter 2 (Appliances)</option>
                                        <option value="Floor Sales Mobile">Floor Sales Mobile</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel" style={{ padding: '10px 16px' }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" style={{ padding: '10px 20px' }}>
                                    Create Staff Profile
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
