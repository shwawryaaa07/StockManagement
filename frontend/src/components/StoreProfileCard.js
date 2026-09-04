import React, { useState } from 'react';
import Icon from './Icon';
import { useToast } from '../context/ToastContext';
import { saveStoreProfile } from '../services/storeProfile';
import api from '../services/api';

export const StoreProfileCard = ({ storeProfile, setStoreProfile, isVisitor }) => {
  const toast = useToast();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editShopName, setEditShopName] = useState('');
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editGstin, setEditGstin] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editUpiId, setEditUpiId] = useState('');

  const { shopName, ownerName, gstin, phone, address, upiId } = storeProfile;

  const handleOpenModal = () => {
    setEditShopName(storeProfile.shopName || '');
    setEditOwnerName(storeProfile.ownerName || '');
    setEditGstin(storeProfile.gstin || '');
    setEditPhone(storeProfile.phone || '');
    setEditAddress(storeProfile.address || '');
    setEditUpiId(storeProfile.upiId || '9309736172@upi');
    setShowProfileModal(true);
  };

  const handleSaveStoreProfile = (e) => {
    if (e) e.preventDefault();
    let formattedUpi = (editUpiId || '').trim();
    if (formattedUpi && !formattedUpi.includes('@') && /^\d{10}$/.test(formattedUpi)) {
      formattedUpi = `${formattedUpi}@upi`;
    }

    const updated = {
      shopName: (editShopName || '').trim() || (isVisitor ? 'DEMO STORE' : 'MANISHA ELECTRONICS'),
      ownerName: (editOwnerName || '').trim() || (isVisitor ? 'Demo Administrator' : 'Ramesh Naik (Owner)'),
      gstin: (editGstin || '').trim() || (isVisitor ? '30AAAAA0000A1Z5' : '30AMYPN1753F1ZY'),
      phone: (editPhone || '').trim() || (isVisitor ? '+91 98000 00000' : '9309736172, 70205592347'),
      address: (editAddress || '').trim() || (isVisitor ? 'Sample Commercial Plaza, Panaji - Goa' : 'EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa'),
      upiId: formattedUpi || '9309736172@upi'
    };

    const saved = saveStoreProfile(updated, isVisitor);
    setStoreProfile(saved);
    setShowProfileModal(false);

    if (!isVisitor) {
      api.post('/staff/store-profile', updated).catch(() => {});
    }
    toast.success(`Store Profile for "${updated.shopName}" updated!`);
  };

  return (
    <>
      <div className="card" style={{ padding: '24px', position: 'relative' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div className="bg-primary-subtle text-primary" style={{ padding: '8px', borderRadius: '10px' }}>
              <Icon name="store" size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>Store Profile Overview</h3>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Administrative, Tax &amp; UPI Banking Information</div>
            </div>
          </div>
          <button
            onClick={handleOpenModal}
            className="btn-cancel"
            style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Icon name="edit" size={14} /> Edit Profile
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Store Name:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{shopName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Primary Administrator:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{ownerName}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Official GSTIN:</span>
            <strong style={{ color: 'var(--gold)', letterSpacing: '0.5px' }}>{gstin}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Contact Numbers:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{phone}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Receiving UPI ID / Mobile:</span>
            <strong style={{ color: '#059669', fontFamily: 'monospace', fontSize: '13.5px' }}>📱 {upiId}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '2px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Store Location:</span>
            <span style={{ color: 'var(--text-primary)', textAlign: 'right', maxWidth: '60%' }}>{address}</span>
          </div>
        </div>
      </div>

      {showProfileModal && (
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
            maxWidth: '540px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '24px 20px',
            borderRadius: '20px',
            background: 'var(--bg-card)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            boxSizing: 'border-box'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Icon name="store" size={24} />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  Edit Store Profile &amp; UPI Banking
                </h3>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStoreProfile} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Store Trade Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  placeholder="Enter shop name"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Primary Administrator / Owner Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  placeholder="Enter owner name"
                  style={{ width: '100%', boxSizing: 'border-box' }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Official GSTIN *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editGstin}
                    onChange={(e) => setEditGstin(e.target.value.toUpperCase())}
                    placeholder="Enter 15-digit GSTIN"
                    style={{ width: '100%', boxSizing: 'border-box', textTransform: 'uppercase' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                    Contact Phone *
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="Enter contact phone number"
                    style={{ width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '700', color: '#059669' }}>
                    📱 Receiving UPI ID / Mobile Number (For Customer QR Payments) *
                  </label>
                </div>
                <input
                  type="text"
                  className="form-input"
                  value={editUpiId}
                  onChange={(e) => setEditUpiId(e.target.value)}
                  placeholder="Enter UPI ID (phone@upi / name@bank)"
                  style={{ width: '100%', boxSizing: 'border-box', fontWeight: '700' }}
                  required
                />
                <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  🔒 Safe Direct Settlement: Enter your UPI ID or 10-digit phone number. Customers scanning bills pay directly into your linked bank account.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '4px' }}>
                  Physical Store Address *
                </label>
                <textarea
                  className="form-input"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  placeholder="Enter complete store address"
                  style={{ width: '100%', minHeight: '60px', boxSizing: 'border-box', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowProfileModal(false)}
                  className="btn-cancel"
                  style={{ flex: 1, padding: '11px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1.5, padding: '11px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Icon name="check" size={16} /> Save &amp; Sync Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default StoreProfileCard;
