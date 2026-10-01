import { z } from 'zod';

export const productSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Product name must be at least 2 characters')
        .max(120, 'Product name cannot exceed 120 characters'),

    category: z
        .string()
        .trim()
        .min(1, 'Please select or enter a product category'),

    price: z
        .number()
        .positive('Selling price must be greater than 0'),

    quantity: z
        .number()
        .int('Stock quantity must be a whole number')
        .nonnegative('Stock quantity cannot be negative'),

    modelNumber: z
        .string()
        .trim()
        .max(60, 'Model number cannot exceed 60 characters')
        .optional()
});

export const validateProduct = (data) => {
    const result = productSchema.safeParse(data);
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

export default productSchema;
