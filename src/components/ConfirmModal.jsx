import { useEffect } from "react";

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  variant = "danger",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="modal fade show d-block"
        role="dialog"
        aria-modal="true"
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content border-0 shadow-lg overflow-hidden">
            <div style={{ height: 4, background: variant === "danger" ? "var(--color-danger)" : "var(--color-primary)" }} />
            <div className="modal-header border-0 pb-1">
              <h5 className="modal-title d-flex align-items-center gap-2 fw-bold" style={{ fontSize: "1rem" }}>
                <i className={variant === "danger" ? "bi bi-exclamation-triangle-fill text-danger" : "bi bi-pencil-fill text-primary"} />
                {title}
              </h5>
              <button className="btn-close" onClick={onCancel} />
            </div>
            <div className="modal-body pt-1 pb-2 body-sm" style={{ color: "var(--color-text-muted)" }}>
              {message}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                className="btn btn-outline-secondary rounded-pill btn-sm px-4"
                onClick={onCancel}
              >
                Annuler
              </button>
              <button
                className={`btn btn-sm px-4 rounded-pill ${variant === "danger" ? "btn-danger" : "btn-dark-navy"}`}
                onClick={onConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1054 }} onClick={onCancel} />
    </>
  );
}

export default ConfirmModal;
