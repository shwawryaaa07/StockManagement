import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CreateInvoice from './components/CreateInvoice';
import InvoiceList from './components/InvoiceList';
import DueInvoices from './components/DueInvoices';
import InvoiceDetail from './components/InvoiceDetail';
import EditInvoice from './components/EditInvoice';
import StaffManagement from './components/StaffManagement';
import FloatingButton from './components/FloatingButton';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

function AppContent() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontWeight: '700',
                fontSize: '16px',
                flexDirection: 'column',
                gap: '12px'
            }}>
                <div style={{ fontSize: '36px' }}>🏪</div>
                <div>Securing Manisha Electronics Portal...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Login />;
    }

    return (
        <div>
            <Navbar />
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
