import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CreateInvoice from './components/CreateInvoice';
import InvoiceList from './components/InvoiceList';
import DueInvoices from './components/DueInvoices';
import InvoiceDetail from './components/InvoiceDetail';
import EditInvoice from './components/EditInvoice';
import FloatingButton from './components/FloatingButton';

function App() {
    return (
        <Router>
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
                </Routes>
                <FloatingButton />
            </div>
        </Router>
    );
}

export default App;