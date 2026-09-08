import {
    calculateSubtotal,
    calculateDiscount,
    calculateTaxableAmount,
    calculateGstAmount,
    calculateGrandTotal,
    calculateBalanceDue,
    computeInvoiceTotals
} from './billingCalculations';

describe('billingCalculations utility', () => {
    describe('calculateSubtotal', () => {
        test('returns 0 for empty array or invalid inputs', () => {
            expect(calculateSubtotal([])).toBe(0);
            expect(calculateSubtotal(null)).toBe(0);
            expect(calculateSubtotal(undefined)).toBe(0);
            expect(calculateSubtotal('not-an-array')).toBe(0);
        });

        test('computes subtotal accurately for single and multiple items', () => {
            const items = [
                { quantity: 2, unitPrice: 1500 },
                { quantity: 1, unitPrice: 2499.50 },
                { quantity: 3, unitPrice: 100.25 }
            ];
            // 3000 + 2499.50 + 300.75 = 5800.25
            expect(calculateSubtotal(items)).toBe(5800.25);
        });

        test('handles items using price property fallback and missing quantities safely', () => {
            const items = [
                { quantity: 2, price: 500 },
                { unitPrice: 300 } // missing quantity defaults to 0
            ];
            expect(calculateSubtotal(items)).toBe(1000);
        });
    });

    describe('calculateDiscount', () => {
        test('returns 0 for negative, zero, or invalid discount values', () => {
            expect(calculateDiscount(1000, -50)).toBe(0);
            expect(calculateDiscount(1000, 0)).toBe(0);
            expect(calculateDiscount(1000, 'abc')).toBe(0);
            expect(calculateDiscount(1000, null)).toBe(0);
        });

        test('returns exact discount when less than subtotal', () => {
            expect(calculateDiscount(5000, 500)).toBe(500);
            expect(calculateDiscount(1250.75, 250.50)).toBe(250.50);
        });

        test('clamps discount to subtotal if discount exceeds subtotal', () => {
            expect(calculateDiscount(1000, 1500)).toBe(1000);
            expect(calculateDiscount(500, 9999)).toBe(500);
        });
    });

    describe('calculateTaxableAmount', () => {
        test('subtracts discount from subtotal', () => {
            expect(calculateTaxableAmount(5000, 500)).toBe(4500);
        });

        test('never returns negative taxable amount', () => {
            expect(calculateTaxableAmount(1000, 2000)).toBe(0);
        });
    });

    describe('calculateGstAmount', () => {
        test('computes 18% standard GST accurately', () => {
            expect(calculateGstAmount(10000, 18)).toBe(1800);
            expect(calculateGstAmount(15499.50, 18)).toBe(2789.91);
        });

        test('computes 28% luxury/electronics GST accurately', () => {
            expect(calculateGstAmount(10000, 28)).toBe(2800);
            expect(calculateGstAmount(25000, 28)).toBe(7000);
        });

        test('returns 0 for 0% GST or invalid/negative rates', () => {
            expect(calculateGstAmount(10000, 0)).toBe(0);
            expect(calculateGstAmount(10000, -5)).toBe(0);
            expect(calculateGstAmount(0, 18)).toBe(0);
        });
    });

    describe('calculateGrandTotal', () => {
        test('adds taxable amount and GST amount', () => {
            expect(calculateGrandTotal(10000, 1800)).toBe(11800);
            expect(calculateGrandTotal(4500.50, 810.09)).toBe(5310.59);
        });
    });

    describe('calculateBalanceDue', () => {
        test('returns 0 when fully paid or overpaid', () => {
            expect(calculateBalanceDue(10000, 10000)).toBe(0);
            expect(calculateBalanceDue(10000, 12000)).toBe(0);
        });

        test('calculates correct balance due on partial payment', () => {
            expect(calculateBalanceDue(11800, 5000)).toBe(6800);
            expect(calculateBalanceDue(5000.75, 2000.25)).toBe(3000.50);
        });

        test('returns full amount if paid is 0 or negative', () => {
            expect(calculateBalanceDue(10000, 0)).toBe(10000);
            expect(calculateBalanceDue(10000, -500)).toBe(10000);
        });
    });

    describe('computeInvoiceTotals', () => {
        test('computes full invoice lifecycle accurately', () => {
            const invoiceData = {
                items: [
                    { quantity: 1, unitPrice: 50000 },
                    { quantity: 2, unitPrice: 1000 }
                ],
                discount: 2000,
                gstRate: 18,
                amountPaid: 30000
            };

            const totals = computeInvoiceTotals(invoiceData);

            expect(totals.subtotal).toBe(52000);
            expect(totals.discount).toBe(2000);
            expect(totals.taxableAmount).toBe(50000);
            expect(totals.gstRate).toBe(18);
            expect(totals.gstAmount).toBe(9000);
            expect(totals.grandTotal).toBe(59000);
            expect(totals.amountPaid).toBe(30000);
            expect(totals.balanceDue).toBe(29000);
        });

        test('handles empty invoice inputs gracefully with default 18% GST', () => {
            const totals = computeInvoiceTotals();
            expect(totals.subtotal).toBe(0);
            expect(totals.discount).toBe(0);
            expect(totals.taxableAmount).toBe(0);
            expect(totals.gstRate).toBe(18);
            expect(totals.gstAmount).toBe(0);
            expect(totals.grandTotal).toBe(0);
            expect(totals.amountPaid).toBe(0);
            expect(totals.balanceDue).toBe(0);
        });
    });
});
