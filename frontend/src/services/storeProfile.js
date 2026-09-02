export const DEFAULT_STORE_PROFILE = {
    shopName: 'MANISHA ELECTRONICS',
    ownerName: 'Ramesh Naik (Owner)',
    gstin: '30AMYPN1753F1ZY',
    phone: '9309736172, 70205592347',
    address: 'EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa',
    upiId: '9309736172@upi'
};

export const DEMO_STORE_PROFILE = {
    shopName: 'DEMO STORE',
    ownerName: 'Demo Store Administrator',
    gstin: '30AAAAA0000A1Z5',
    phone: '+91 98000 00000',
    address: 'Sample Commercial Complex, Panaji - Goa',
    upiId: 'demostore@upi'
};

export const getStoreProfile = (isVisitor = false) => {
    if (isVisitor) return DEMO_STORE_PROFILE;
    const saved = localStorage.getItem('manisha_store_profile') || sessionStorage.getItem('manisha_store_profile');
    if (saved) {
        try {
            return { ...DEFAULT_STORE_PROFILE, ...JSON.parse(saved) };
        } catch (e) { }
    }
    return DEFAULT_STORE_PROFILE;
};

export const saveStoreProfile = (profile, isVisitor = false) => {
    if (isVisitor) {
        const merged = { ...DEMO_STORE_PROFILE, ...profile };
        window.dispatchEvent(new CustomEvent('store-profile-updated', { detail: merged }));
        return merged;
    }
    const merged = { ...DEFAULT_STORE_PROFILE, ...profile };
    localStorage.setItem('manisha_store_profile', JSON.stringify(merged));
    sessionStorage.setItem('manisha_store_profile', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('store-profile-updated', { detail: merged }));
    return merged;
};

export const getUpiPaymentUri = (profile, amount, invoiceNumber) => {
    const upiId = (profile?.upiId || '9309736172@upi').trim();
    const rawShopName = (profile?.shopName || 'MANISHA ELECTRONICS').replace(/[()]/g, '').trim();
    const cleanShopName = rawShopName.replace(/\s+/g, '+');
    const amt = Number(amount || 0).toFixed(2);
    const inv = invoiceNumber ? String(invoiceNumber).replace(/[^a-zA-Z0-9-]/g, '') : 'SALE';
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${cleanShopName}&am=${amt}&tn=INV-${inv}&cu=INR`;
};
