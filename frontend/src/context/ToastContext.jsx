import { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={styles.container}>
        {toasts.map(t => (
          <div key={t.id} style={{ ...styles.toast, ...styles[t.type] }}>
            {t.type === 'success'
              ? <CheckCircle size={16} style={{ flexShrink: 0 }} />
              : <AlertCircle size={16} style={{ flexShrink: 0 }} />
            }
            <span style={{ flex: 1 }}>{t.message}</span>
            <button onClick={() => remove(t.id)} style={styles.closeBtn}>
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '1.5rem',
    right: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    zIndex: 999,
    maxWidth: 340,
  },
  toast: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.75rem 1rem',
    borderRadius: 8,
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: 'Inter, sans-serif',
    animation: 'slideup 0.2s ease',
    boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
  },
  success: {
    background: '#18181B',
    border: '1px solid #22C55E',
    color: '#22C55E',
  },
  error: {
    background: '#18181B',
    border: '1px solid #EF4444',
    color: '#EF4444',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'inherit',
    opacity: 0.7,
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    flexShrink: 0,
  },
};
