import { validateInvoice } from './invoiceSchema';
import { validateProduct } from './productSchema';

describe('Zod Schema Validation', () => {
    describe('validateInvoice', () => {
        const validInvoice = {
            customerName: 'Rahul Sharma',
            customerContact: '9876543210',
            deliveryAddress: 'Panaji, Goa',
            items: [
                {
                    productId: 1,
                    productName: 'Samsung LED TV',
                    quantity: 1,
                    unitPrice: 32000
                }
            ],
            gstRate: 18,
            discountAmount: 1000,
            paymentMethod: 'UPI',
            amountPaid: 36760
        };

        test('succeeds for valid invoice data', () => {
            const result = validateInvoice(validInvoice);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

        test('fails when customerName is less than 2 characters', () => {
            const result = validateInvoice({ ...validInvoice, customerName: 'R' });
            expect(result.isValid).toBe(false);
            expect(result.errors.customerName).toMatch(/at least 2 characters/i);
        });

        test('fails when items list is empty', () => {
            const result = validateInvoice({ ...validInvoice, items: [] });
            expect(result.isValid).toBe(false);
            expect(result.errors.items).toMatch(/at least 1 product/i);
        });

        test('fails when phone number is invalid', () => {
            const result = validateInvoice({ ...validInvoice, customerContact: '12345' });
            expect(result.isValid).toBe(false);
            expect(result.errors.customerContact).toMatch(/valid 10-digit mobile number/i);
        });

        test('allows optional phone number when omitted or N/A', () => {
            const res1 = validateInvoice({ ...validInvoice, customerContact: '' });
            expect(res1.isValid).toBe(true);

            const res2 = validateInvoice({ ...validInvoice, customerContact: 'N/A' });
            expect(res2.isValid).toBe(true);
        });

        test('fails for invalid GST rate', () => {
            const result = validateInvoice({ ...validInvoice, gstRate: 40 });
            expect(result.isValid).toBe(false);
            expect(result.errors.gstRate).toMatch(/invalid gst tax slab/i);
        });
    });

    describe('validateProduct', () => {
        const validProduct = {
            name: 'LG Inverter AC 1.5 Ton',
            category: 'Air Conditioners',
            price: 42999,
            quantity: 8,
            modelNumber: 'MS-Q18ENZA'
        };

        test('succeeds for valid product data', () => {
            const result = validateProduct(validProduct);
            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });

        test('fails when price is zero or negative', () => {
            const result = validateProduct({ ...validProduct, price: 0 });
            expect(result.isValid).toBe(false);
            expect(result.errors.price).toMatch(/greater than 0/i);
        });

        test('fails when quantity is negative', () => {
            const result = validateProduct({ ...validProduct, quantity: -2 });
            expect(result.isValid).toBe(false);
            expect(result.errors.quantity).toMatch(/cannot be negative/i);
        });

        test('fails when category is blank', () => {
            const result = validateProduct({ ...validProduct, category: '   ' });
            expect(result.isValid).toBe(false);
            expect(result.errors.category).toMatch(/category/i);
        });
    });
});
