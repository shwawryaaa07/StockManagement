import axios from 'axios';

// Cloud production backend with local fallback
const API_BASE_URL = process.env.REACT_APP_API_URL || 
                     process.env.REACT_APP_API_BASE_URL || 
                     'https://stockmanagement07.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE_URL
});

// Request Interceptor: Automatically inject Bearer JWT Token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response && error.response.status === 401) {
        // If not on login endpoint, clear invalid token and trigger re-auth
        if (!error.config.url.includes('/auth/login')) {
            localStorage.removeItem('authToken');
            sessionStorage.removeItem('authToken');
            window.dispatchEvent(new Event('auth-logout'));
        }
    }
    return Promise.reject(error);
});

// Authentication
export const loginWithPin = (pin) => api.post('/auth/login', { pin });
export const loginWithCredentials = (username, password) => api.post('/auth/login', { username, password });
export const verifyAuthToken = () => api.get('/auth/verify');

// Products
export const getProducts = () => api.get('/products');
export const createProduct = (product) => api.post('/products', product);
export const updateProduct = (id, product) => api.put(`/products/${id}`, product);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Invoices
export const getInvoices = () => api.get('/invoices');
export const getInvoice = (id) => api.get(`/invoices/${id}`);
export const createInvoice = (invoice) => api.post('/invoices', invoice);
export const updateInvoice = (id, invoice) => api.put(`/invoices/${id}`, invoice);
export const getDueInvoices = () => api.get('/invoices/due');
export const getPaidInvoices = () => api.get('/invoices/paid');
export const getDashboard = () => api.get('/invoices/dashboard');
export const searchInvoices = (customer) => api.get(`/invoices/search?customer=${customer}`);
export const settleDueInvoice = (id, paymentData) => api.post(`/invoices/${id}/settle`, paymentData);
export const recordPayment = (id, paymentData) => api.post(`/invoices/${id}/settle`, paymentData);
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);

export default api;
