import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);
let uid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((t) => t.map((x) => (x.id === id ? { ...x, leaving: true } : x)));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 300);
  }, []);

  const push = useCallback(
    (type, message) => {
      const id = ++uid;
      setToasts((t) => [...t.slice(-3), { id, type, message }]);
      setTimeout(() => dismiss(id), 3800);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  const Icon = { success: CheckCircle2, error: AlertCircle, info: Info };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const I = Icon[t.type];
          return (
            <div key={t.id} className={`toast toast-${t.type} ${t.leaving ? "leaving" : ""}`}>
              <I size={20} />
              <span>{t.message}</span>
              <button aria-label="Close" onClick={() => dismiss(t.id)}>
                <X size={16} />
              </button>
              <i className="toast-timer" />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext);
}
