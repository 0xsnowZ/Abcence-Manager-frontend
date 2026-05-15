import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateAttendanceStatus } from "../store/absenceSlice.jsx";
import { useToast } from "./ToastProvider.jsx";

function AbsenceDetailModal({ absence, onClose }) {
    const dispatch = useDispatch();
    const showToast = useToast();
    const user = useSelector((state) => state.auth.user);
    const [editingStatus, setEditingStatus] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState(absence?.status || "non_justifie");
    const [saving, setSaving] = useState(false);

    const isAdmin = user?.role === "admin";

    // Prevent non-admins from editing status
    const canEditStatus = isAdmin;

    // Status color mapping
    const statusColors = {
        non_justifie: { badge: "bg-danger", color: "text-danger", label: "Non justifiée" },
        justifie: { badge: "bg-success", color: "text-success", label: "Justifiée" },
        retard: { badge: "bg-warning", color: "text-warning", label: "Retard" },
        absence_excusee: { badge: "bg-info", color: "text-info", label: "Absence excusée" },
    };

    const statusConfig = statusColors[absence?.status] || statusColors.non_justifie;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        const options = { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" };
        return new Date(dateStr).toLocaleDateString("fr-FR", options);
    };

    const handleStatusChange = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await dispatch(
                updateAttendanceStatus({
                    id: absence.id,
                    status: selectedStatus,
                })
            ).unwrap();
            showToast("Statut d'absence mis à jour avec succès", "success");
            setEditingStatus(false);
        } catch (error) {
            showToast("Erreur lors de la mise à jour du statut", "error");
        } finally {
            setSaving(false);
        }
    };

    if (!absence) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom">
                    <h3 className="mb-0">Détails de l'absence</h3>
                    <button type="button" className="btn-close" onClick={onClose}></button>
                </div>

                {/* Content */}
                <div className="modal-body">
                    {/* Stagiaire Name */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">Stagiaire</label>
                        <p className="mb-0">{absence.stagiaireNom || "—"}</p>
                    </div>

                    {/* Date */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">Date</label>
                        <p className="mb-0">{formatDate(absence.date)}</p>
                    </div>

                    {/* Status */}
                    <div className="mb-4">
                        <label className="form-label fw-semibold">Statut de l'Absence</label>
                        {!editingStatus ? (
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className={`badge ${statusConfig.badge} py-2 px-3`}>
                                    <i className="bi bi-circle-fill me-2" style={{ fontSize: "0.5rem" }}></i>
                                    {statusConfig.label}
                                </span>
                                {isAdmin ? (
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-primary"
                                        onClick={() => setEditingStatus(true)}
                                    >
                                        <i className="bi bi-pencil me-1"></i>Modifier
                                    </button>
                                ) : (
                                    <small className="text-muted fw-normal">
                                        <i className="bi bi-lock-fill me-1"></i>Seul l'admin peut modifier
                                    </small>
                                )}
                            </div>
                        ) : (
                            canEditStatus ? (
                                <form onSubmit={handleStatusChange} className="d-flex gap-2 align-items-end">
                                    <select
                                        className="form-select form-select-sm"
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                    >
                                        <option value="non_justifie">Non justifiée</option>
                                        <option value="justifie">Justifiée</option>
                                        <option value="retard">Retard</option>
                                        <option value="absence_excusee">Absence excusée</option>
                                    </select>
                                    <button type="submit" className="btn btn-sm btn-primary" disabled={saving}>
                                        {saving ? "Enregistrement..." : "Enregistrer"}
                                    </button>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-secondary"
                                        onClick={() => {
                                            setEditingStatus(false);
                                            setSelectedStatus(absence.status);
                                        }}
                                        disabled={saving}
                                    >
                                        Annuler
                                    </button>
                                </form>
                            ) : (
                                <div className="alert alert-warning py-2 px-3 mb-0 small">
                                    <i className="bi bi-exclamation-triangle me-2"></i>
                                    Seul l'administrateur peut modifier le statut d'une absence.
                                </div>
                            )
                        )}
                    </div>

                    {/* Created Info */}
                    <div className="mb-4 p-3 bg-light rounded">
                        <label className="form-label fw-semibold mb-2">Créée par</label>
                        <p className="mb-1">{absence.createdByUser?.name || "—"}</p>
                        <small className="text-muted">{formatDate(absence.created_at)}</small>
                    </div>

                    {/* Updated Info */}
                    {absence.updated_by_user_id && (
                        <div className="mb-4 p-3 bg-light rounded">
                            <label className="form-label fw-semibold mb-2">Dernière modification par</label>
                            <p className="mb-1">{absence.updatedByUser?.name || "—"}</p>
                            <small className="text-muted">{formatDate(absence.updated_at)}</small>
                        </div>
                    )}

                    {/* Justification */}
                    {absence.justification && (
                        <div className="mb-4 p-3 bg-light rounded">
                            <label className="form-label fw-semibold mb-2">Justification</label>
                            <p className="mb-0">{absence.justification}</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="d-flex justify-content-end gap-2 pt-3 border-top">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>
                        Fermer
                    </button>
                </div>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1050;
        }
        .modal-content {
          background: white;
          border-radius: 0.5rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          max-width: 500px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          padding: 2rem;
        }
        .modal-body {
          margin: 0;
        }
      `}</style>
        </div>
    );
}

export default AbsenceDetailModal;
