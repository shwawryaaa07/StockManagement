import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import EmptyState from '../EmptyState';

describe('EmptyState Component', () => {
    test('renders default icon, title, and description', () => {
        render(<EmptyState />);

        expect(screen.getByText('📋')).toBeInTheDocument();
        expect(screen.getByText('No Data Found')).toBeInTheDocument();
        expect(screen.getByText('There are no records matching your request right now.')).toBeInTheDocument();
    });

    test('renders custom content and accessible aria region', () => {
        render(
            <EmptyState
                icon="📦"
                title="No Products Found"
                description="Your product inventory is currently empty."
            />
        );

        const region = screen.getByRole('region', { name: 'No Products Found' });
        expect(region).toBeInTheDocument();
        expect(screen.getByText('📦')).toBeInTheDocument();
        expect(screen.getByText('No Products Found')).toBeInTheDocument();
        expect(screen.getByText('Your product inventory is currently empty.')).toBeInTheDocument();
    });

    test('does not render actions when no action labels provided', () => {
        render(<EmptyState title="Quiet Zone" />);
        expect(screen.queryByRole('button')).toBeNull();
    });

    test('renders primary action button and handles click callback', () => {
        const handleAction = jest.fn();
        render(
            <EmptyState
                title="No Invoices"
                actionLabel="Create Invoice"
                onAction={handleAction}
            />
        );

        const primaryBtn = screen.getByRole('button', { name: 'Create Invoice' });
        expect(primaryBtn).toBeInTheDocument();

        fireEvent.click(primaryBtn);
        expect(handleAction).toHaveBeenCalledTimes(1);
    });

    test('renders secondary action button and handles secondary click callback', () => {
        const handleSecondary = jest.fn();
        render(
            <EmptyState
                title="No Due Invoices"
                secondaryLabel="Refresh List"
                onSecondaryAction={handleSecondary}
            />
        );

        const secondaryBtn = screen.getByRole('button', { name: 'Refresh List' });
        expect(secondaryBtn).toBeInTheDocument();

        fireEvent.click(secondaryBtn);
        expect(handleSecondary).toHaveBeenCalledTimes(1);
    });
});
