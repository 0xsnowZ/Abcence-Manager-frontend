import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { updateAttendance, fetchAttendances } from "../store/absenceSlice.jsx";

function AbsenceForm({ absence, onCancel, onSave }) {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);

  const [formData, setFormData] = useState({
    idstag: "",
    date: "",
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
        justifie: absence.justifie ?? !!absence.justification,
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
        await dispatch(
          updateAttendance({
            id: absence.id,
            justification: formData.justifie
              ? formData.justification || "Justifié"
              : null,
            type_absence_id: absence.type_absence_id,
          })
        ).unwrap();
        await dispatch(fetchAttendances());
      }
      onSave();
    } catch (err) {
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
      className="card border-0 shadow-lg overflow-hidden position-relative"
      style={{ zIndex: 10 }}
    >
      <div className="bg-dark-navy" style={{ height: "4px" }}></div>
      <div className="card-header bg-white py-4 border-bottom-0">
        <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
          <span className="bg-soft-dark-navy text-dark-navy p-2 rounded me-3 d-flex">
            <i className="bi bi-calendar-plus"></i>
          </span>
          {absence ? "Modifier l'Absence" : "Saisir une Absence"}
        </h5>
        <p className="text-muted small mt-2 mb-0 ms-5 ps-1">
          {absence
            ? "Modifiez le statut de justification de cette absence."
            : "Remplissez les informations ci-dessous."}
        </p>
      </div>

      <div className="card-body p-4 bg-light border-top border-bottom">
        {errors.submit && (
          <div className="alert alert-danger py-2 small mb-3">{errors.submit}</div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Stagiaire selector (read-only when editing) */}
          <div className="mb-4">
            <label className="form-label fw-bold small text-muted text-uppercase">
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
            <div className="col-md-7">
              <label className="form-label fw-bold small text-muted text-uppercase">
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
            <div className="col-md-5">
              <label className="form-label fw-bold small text-muted text-uppercase">
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

          {/* Justification toggle */}
          <div className="mb-4 bg-white p-3 rounded border shadow-sm d-inline-block w-100">
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

          <div className="d-flex gap-3 pt-3 border-top mt-2">
            <button
              type="submit"
              className="btn btn-dark-navy rounded-pill px-5 py-3 fw-bold shadow-sm d-flex align-items-center justify-content-center flex-grow-1 fs-5"
              disabled={saving}
            >
              {saving ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-check2-all me-2"></i>
              )}
              {absence ? "Enregistrer les modifications" : "Valider l'Absence"}
            </button>
            <button
              type="button"
              className="btn btn-light border rounded-pill px-4 py-3 fw-bold d-flex align-items-center text-secondary"
              onClick={onCancel}
            >
              <i className="bi bi-x-lg me-2"></i>Annuler
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .bg-dark-navy { background-color: #0A121A; }
        .text-dark-navy { color: #0A121A; }
        .bg-soft-dark-navy { background-color: #e7f1ff; }
        .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; }
        .btn-dark-navy:hover { background-color: #1a232f; color: #fff; }
        .custom-switch .form-check-input:checked { background-color: #198754; border-color: #198754; }
      `}</style>
    </div>
  );
}

export default AbsenceForm;
