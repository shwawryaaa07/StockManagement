import { z } from 'zod';

export const invoiceItemSchema = z.object({
    productId: z.union([z.number(), z.string()]).optional(),
    productName: z.string().min(1, 'Product name is required'),
    quantity: z.number().int().positive('Quantity must be at least 1'),
    unitPrice: z.number().nonnegative('Unit price cannot be negative'),
    serialNumber: z.string().optional()
});

export const invoiceSchema = z.object({
    customerName: z
        .string()
        .trim()
        .min(2, 'Customer name must be at least 2 characters')
        .max(100, 'Customer name cannot exceed 100 characters'),

    customerContact: z
        .string()
        .trim()
        .optional()
        .refine(
            (val) => !val || val === 'N/A' || /^[6-9]\d{9}$/.test(val.replace(/\s+/g, '')),
            'Please enter a valid 10-digit mobile number'
        ),

    deliveryAddress: z
        .string()
        .trim()
        .max(250, 'Address cannot exceed 250 characters')
        .optional(),

    items: z
        .array(invoiceItemSchema)
        .min(1, 'Please add at least 1 product to the invoice'),

    gstRate: z
        .number()
        .refine((val) => [0, 5, 12, 18, 28].includes(val), 'Invalid GST tax slab'),

    discountAmount: z
        .number()
        .nonnegative('Discount cannot be negative')
        .default(0),

    paymentMethod: z
        .enum(['CASH', 'UPI', 'CARD', 'CREDIT', 'BANK_TRANSFER'])
        .default('CASH'),

    amountPaid: z
        .union([z.number().nonnegative(), z.literal('')])
        .optional(),

    notes: z
        .string()
        .max(500, 'Notes cannot exceed 500 characters')
        .optional()
});

export const validateInvoice = (data) => {
    const result = invoiceSchema.safeParse(data);
    if (!result.success) {
        const fieldErrors = {};
        result.error.issues.forEach((issue) => {
            const field = issue.path[0];
            if (!fieldErrors[field]) {
                fieldErrors[field] = issue.message;
            }
        });
        return { isValid: false, errors: fieldErrors };
    }
    return { isValid: true, data: result.data, errors: {} };
};

export default invoiceSchema;
