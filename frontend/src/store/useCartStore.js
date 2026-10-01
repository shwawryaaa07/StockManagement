import { create } from 'zustand';
import {
    calculateSubtotal,
    calculateDiscount,
    calculateTaxableAmount,
    calculateGstAmount,
    calculateGrandTotal,
    calculateBalanceDue
} from '../utils/billingCalculations';

const computeCartFinancials = (items, gstRate, rawDiscount, rawPaid) => {
    const subtotal = calculateSubtotal(items);
    const discount = calculateDiscount(subtotal, rawDiscount);
    const taxableAmount = calculateTaxableAmount(subtotal, discount);
    const gstAmount = calculateGstAmount(taxableAmount, gstRate);
    const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);
    const balanceDue = calculateBalanceDue(grandTotal, rawPaid === '' ? grandTotal : Number(rawPaid));

    return {
        subtotal,
        discount,
        taxableAmount,
        gstAmount,
        grandTotal,
        balanceDue
    };
};

export const useCartStore = create((set, get) => ({
    // Customer Details
    customerName: '',
    customerContact: '',
    deliveryAddress: '',
    notes: '',

    // Line Items
    items: [],

    // Financial Inputs
    gstRate: 18,
    discountAmount: 0,
    paymentMethod: 'CASH',
    amountPaid: '',

    // Computed Values
    subtotal: 0,
    discount: 0,
    taxableAmount: 0,
    gstAmount: 0,
    grandTotal: 0,
    balanceDue: 0,

    // Validation Errors
    errors: {},

    setCustomerDetails: (details) => set((state) => ({ ...state, ...details })),
    setErrors: (errors) => set({ errors }),
    clearError: (field) => set((state) => {
        const next = { ...state.errors };
        delete next[field];
        return { errors: next };
    }),

    addItem: (product) => {
        const currentItems = get().items;
        const existingIdx = currentItems.findIndex((it) => it.productId === product.id);

        let updatedItems;
        if (existingIdx >= 0) {
            updatedItems = currentItems.map((it, idx) => {
                if (idx === existingIdx) {
                    const nextQty = it.quantity + 1;
                    return { ...it, quantity: nextQty };
                }
                return it;
            });
        } else {
            const newItem = {
                productId: product.id,
                productName: product.name,
                modelNumber: product.modelNumber || '',
                unitPrice: Number(product.price || product.unitPrice || 0),
                quantity: 1,
                serialNumber: '',
                availableStock: product.quantity !== undefined ? product.quantity : 999
            };
            updatedItems = [...currentItems, newItem];
        }

        const financials = computeCartFinancials(
            updatedItems,
            get().gstRate,
            get().discountAmount,
            get().amountPaid
        );

        set({ items: updatedItems, ...financials });
    },

    updateQuantity: (index, newQty) => {
        if (newQty < 1) return;
        const updatedItems = get().items.map((it, idx) => {
            if (idx === index) {
                return { ...it, quantity: newQty };
            }
            return it;
        });

        const financials = computeCartFinancials(
            updatedItems,
            get().gstRate,
            get().discountAmount,
            get().amountPaid
        );

        set({ items: updatedItems, ...financials });
    },

    updateSerialNumber: (index, serialNumber) => {
        const updatedItems = get().items.map((it, idx) => {
            if (idx === index) {
                return { ...it, serialNumber };
            }
            return it;
        });
        set({ items: updatedItems });
    },

    removeItem: (index) => {
        const updatedItems = get().items.filter((_, idx) => idx !== index);
        const financials = computeCartFinancials(
            updatedItems,
            get().gstRate,
            get().discountAmount,
            get().amountPaid
        );
        set({ items: updatedItems, ...financials });
    },

    setGstRate: (rate) => {
        const numRate = Number(rate);
        const financials = computeCartFinancials(
            get().items,
            numRate,
            get().discountAmount,
            get().amountPaid
        );
        set({ gstRate: numRate, ...financials });
    },

    setDiscountAmount: (rawDiscount) => {
        const numDiscount = Math.max(0, Number(rawDiscount || 0));
        const financials = computeCartFinancials(
            get().items,
            get().gstRate,
            numDiscount,
            get().amountPaid
        );
        set({ discountAmount: numDiscount, ...financials });
    },

    setPaymentMethod: (method) => set({ paymentMethod: method }),

    setAmountPaid: (val) => {
        const financials = computeCartFinancials(
            get().items,
            get().gstRate,
            get().discountAmount,
            val
        );
        set({ amountPaid: val, ...financials });
    },

    clearCart: () => {
        set({
            customerName: '',
            customerContact: '',
            deliveryAddress: '',
            notes: '',
            items: [],
            gstRate: 18,
            discountAmount: 0,
            paymentMethod: 'CASH',
            amountPaid: '',
            subtotal: 0,
            discount: 0,
            taxableAmount: 0,
            gstAmount: 0,
            grandTotal: 0,
            balanceDue: 0,
            errors: {}
        });
    }
}));

export default useCartStore;
