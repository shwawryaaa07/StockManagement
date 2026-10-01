import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function FloatingButton() {
    const navigate = useNavigate();
    const location = useLocation();

    if (location.pathname === '/create-invoice') {
        return null;
    }

    return (
        <button
            className="fab"
            onClick={() => navigate('/create-invoice')}
            title="Create New Invoice"
        >
            ➕
        </button>
    );
}

export default FloatingButton;