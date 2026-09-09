import { cleanText } from './purify';
import { getUpiPaymentUri } from '../services/storeProfile';

/**
 * Formats a date string (ISO or YYYY-MM-DD) to DD/MM/YYYY
 */
export function formatReceiptDate(dateStr) {
    if (!dateStr) return 'N/A';
    const clean = String(dateStr).split('T')[0].split('-');
    if (clean.length === 3) {
        return `${clean[2]}/${clean[1]}/${clean[0]}`;
    }
    return String(dateStr);
}

/**
 * Normalizes customer phone number to a clean standard format for WhatsApp API.
 * Supports standard 10-digit mobile, leading 0 STD/mobile numbers, and existing 91 country codes.
 */
export function normalizePhoneNumber(rawPhone) {
    if (rawPhone === null || rawPhone === undefined) return '';
    const digits = String(rawPhone).replace(/\D/g, '');
    if (!digits) return '';

    // Standard 10-digit Indian mobile number (e.g. 8209531238)
    if (digits.length === 10) {
        return `91${digits}`;
    }
    // 11-digit number with leading 0 (e.g. 08209531238)
    if (digits.length === 11 && digits.startsWith('0')) {
        return `91${digits.slice(1)}`;
    }
    // 12-digit number starting with 91 (e.g. 918209531238)
    if (digits.length === 12 && digits.startsWith('91')) {
        return digits;
    }
    // 13-digit number starting with 091
    if (digits.length === 13 && digits.startsWith('091')) {
        return digits.slice(1);
    }
    return digits;
}

/**
 * Generates an executive, official Tax Invoice / Cash Memo WhatsApp receipt.
 *
 * @param {Object} invoice - The invoice data object
 * @param {Object} storeProfile - Store profile containing store contact & tax info
 * @param {boolean} isVisitor - Flag if user is in demo sandbox mode
 * @returns {string} Formatted WhatsApp text receipt with proper Markdown & emoji tokens
 */
