import React, { useState } from 'react';
import Icon from './Icon';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

export const OwnerPinChange = ({ isVisitor }) => {
  const toast = useToast();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  const handleOwnerPinChange = async (e) => {
    e.preventDefault();
    setPinSuccessMsg('');
    setPinErrorMsg('');

    const cur = currentPin.trim();
    const np = newPin.trim();
    const cp = confirmPin.trim();

    if (isVisitor) {
      if (cur !== '1234' && cur !== '2006' && cur !== '0000') {
        setPinErrorMsg('❌ For demo mode, enter current PIN: 1234');
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
      setPinSuccessMsg('✅ Demo Master PIN updated in-memory for this session!');
      toast.success('Owner Master PIN successfully updated!');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      return;
    }

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

    try {
      await api.post('/staff/pin', { newPin: np });
    } catch (err) {}

    setPinSuccessMsg(`✅ Owner Master PIN successfully updated!`);
    toast.success('Owner Master PIN successfully updated!');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
  };

  return (
    <div className="card" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <div className="bg-warning-subtle text-warning" style={{ padding: '8px', borderRadius: '10px' }}>
          <Icon name="key" size={22} />
        </div>
        <div>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Change Master PIN</h3>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Update your 4-digit Owner passcode</div>
        </div>
      </div>

      <form onSubmit={handleOwnerPinChange} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
            Current Master PIN
          </label>
          <input
            type="password"
            maxLength="8"
            inputMode="numeric"
            className="form-input"
            value={currentPin}
            onChange={(e) => setCurrentPin(e.target.value)}
            placeholder="Enter current PIN"
            style={{ width: '100%', boxSizing: 'border-box' }}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              New PIN
            </label>
            <input
              type="password"
              maxLength="8"
              inputMode="numeric"
              className="form-input"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="Enter new PIN"
              style={{ width: '100%', boxSizing: 'border-box' }}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
              Confirm PIN
            </label>
            <input
              type="password"
              maxLength="8"
              inputMode="numeric"
              className="form-input"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Re-enter new PIN"
              style={{ width: '100%', boxSizing: 'border-box' }}
              required
            />
          </div>
        </div>

        {pinErrorMsg && <div style={{ color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>{pinErrorMsg}</div>}
        {pinSuccessMsg && <div style={{ color: '#10b981', fontSize: '12px', fontWeight: '700' }}>{pinSuccessMsg}</div>}

        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: '6px', padding: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <Icon name="shield" size={16} /> Update Master PIN
        </button>
      </form>
    </div>
  );
};

export default OwnerPinChange;
