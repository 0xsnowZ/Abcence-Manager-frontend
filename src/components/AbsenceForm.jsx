import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { createAttendance, updateAttendance, fetchAttendances } from "../store/absenceSlice.jsx";
import { useToast } from "./ToastProvider.jsx";

function AbsenceForm({ absence, onCancel, onSave }) {
  const dispatch = useDispatch();
  const showToast = useToast();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const user = useSelector((state) => state.auth.user);

  const [formData, setFormData] = useState({
    idstag: "",
    date: "",
    status: "non_justifie",
    justifie: false,
    justification: "",
    heures: 2.5,
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (absence) {
      setFormData({
        idstag: (absence.stagiaire_id ?? absence.idstag ?? "").toString(),
        date: absence.date ?? "",
        status: absence.status || "non_justifie",
        justifie: absence.status === "justifie" || !!absence.justification,
        justification: absence.justification || "",
        heures: absence.heures || 2.5,
      });
    } else if (stagiaires.length > 0) {
      setFormData((prev) => ({ ...prev, idstag: stagiaires[0].id.toString() }));
    }
  }, [absence, stagiaires]);

  const validate = () => {
    const newErrors = {};
    if (!formData.idstag) newErrors.idstag = "Veuillez sélectionner un stagiaire";
    if (!formData.date) newErrors.date = "La date est requise";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      if (absence) {
        // Update existing absence
        await dispatch(
          updateAttendance({
            id: absence.id,
            justification: formData.justifie
              ? formData.justification || "Justifié"
              : null,
            type_absence_id: absence.type_absence_id,
          })
        ).unwrap();
        showToast("Absence mise à jour avec succès.", "success");
      } else {
        // Create new absence
        await dispatch(
          createAttendance({
            session_id: 1, // Placeholder - should come from context or props
            stagiaire_id: parseInt(formData.idstag),
            type_absence_id: 2, // ABSENT type
            status: "non_justifie",
            justification: null,
          })
        ).unwrap();
        showToast("Absence créée avec succès.", "success");
      }
      await dispatch(fetchAttendances());
      onSave();
    } catch (err) {
      showToast(String(err) || "Erreur lors de l'enregistrement.", "error");
      setErrors({ submit: String(err) });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const getDisplayName = (s) =>
    s.prenom ? `${s.prenom} ${s.nom}` : s.nomComplet || s.nom;

  if (stagiaires.length === 0) {
    return (
      <div className="card">
        <div className="card-body text-center py-4">
          <i className="bi bi-exclamation-triangle fs-1 text-warning mb-2"></i>
          <p className="mb-0">Veuillez d'abord ajouter des stagiaires.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-premium overflow-hidden position-relative"
      style={{ zIndex: 10 }}
    >
      <div style={{ height: "4px", background: "var(--color-accent)" }}></div>
      <div className="card-header py-4 px-4">
        <h5 className="section-title mb-0 d-flex align-items-center gap-3">
          <span className="avatar-circle avatar-sm" style={{ background: "var(--color-primary-light)", color: "var(--color-primary)" }}>
            <i className="bi bi-calendar-plus" style={{ fontSize: "0.75rem" }}></i>
          </span>
          {absence ? "Modifier l'Absence" : "Saisir une Absence"}
        </h5>
        <p className="body-sm mt-2 mb-0 ms-5 ps-1">
          {absence
            ? "Modifiez le statut de justification de cette absence."
            : "Remplissez les informations ci-dessous. Utilisez le Registre de Présence pour enregistrer plusieurs absences à la fois."}
        </p>
      </div>

      <div className="card-body p-4 border-top border-bottom" style={{ background: "var(--color-bg)" }}>
        {errors.submit && (
          <div className="alert alert-danger py-2 small mb-3">{errors.submit}</div>
        )}

        {!absence && (
          <div className="alert alert-info alert-dismissible fade show mb-3 py-2 small" role="alert">
            <i className="bi bi-info-circle me-2"></i>
            <strong>💡 Conseil :</strong> Pour enregistrer plusieurs absences à la fois, utilisez le <strong>Registre de Présence</strong> depuis la page d'accueil.
            <button type="button" className="btn-close btn-sm" data-bs-dismiss="alert" aria-label="Close"></button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Stagiaire selector (read-only when editing) */}
          <div className="mb-4">
            <label className="form-label label-caps">
              Cible Stagiaire
            </label>
            <div className="input-group input-group-lg shadow-sm">
              <span className="input-group-text bg-white text-dark-navy border-end-0">
                <i className="bi bi-person-badge"></i>
              </span>
              <select
                className={`form-select form-select-lg border-start-0 ${errors.idstag ? "is-invalid" : ""}`}
                name="idstag"
                value={formData.idstag}
                onChange={handleChange}
                disabled={!!absence}
              >
                <option value="">Sélectionner un stagiaire...</option>
                {stagiaires.map((s) => (
                  <option key={s.id} value={s.id}>
                    {getDisplayName(s)} — {s.filiere || s.programme_code || ""}
                  </option>
                ))}
              </select>
            </div>
            {errors.idstag && (
              <div className="text-danger small mt-2 fw-medium">
                <i className="bi bi-exclamation-circle me-1"></i>
                {errors.idstag}
              </div>
            )}
          </div>

          {/* Date (read-only when editing) */}
          <div className="row g-4 mb-4">
            <div className="col-12 col-md-7">
              <label className="form-label label-caps">
                Date Relevée
              </label>
              <div className="input-group input-group-lg shadow-sm">
                <span className="input-group-text bg-white text-dark-navy border-end-0">
                  <i className="bi bi-calendar-event"></i>
                </span>
                <input
                  type="date"
                  className={`form-control border-start-0 ${errors.date ? "is-invalid" : ""}`}
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  readOnly={!!absence}
                />
              </div>
              {errors.date && (
                <div className="text-danger small mt-1">{errors.date}</div>
              )}
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label label-caps">
                Heures Manquées
              </label>
              <div className="input-group input-group-lg shadow-sm">
                <span className="input-group-text bg-white text-dark-navy border-end-0">
                  <i className="bi bi-clock-history"></i>
                </span>
                <input
                  type="number"
                  min="0.5"
                  max="10"
                  step="0.5"
                  className="form-control border-start-0"
                  name="heures"
                  value={formData.heures}
                  onChange={handleChange}
                  readOnly={!!absence}
                />
              </div>
            </div>
          </div>

          {/* Status display (read-only for teachers) */}
          {absence && (
            <div className="mb-4 p-3 rounded-3 border" style={{ background: "var(--color-surface)" }}>
              <label className="form-label label-caps fw-bold mb-2">
                Statut de l'Absence
              </label>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <span className={`badge py-2 px-3 ${
                  formData.status === "non_justifie" ? "bg-danger" :
                  formData.status === "justifie" ? "bg-success" :
                  formData.status === "retard" ? "bg-warning" :
                  "bg-info"
                }`}>
                  <i className="bi bi-circle-fill me-2" style={{ fontSize: "0.5rem" }}></i>
                  {formData.status === "non_justifie" ? "Non justifiée" :
                   formData.status === "justifie" ? "Justifiée" :
                   formData.status === "retard" ? "Retard" :
                   "Absence excusée"}
                </span>
                {user?.role === "admin" && (
                  <small className="text-muted fw-normal">
                    <i className="bi bi-info-circle me-1"></i>
                    Pour modifier le statut, utilisez le bouton "Détails" dans la liste
                  </small>
                )}
                {user?.role !== "admin" && (
                  <small className="text-muted fw-normal">
                    <i className="bi bi-lock-fill me-1"></i>
                    Le statut ne peut être modifié que par l'administrateur
                  </small>
                )}
              </div>
            </div>
          )}

          {/* Justification toggle (only for edit mode, when user is admin) */}
          {absence && user?.role === "admin" && (
            <div className="mb-4 p-3 rounded-3 border d-inline-block w-100" style={{ background: "var(--color-surface)" }}>
              <div className="form-check form-switch custom-switch d-flex align-items-center mb-0">
                <input
                  className="form-check-input ms-0 me-3 mt-0"
                  type="checkbox"
                  name="justifie"
                  id="justifie"
                  style={{ width: "3rem", height: "1.5rem", cursor: "pointer" }}
                  checked={formData.justifie}
                  onChange={handleChange}
                />
                <label
                  className="form-check-label fw-bold text-dark d-flex flex-column justify-content-center"
                  htmlFor="justifie"
                  style={{ cursor: "pointer" }}
                >
                  {formData.justifie ? (
                    <>
                      <span className="text-success fs-6">
                        <i className="bi bi-shield-check me-1"></i>Absence Justifiée
                      </span>
                      <span className="small text-muted fw-normal" style={{ fontSize: "0.75rem" }}>
                        Motif valable fourni
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-danger fs-6">
                        <i className="bi bi-shield-x me-1"></i>Non Justifiée
                      </span>
                      <span className="small text-muted fw-normal" style={{ fontSize: "0.75rem" }}>
                        En attente de justificatif
                      </span>
                    </>
                  )}
                </label>
              </div>
              {formData.justifie && (
                <div className="mt-3">
                  <input
                    type="text"
                    className="form-control"
                    name="justification"
                    value={formData.justification}
                    onChange={handleChange}
                    placeholder="Motif de justification (optionnel)"
                  />
                </div>
              )}
            </div>
          )}

          {/* Read-only justification display (for teachers viewing their absences) */}
          {absence && user?.role !== "admin" && (
            <div className="mb-4 p-3 rounded-3 border" style={{ background: "var(--color-surface)" }}>
              <label className="form-label fw-semibold mb-2">Justification</label>
              {formData.justification ? (
                <p className="mb-0 text-muted">{formData.justification}</p>
              ) : (
                <p className="mb-0 text-muted fw-normal">
                  <i className="bi bi-info-circle me-1"></i>
                  Aucune justification fournie
                </p>
              )}
            </div>
          )}

          <div className="d-flex gap-3 pt-3 border-top mt-2">
            <button
              type="submit"
              className="btn-navy flex-grow-1 justify-content-center py-2"
              style={{ fontSize: "0.95rem" }}
              disabled={saving}
            >
              {saving ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-check2-all"></i>
              )}
              {absence ? "Enregistrer les modifications" : "Valider l'Absence"}
            </button>
            <button
              type="button"
              className="btn-navy-outline py-2 px-4"
              onClick={onCancel}
            >
              <i className="bi bi-x-lg me-2"></i>Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AbsenceForm;
