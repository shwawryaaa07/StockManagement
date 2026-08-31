export const DEFAULT_STORE_PROFILE = {
    shopName: 'MANISHA ELECTRONICS',
    ownerName: 'Ramesh Naik (Owner)',
    gstin: '30AMYPN1753F1ZY',
    phone: '9309736172, 70205592347',
    address: 'EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa'
};

export const getStoreProfile = () => {
    const saved = localStorage.getItem('manisha_store_profile') || sessionStorage.getItem('manisha_store_profile');
    if (saved) {
        try {
            return { ...DEFAULT_STORE_PROFILE, ...JSON.parse(saved) };
        } catch (e) { }
    }
    return DEFAULT_STORE_PROFILE;
};

export const saveStoreProfile = (profile) => {
    const merged = { ...DEFAULT_STORE_PROFILE, ...profile };
    localStorage.setItem('manisha_store_profile', JSON.stringify(merged));
    sessionStorage.setItem('manisha_store_profile', JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('store-profile-updated', { detail: merged }));
    return merged;
};
