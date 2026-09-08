import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import FloatingButton from './components/FloatingButton';
import OfflineBanner from './components/OfflineBanner';
import ServerWakeupBanner from './components/ServerWakeupBanner';
import { PageSkeleton } from './components/SkeletonLoader';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import useInactivityTimeout from './hooks/useInactivityTimeout';

// Route-level code splitting: Granular chunks loaded on demand (Issue 2)
const Dashboard = lazy(() => import('./components/Dashboard'));
const ProductList = lazy(() => import('./components/ProductList'));
const CreateInvoice = lazy(() => import('./components/CreateInvoice'));
const InvoiceList = lazy(() => import('./components/InvoiceList'));
const InvoiceDetail = lazy(() => import('./components/InvoiceDetail'));
const EditInvoice = lazy(() => import('./components/EditInvoice'));
const DueInvoices = lazy(() => import('./components/DueInvoices'));
const StaffManagement = lazy(() => import('./components/StaffManagement'));
const Login = lazy(() => import('./components/Login'));

function AppContent() {
    const { isAuthenticated, loading, logout } = useAuth();
    const toast = useToast();

    // Auto-lock session after 30 min of inactivity (Issue 4)
    useInactivityTimeout(() => {
        if (isAuthenticated) {
            logout();
            toast.warning('POS terminal locked due to 30 minutes of inactivity.');
        }
    }, 30 * 60 * 1000, isAuthenticated);

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-body)',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '16px',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ fontSize: '40px' }}>🏪</div>
                <div>Securing Manisha Electronics Portal...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <Suspense fallback={<PageSkeleton />}>
                <OfflineBanner />
                <ServerWakeupBanner />
                <Login />
            </Suspense>
        );
    }

    return (
        <div>
            <OfflineBanner />
            <ServerWakeupBanner />
            <Navbar />
            <Suspense fallback={<PageSkeleton />}>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/products" element={<ProductList />} />
                    <Route path="/create-invoice" element={<CreateInvoice />} />
                    <Route path="/invoices" element={<InvoiceList />} />
                    <Route path="/invoice/:id" element={<InvoiceDetail />} />
                    <Route path="/edit-invoice/:id" element={<EditInvoice />} />
                    <Route path="/due-invoices" element={<DueInvoices />} />
                    <Route path="/staff-management" element={<StaffManagement />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Suspense>
            <FloatingButton />
        </div>
    );
}

function App() {
    return (
        <Router>
            <ToastProvider>
                <AuthProvider>
                    <AppContent />
                </AuthProvider>
            </ToastProvider>
        </Router>
    );
}

export default App;
