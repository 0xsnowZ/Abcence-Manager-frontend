import { createContext, useCallback, useContext, useState } from "react";

const ToastContext = createContext(null);

const ICONS = {
  success: "bi-check-circle-fill",
  error: "bi-x-circle-fill",
  warning: "bi-exclamation-triangle-fill",
  info: "bi-info-circle-fill",
};

const COLORS = {
  success: { bg: "#d1e7dd", border: "#a3cfbb", text: "#0a3622", icon: "#198754" },
  error:   { bg: "#f8d7da", border: "#f1aeb5", text: "#58151c", icon: "#dc3545" },
  warning: { bg: "#fff3cd", border: "#ffe69c", text: "#664d03", icon: "#ffc107" },
  info:    { bg: "#cff4fc", border: "#9eeaf9", text: "#055160", icon: "#0dcaf0" },
};

let nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info", duration = 4000) => {
    const id = nextId++;
    setToasts((prev) => [...prev, { id, message, type, duration }]);
    if (duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    }
  }, []);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      <div
        className="toast-stack"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          maxWidth: "min(360px, calc(100vw - 2rem))",
          width: "100%",
        }}
      >
        {toasts.map((t) => {
          const c = COLORS[t.type] || COLORS.info;
          return (
            <div
              key={t.id}
              style={{
                position: "relative",
                overflow: "hidden",
                borderRadius: "var(--radius-lg, 0.625rem)",
                border: `1px solid ${c.border}`,
                backgroundColor: c.bg,
                color: c.text,
                boxShadow: "var(--shadow-lg, 0 10px 30px rgba(0,0,0,0.12))",
                animation: "toast-in 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                fontSize: "0.9rem",
                lineHeight: 1.4,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem", padding: "0.75rem 1rem" }}>
                <i
                  className={`bi ${ICONS[t.type] || ICONS.info}`}
                  style={{ color: c.icon, fontSize: "1.1rem", flexShrink: 0, marginTop: "1px" }}
                />
                <span style={{ flex: 1 }}>{t.message}</span>
                <button
                  onClick={() => dismiss(t.id)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: c.text,
                    opacity: 0.6,
                    padding: 0,
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  <i className="bi bi-x-lg" style={{ fontSize: "0.85rem" }} />
                </button>
              </div>
              {t.duration > 0 && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    height: "3px",
                    backgroundColor: c.icon,
                    opacity: 0.5,
                    animationName: "toast-progress",
                    animationDuration: `${t.duration}ms`,
                    animationTimingFunction: "linear",
                    animationFillMode: "forwards",
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}