export function formatWhatsAppReceipt(invoice, storeProfile = {}, isVisitor = false) {
    if (!invoice) return '';

    const displayShopName = isVisitor
        ? 'MANISHA ELECTRONICS (Demo Sandbox)'
        : (storeProfile.shopName || 'MANISHA ELECTRONICS');

    const rawStorePhone = (storeProfile.phone || '')
        .replace(/,\s*70205592347/g, '')
        .replace(/70205592347\s*,?/g, '')
        .trim() || '9309736172';
    // Ensure clean phone prefix without accidental duplicate "+91"
    const cleanStorePhone = rawStorePhone.startsWith('+') ? rawStorePhone : `+91 ${rawStorePhone}`;

    const displayShopAddress = isVisitor
        ? 'Sample Commercial Complex, Panaji - Goa'
        : (storeProfile.address || 'EDEN GROVE Building, Nr. State Bank of India, Valpoi, Goa');

    const displayGSTIN = isVisitor
        ? '30AAAAA0000A1Z5'
        : (storeProfile.gstin || '30AMYPN1753F1ZY');

    const customerName = cleanText(invoice.customerName) || 'Valued Customer';
    const rawCustomerPhone = cleanText(invoice.customerContact);
    const customerPhoneDigits = (rawCustomerPhone || '').replace(/\D/g, '');
    const formattedCustomerPhone = customerPhoneDigits.length >= 10
        ? `+91 ${customerPhoneDigits.slice(-10)}`
        : (rawCustomerPhone && rawCustomerPhone !== 'N/A' ? rawCustomerPhone : null);

    // Build Purchased Items List
    const items = invoice.items || [];
    const itemsList = items.length > 0
        ? items.map((it, idx) => {
            const name = cleanText(it.product?.name || it.productName) || 'Product';
            const rawModel = it.modelNumber || it.product?.modelNumber;
            const model = rawModel ? ` [${cleanText(rawModel)}]` : '';
            const serial = it.serialNumber ? `\n   ↳ _S/N: ${cleanText(it.serialNumber)}_` : '';
            const qty = it.quantity !== undefined && it.quantity !== null ? Number(it.quantity) : 1;
            const unitPrice = Number(it.unitPrice !== undefined ? it.unitPrice : (it.price || 0));
            const total = qty * unitPrice;

            return `*${idx + 1}. ${name}${model}*\n   • Qty: ${qty}  ×  ₹${unitPrice.toLocaleString('en-IN')}  =  *₹${total.toLocaleString('en-IN')}*${serial}`;
        }).join('\n\n')
        : '(No item details recorded)';

    // Financial calculations
    const subtotal = Number(invoice.subtotal || 0).toLocaleString('en-IN');
    const gstRate = invoice.gstRate !== undefined && invoice.gstRate !== null ? Number(invoice.gstRate) : 18;
    const gstAmount = Number(invoice.gstAmount || 0).toLocaleString('en-IN');
    const totalAmount = Number(invoice.totalAmount || 0).toLocaleString('en-IN');
    const amountPaid = Number(invoice.amountPaid || 0).toLocaleString('en-IN');
    const discount = Number(invoice.discountAmount || invoice.discount || 0);

    const dueAmount = Number(
        invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.amountDue || 0)
    );
    const isPaidInFull = dueAmount <= 0;

    let balanceSection = null;
    if (!isPaidInFull) {
        const upiUri = getUpiPaymentUri(storeProfile, dueAmount, invoice.invoiceNumber);
        const upiId = storeProfile.upiId || '9309736172@upi';
        balanceSection =
`• *Balance Due:*       *⚠️ ₹${dueAmount.toLocaleString('en-IN')}*

📲 *Pay Balance via UPI:*
• UPI ID: \`${upiId}\`
• Tap to Pay: ${upiUri}`;
    }

    const lines = [
        `🧾 *TAX INVOICE / CASH MEMO*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🏢 *${displayShopName.toUpperCase()}*`,
        `_Complete Home Appliances & Consumer Electronics_`,
        `📍 ${displayShopAddress}`,
        `📞 *Helpline:* ${cleanStorePhone}`,
        `🏛️ *GSTIN:* ${displayGSTIN}`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ``,
        `📋 *INVOICE PARTICULARS*`,
        `• *Invoice No:* #${invoice.invoiceNumber}`,
        `• *Date:* ${formatReceiptDate(invoice.createdAt)}`,
        `• *Billed To:* *${customerName}*`,
        formattedCustomerPhone ? `• *Contact:* ${formattedCustomerPhone}` : null,
        invoice.deliveryAddress && invoice.deliveryAddress !== 'N/A'
            ? `• *Delivery Address:* ${cleanText(invoice.deliveryAddress)}`
            : null,
        `• *Payment Mode:* ${invoice.paymentMethod || invoice.paymentMode || 'CASH'}`,
        ``,
        `🛍️ *PURCHASED ITEMS*`,
        `────────────────────────────`,
        itemsList,
        `────────────────────────────`,
        ``,
        `📊 *BILLING & TAX BREAKDOWN*`,
        `• Taxable Value:     ₹${subtotal}`,
        `• GST (${gstRate}%):          ₹${gstAmount}`,
        discount > 0 ? `• Discount Applied:  -₹${discount.toLocaleString('en-IN')}` : null,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `💰 *GRAND TOTAL:      ₹${totalAmount}*`,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `• Amount Paid:        ₹${amountPaid}`,
        `• Payment Status:     ${isPaidInFull ? '✅ *PAID IN FULL*' : '⚠️ *PARTIALLY PAID*'}`,
        balanceSection,
        ``,
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        `🙏 *Thank you for choosing ${isVisitor ? 'Manisha Electronics' : storeProfile.shopName}!*`,
        `🛡️ *Warranty & Support Notice:*`,
        `_Please preserve this digital tax invoice for manufacturer warranty & after-sales service._`,
        `_Authorized Computer-Generated Invoice • Valid without signature_`
    ];

    return lines.filter((line) => line !== null).join('\n');
}

/**
 * Builds the direct WhatsApp web/app launch URL.
 * Uses `https://api.whatsapp.com/send/?phone=...&text=...` directly
 * to avoid the known `wa.me` 302 HTTP redirect emoji corruption bug.
 *
 * @param {string} rawPhone - Customer phone number
 * @param {string} message - Formatted message text
 * @returns {string} WhatsApp direct URL
 */
export function getWhatsAppShareUrl(rawPhone, message) {
    const cleanPhone = normalizePhoneNumber(rawPhone);
    const encoded = encodeURIComponent(message);
    if (cleanPhone) {
        return `https://api.whatsapp.com/send/?phone=${cleanPhone}&text=${encoded}`;
    }
    return `https://api.whatsapp.com/send/?text=${encoded}`;
}
