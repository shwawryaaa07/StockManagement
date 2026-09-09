import {
    formatReceiptDate,
    normalizePhoneNumber,
    formatWhatsAppReceipt,
    getWhatsAppShareUrl
} from './receiptFormatter';

describe('receiptFormatter utility', () => {
    const mockStoreProfile = {
        shopName: 'MANISHA ELECTRONICS',
        address: 'EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa',
        phone: '9309736172',
        gstin: '30AMYPN1753F1ZY',
        upiId: '9309736172@upi'
    };

    describe('formatReceiptDate', () => {
        it('formats ISO date string to DD/MM/YYYY', () => {
            expect(formatReceiptDate('2026-09-09T18:30:00')).toBe('09/09/2026');
        });

        it('formats simple YYYY-MM-DD to DD/MM/YYYY', () => {
            expect(formatReceiptDate('2026-01-15')).toBe('15/01/2026');
        });

        it('returns N/A for empty or null dates', () => {
            expect(formatReceiptDate(null)).toBe('N/A');
            expect(formatReceiptDate('')).toBe('N/A');
        });
    });

    describe('normalizePhoneNumber', () => {
        it('prepends 91 to a 10-digit Indian number', () => {
            expect(normalizePhoneNumber('8209531238')).toBe('918209531238');
        });

        it('handles numbers passed as numeric types', () => {
            expect(normalizePhoneNumber(8209531238)).toBe('918209531238');
        });

        it('handles 11-digit numbers with leading zero', () => {
            expect(normalizePhoneNumber('08209531238')).toBe('918209531238');
        });

        it('preserves existing 12-digit number starting with 91', () => {
            expect(normalizePhoneNumber('+91 82095 31238')).toBe('918209531238');
        });

        it('handles 13-digit numbers starting with 091', () => {
            expect(normalizePhoneNumber('0918209531238')).toBe('918209531238');
        });

        it('returns empty string for null or empty input', () => {
            expect(normalizePhoneNumber(null)).toBe('');
            expect(normalizePhoneNumber('')).toBe('');
        });
    });

    describe('formatWhatsAppReceipt', () => {
        const mockInvoicePaid = {
            invoiceNumber: 'INV-1A1CC757',
            createdAt: '2026-09-09T00:00:00',
            customerName: 'Shaurya Gawas',
            customerContact: '8209531238',
            paymentMethod: 'CASH',
            subtotal: 15000,
            gstRate: 18,
            gstAmount: 2700,
            totalAmount: 17700,
            amountPaid: 17700,
            balanceDue: 0,
            items: [
                {
                    product: { name: 'Pendrive' },
                    quantity: 1,
                    unitPrice: 15000
                }
            ]
        };

        it('generates an official tax invoice receipt for fully paid invoices', () => {
            const receipt = formatWhatsAppReceipt(mockInvoicePaid, mockStoreProfile);

            expect(receipt).toContain('TAX INVOICE / CASH MEMO');
            expect(receipt).toContain('MANISHA ELECTRONICS');
            expect(receipt).toContain('30AMYPN1753F1ZY');
            expect(receipt).toContain('INV-1A1CC757');
            expect(receipt).toContain('09/09/2026');
            expect(receipt).toContain('Shaurya Gawas');
            expect(receipt).toContain('+91 8209531238');
            expect(receipt).toContain('1. Pendrive');
            expect(receipt).toContain('Qty: 1  ×  ₹15,000  =  *₹15,000*');
            expect(receipt).toContain('Taxable Value:     ₹15,000');
            expect(receipt).toContain('GST (18%):          ₹2,700');
            expect(receipt).toContain('GRAND TOTAL:      ₹17,700');
            expect(receipt).toContain('PAID IN FULL');
            expect(receipt).not.toContain('Balance Due');
        });

        it('includes balance due and UPI payment instructions when balance is outstanding', () => {
            const mockInvoiceDue = {
                ...mockInvoicePaid,
                amountPaid: 10000,
                balanceDue: 7700
            };

            const receipt = formatWhatsAppReceipt(mockInvoiceDue, mockStoreProfile);

            expect(receipt).toContain('PARTIALLY PAID');
            expect(receipt).toContain('*Balance Due:*       *⚠️ ₹7,700*');
            expect(receipt).toContain('Pay Balance via UPI');
            expect(receipt).toContain('9309736172@upi');
            // Check that note doesn't duplicate INV- prefix
            expect(receipt).toContain('tn=INV-1A1CC757');
            expect(receipt).not.toContain('tn=INV-INV');
        });

        it('formats serial numbers, model numbers, and discounts cleanly', () => {
            const mockInvoiceComplex = {
                invoiceNumber: 'INV-COMPLEX',
                createdAt: '2026-09-10',
                customerName: 'Rohit Sharma',
                customerContact: '9876543210',
                deliveryAddress: 'House No. 12, Valpoi Market',
                paymentMethod: 'UPI',
                subtotal: 35000,
                discountAmount: 2000,
                gstRate: 18,
                gstAmount: 5940,
                totalAmount: 38940,
                amountPaid: 38940,
                balanceDue: 0,
                items: [
                    {
                        productName: 'LG Smart OLED TV',
                        modelNumber: 'OLED55C3',
                        serialNumber: 'SN-LG-982103',
                        quantity: 1,
                        unitPrice: 35000
                    }
                ]
            };

            const receipt = formatWhatsAppReceipt(mockInvoiceComplex, mockStoreProfile);

            expect(receipt).toContain('LG Smart OLED TV [OLED55C3]');
            expect(receipt).toContain('S/N: SN-LG-982103');
            expect(receipt).toContain('Discount Applied:  -₹2,000');
            expect(receipt).toContain('*Delivery Address:* House No. 12, Valpoi Market');
        });

        it('handles zero GST rate accurately', () => {
            const mockInvoiceZeroGst = {
                ...mockInvoicePaid,
                gstRate: 0,
                gstAmount: 0,
                totalAmount: 15000,
                amountPaid: 15000
            };
            const receipt = formatWhatsAppReceipt(mockInvoiceZeroGst, mockStoreProfile);
            expect(receipt).toContain('GST (0%):          ₹0');
        });

        it('handles helpline phone formatting without duplicate +91 in demo mode', () => {
            const demoProfile = {
                ...mockStoreProfile,
                phone: '+91 98000 00000'
            };
            const receipt = formatWhatsAppReceipt(mockInvoicePaid, demoProfile, true);
            expect(receipt).toContain('MANISHA ELECTRONICS (DEMO SANDBOX)');
            expect(receipt).toContain('📞 *Helpline:* +91 98000 00000');
            expect(receipt).not.toContain('+91 +91');
        });

        it('returns empty string if invoice is missing', () => {
            expect(formatWhatsAppReceipt(null)).toBe('');
        });
    });

    describe('getWhatsAppShareUrl', () => {
        it('uses direct api.whatsapp.com endpoint with customer phone', () => {
            const message = '🧾 *TAX INVOICE*';
            const url = getWhatsAppShareUrl('8209531238', message);

            expect(url).toContain('https://api.whatsapp.com/send/?phone=918209531238&text=');
            expect(url).toContain(encodeURIComponent(message));
            expect(url).not.toContain('wa.me');
        });

        it('handles missing phone number gracefully', () => {
            const message = 'Hello';
            const url = getWhatsAppShareUrl('', message);

            expect(url).toBe('https://api.whatsapp.com/send/?text=Hello');
        });
    });
});
