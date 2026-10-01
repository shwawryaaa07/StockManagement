import { useCartStore } from './useCartStore';

describe('useCartStore Zustand store', () => {
    beforeEach(() => {
        useCartStore.getState().clearCart();
    });

    test('initializes with empty cart and zeroed financials', () => {
        const state = useCartStore.getState();
        expect(state.items).toEqual([]);
        expect(state.subtotal).toBe(0);
        expect(state.gstAmount).toBe(0);
        expect(state.grandTotal).toBe(0);
        expect(state.balanceDue).toBe(0);
        expect(state.gstRate).toBe(18);
    });

    test('addItem adds a new product and computes financial totals', () => {
        const product = {
            id: 101,
            name: 'Samsung 43" Smart TV',
            modelNumber: 'UA43T5300',
            price: 25000,
            quantity: 5
        };

        useCartStore.getState().addItem(product);

        const state = useCartStore.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].productName).toBe('Samsung 43" Smart TV');
        expect(state.items[0].quantity).toBe(1);
        expect(state.subtotal).toBe(25000);
        // 18% GST on 25000 = 4500
        expect(state.gstAmount).toBe(4500);
        expect(state.grandTotal).toBe(29500);
        // When amountPaid is empty, balanceDue defaults to 0 (assumed full payment on invoice creation)
        expect(state.balanceDue).toBe(0);
    });

    test('addItem increments quantity if product already in cart', () => {
        const product = { id: 102, name: 'Sony Headphones', price: 2000 };

        useCartStore.getState().addItem(product);
        useCartStore.getState().addItem(product);

        const state = useCartStore.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].quantity).toBe(2);
        expect(state.subtotal).toBe(4000);
        expect(state.gstAmount).toBe(720);
        expect(state.grandTotal).toBe(4720);
    });

    test('updates quantity and recalculates totals', () => {
        const product = { id: 103, name: 'Mi Powerbank', price: 1000 };
        useCartStore.getState().addItem(product);
        useCartStore.getState().updateQuantity(0, 3);

        const state = useCartStore.getState();
        expect(state.items[0].quantity).toBe(3);
        expect(state.subtotal).toBe(3000);
        expect(state.gstAmount).toBe(540);
        expect(state.grandTotal).toBe(3540);
    });

    test('applies discount and recalibrates tax & grand total', () => {
        const product = { id: 104, name: 'LG Refrigerator', price: 20000 };
        useCartStore.getState().addItem(product);
        useCartStore.getState().setDiscountAmount(2000);

        const state = useCartStore.getState();
        expect(state.discount).toBe(2000);
        expect(state.taxableAmount).toBe(18000);
        // 18% GST on 18000 = 3240
        expect(state.gstAmount).toBe(3240);
        expect(state.grandTotal).toBe(21240);
    });

    test('computes balance due accurately on partial payment', () => {
        const product = { id: 105, name: 'Washing Machine', price: 15000 };
        useCartStore.getState().addItem(product);
        // Grand total: 15000 + 2700 (18% GST) = 17700
        useCartStore.getState().setAmountPaid('10000');

        const state = useCartStore.getState();
        expect(state.grandTotal).toBe(17700);
        expect(state.balanceDue).toBe(7700);
    });

    test('removeItem removes item from cart and recalculates', () => {
        const p1 = { id: 1, name: 'P1', price: 1000 };
        const p2 = { id: 2, name: 'P2', price: 2000 };
        useCartStore.getState().addItem(p1);
        useCartStore.getState().addItem(p2);

        expect(useCartStore.getState().items).toHaveLength(2);

        useCartStore.getState().removeItem(0);
        const state = useCartStore.getState();
        expect(state.items).toHaveLength(1);
        expect(state.items[0].productName).toBe('P2');
        expect(state.subtotal).toBe(2000);
    });

    test('clearCart resets everything', () => {
        const p1 = { id: 1, name: 'P1', price: 1000 };
        useCartStore.getState().addItem(p1);
        useCartStore.getState().setCustomerDetails({ customerName: 'Alice' });

        useCartStore.getState().clearCart();

        const state = useCartStore.getState();
        expect(state.items).toEqual([]);
        expect(state.customerName).toBe('');
        expect(state.subtotal).toBe(0);
    });
});
