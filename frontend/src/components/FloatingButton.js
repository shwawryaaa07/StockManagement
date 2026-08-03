import React from 'react';
import { useNavigate } from 'react-router-dom';

function FloatingButton() {
    const navigate = useNavigate();

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