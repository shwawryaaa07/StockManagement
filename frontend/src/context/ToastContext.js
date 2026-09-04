import React, { createContext, useContext, useState, useCallback } from 'react';
import Icon from '../components/Icon';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, removing: true } : t))
    );
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 250);
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
    return id;
  }, [removeToast]);

  const toast = {
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration || 4500),
    warning: (msg, duration) => addToast(msg, 'warning', duration || 4000),
    info: (msg, duration) => addToast(msg, 'info', duration)
  };

  const renderIcon = (type) => {
    switch (type) {
      case 'success':
        return <Icon name="check-circle" size={18} color="#10b981" />;
      case 'error':
        return <Icon name="alert-circle" size={18} color="#ef4444" />;
      case 'warning':
        return <Icon name="alert-triangle" size={18} color="#f59e0b" />;
      default:
        return <Icon name="info" size={18} color="#3b82f6" />;
    }
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-container" aria-live="polite" aria-atomic="true">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-card toast-${t.type} ${t.removing ? 'toast-removing' : ''}`}
            role="alert"
          >
            <span className="toast-icon-wrapper">{renderIcon(t.type)}</span>
            <div className="toast-content">{t.message}</div>
            <button
              className="toast-close-btn"
              onClick={() => removeToast(t.id)}
              aria-label="Close notification"
            >
              <Icon name="close" size={14} />
            </button>
            {t.duration > 0 && (
              <div
                className="toast-progress"
                style={{ animationDuration: `${t.duration}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    return {
      success: (msg) => console.log('Toast (success):', msg),
      error: (msg) => console.error('Toast (error):', msg),
      warning: (msg) => console.warn('Toast (warning):', msg),
      info: (msg) => console.info('Toast (info):', msg)
    };
  }
  return context;
};

export default ToastProvider;
