import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

// Products
export const getProducts = () => axios.get(`${API_BASE_URL}/products`);
export const createProduct = (product) => axios.post(`${API_BASE_URL}/products`, product);
export const updateProduct = (id, product) => axios.put(`${API_BASE_URL}/products/${id}`, product);
export const deleteProduct = (id) => axios.delete(`${API_BASE_URL}/products/${id}`);

// Invoices
export const getInvoices = () => axios.get(`${API_BASE_URL}/invoices`);
export const getInvoice = (id) => axios.get(`${API_BASE_URL}/invoices/${id}`);
export const createInvoice = (invoice) => axios.post(`${API_BASE_URL}/invoices`, invoice);
export const updateInvoice = (id, invoice) => axios.put(`${API_BASE_URL}/invoices/${id}`, invoice);  // ✅ NEW
export const getDueInvoices = () => axios.get(`${API_BASE_URL}/invoices/due`);
export const getPaidInvoices = () => axios.get(`${API_BASE_URL}/invoices/paid`);
export const getDashboard = () => axios.get(`${API_BASE_URL}/invoices/dashboard`);
export const searchInvoices = (customer) => axios.get(`${API_BASE_URL}/invoices/search?customer=${customer}`);
export const recordPayment = (id, amount) => axios.put(`${API_BASE_URL}/invoices/${id}/pay?amount=${amount}`);
export const deleteInvoice = (id) => axios.delete(`${API_BASE_URL}/invoices/${id}`);