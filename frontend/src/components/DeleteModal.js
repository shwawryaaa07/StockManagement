import React from 'react';

function DeleteModal({ isOpen, onClose, onConfirm, invoiceNumber }) {
    if (!isOpen) return null;

    return (
        <div style={styles.overlay}>
            <div style={styles.modal}>
                <div style={styles.icon}>🗑️</div>
                <h2 style={styles.title}>Delete Invoice</h2>
                <p style={styles.message}>
                    Are you sure you want to delete <strong>{invoiceNumber}</strong>?
                </p>
                <p style={styles.warning}>This action cannot be undone!</p>
                <div style={styles.buttons}>
                    <button style={styles.cancelBtn} onClick={onClose}>
                        ❌ Cancel
                    </button>
                    <button style={styles.deleteBtn} onClick={onConfirm}>
                        ✅ Yes, Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

const styles = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
    },
    modal: {
        backgroundColor: 'var(--bg-card, #ffffff)',
        padding: '35px 40px',
        borderRadius: '16px',
        maxWidth: '420px',
        width: '90%',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        animation: 'fadeIn 0.2s ease',
    },
    icon: {
        fontSize: '48px',
        marginBottom: '10px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '700',
        marginBottom: '10px',
        color: 'var(--text-primary, #1a1a2e)',
    },
    message: {
        fontSize: '16px',
        color: 'var(--text-secondary, #4a4a6a)',
        marginBottom: '5px',
    },
    warning: {
        fontSize: '14px',
        color: '#ef5350',
        fontWeight: '600',
        marginBottom: '25px',
    },
    buttons: {
        display: 'flex',
        gap: '12px',
        justifyContent: 'center',
    },
    cancelBtn: {
        padding: '10px 28px',
        backgroundColor: '#e0e0e0',
        color: '#333',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        cursor: 'pointer',
        transition: '0.2s',
    },
    deleteBtn: {
        padding: '10px 28px',
        backgroundColor: '#ef5350',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '15px',
        cursor: 'pointer',
        transition: '0.2s',
    },
};

// Inject keyframes once
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes fadeIn {
        from { opacity: 0; transform: scale(0.95); }
        to { opacity: 1; transform: scale(1); }
    }
`;
document.head.appendChild(styleSheet);

export default DeleteModal;