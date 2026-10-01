/**
 * Pure financial billing calculation utilities (GST, discounts, totals, balance dues)
 * Follows Indian GST retail calculation standards.
 */

export function calculateSubtotal(items = []) {
    if (!Array.isArray(items)) return 0;
    const total = items.reduce((sum, item) => {
        const qty = Number(item.quantity || 0);
        const price = Number(item.unitPrice || item.price || 0);
        return sum + qty * price;
    }, 0);
    return Number(total.toFixed(2));
}

export function calculateDiscount(subtotal = 0, discountAmount = 0) {
    const rawDiscount = Number(discountAmount || 0);
    if (isNaN(rawDiscount) || rawDiscount <= 0) return 0;
    // Discount cannot exceed subtotal
    const clamped = Math.min(Number(subtotal || 0), rawDiscount);
    return Number(clamped.toFixed(2));
}

export function calculateTaxableAmount(subtotal = 0, discount = 0) {
    const taxable = Math.max(0, Number(subtotal || 0) - Number(discount || 0));
    return Number(taxable.toFixed(2));
}

export function calculateGstAmount(taxableAmount = 0, gstRate = 18) {
    const rate = Number(gstRate || 0);
    const taxable = Number(taxableAmount || 0);
    if (taxable <= 0 || rate <= 0) return 0;
    const gst = (taxable * rate) / 100;
    return Number(gst.toFixed(2));
}

export function calculateGrandTotal(taxableAmount = 0, gstAmount = 0) {
    const total = Number(taxableAmount || 0) + Number(gstAmount || 0);
    return Number(total.toFixed(2));
}

export function calculateBalanceDue(grandTotal = 0, amountPaid = 0) {
    const total = Math.max(0, Number(grandTotal || 0));
    const paid = Math.max(0, Number(amountPaid || 0));
    const due = Math.max(0, total - paid);
    return Number(due.toFixed(2));
}

export function computeInvoiceTotals({ items = [], discount = 0, gstRate = 18, amountPaid = 0 } = {}) {
    const subtotal = calculateSubtotal(items);
    const clampedDiscount = calculateDiscount(subtotal, discount);
    const taxableAmount = calculateTaxableAmount(subtotal, clampedDiscount);
    const gstAmount = calculateGstAmount(taxableAmount, gstRate);
    const grandTotal = calculateGrandTotal(taxableAmount, gstAmount);
    const balanceDue = calculateBalanceDue(grandTotal, amountPaid);

    return {
        subtotal,
        discount: clampedDiscount,
        taxableAmount,
        gstRate: Number(gstRate || 0),
        gstAmount,
        grandTotal,
        amountPaid: Number(amountPaid || 0),
        balanceDue
    };
}

