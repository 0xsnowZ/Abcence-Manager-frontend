import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addStagiaire, updateStagiaire } from "../store/stagiaireSlice.jsx";

// Stagiaire Form Component

const NEW_FILIERE_KEY = "__new__";

function StagiaireForm({ stagiaire, onCancel, onSave }) {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const { user } = useSelector((state) => state.auth);
  
  const isProf = user?.role === 'prof';
  const profFilieres = isProf && user?.filieres?.length > 0 ? user.filieres : [];

  // Derive sorted unique filières from existing stagiaires, but filter for profs
  const filieres = useMemo(() => {
    const all = [...new Set(stagiaires.map((s) => s.filiere))].sort();
    if (profFilieres.length > 0) {
      return all.filter(f => profFilieres.includes(f));
    }
    return all;
  }, [stagiaires, profFilieres]);

  const [formData, setFormData] = useState({
    nom: "",
    filiere: profFilieres.length === 1 ? profFilieres[0] : "",
    sexe: "m",
  });
  const [errors, setErrors] = useState({});
  // Controls whether the "new filière" text input is shown
  const [showCustomInput, setShowCustomInput] = useState(false);

  useEffect(() => {
    if (stagiaire) {
      const isExisting = filieres.includes(stagiaire.filiere);
      setShowCustomInput(!isExisting && !!stagiaire.filiere);
      setFormData({
        nom: stagiaire.nom || "",
        filiere: stagiaire.filiere || "",
        sexe: stagiaire.sexe || "m",
      });
    } else if (profFilieres.length === 1) {
       // Reset for new stagiaire if prof has exactly one filiere
       setFormData(p => ({ ...p, filiere: profFilieres[0] }));
    }
  }, [stagiaire, filieres, profFilieres]);

  const validate = () => {
    const newErrors = {};
    if (!formData.nom.trim()) {
      newErrors.nom = "Le nom est requis";
    }
    if (!formData.filiere.trim()) {
      newErrors.filiere = "La filière est requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      if (stagiaire) {
        dispatch(updateStagiaire({ ...stagiaire, ...formData }));
      } else {
        dispatch(addStagiaire(formData));
      }
      onSave();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFiliereSelect = (e) => {
    const val = e.target.value;
    if (val === NEW_FILIERE_KEY) {
      setShowCustomInput(true);
      setFormData((prev) => ({ ...prev, filiere: "" }));
    } else {
      setShowCustomInput(false);
      setFormData((prev) => ({ ...prev, filiere: val }));
    }
    if (errors.filiere) setErrors((prev) => ({ ...prev, filiere: null }));
  };

  return (
    <div className="card border-0 shadow-lg overflow-hidden">
      <div className="card-header bg-dark-navy text-white py-3">
        <h5 className="mb-0 fw-bold small text-uppercase tracking-wider">
          <i className="bi bi-person-plus-fill me-2"></i>
          {stagiaire ? "Modifier le Profil" : "Nouveau Stagiaire"}
        </h5>
      </div>
      <div className="card-body p-4">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="form-label fw-bold small text-muted text-uppercase">Nom Complet</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person text-dark-navy"></i>
              </span>
              <input
                type="text"
                className={`form-control form-control-lg border-start-0 bg-light ${errors.nom ? "is-invalid" : ""}`}
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Ex: Ahmed Alami"
              />
            </div>
            {errors.nom && <div className="text-danger small mt-1">{errors.nom}</div>}
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold small text-muted text-uppercase">Filière / Classe</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-mortarboard text-dark-navy"></i>
              </span>
              <select
                className={`form-select form-select-lg border-start-0 bg-light ${errors.filiere ? "is-invalid" : ""}`}
                value={showCustomInput ? NEW_FILIERE_KEY : formData.filiere}
                onChange={handleFiliereSelect}
              >
                <option value="">-- Sélectionner une filière --</option>
                {filieres.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
                {!isProf && <option value={NEW_FILIERE_KEY}>✏️ Nouvelle filière...</option>}
              </select>
            </div>
            {/* Custom filière text input, shown when user picks "Nouvelle filière..." */}
            {showCustomInput && !isProf && (
              <div className="input-group mt-2">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-pencil-fill text-dark-navy"></i>
                </span>
                <input
                  type="text"
                  className={`form-control form-control-lg border-start-0 bg-light ${errors.filiere ? "is-invalid" : ""}`}
                  name="filiere"
                  value={formData.filiere}
                  onChange={handleChange}
                  placeholder="Ex: DD105"
                  autoFocus
                />
              </div>
            )}
            {errors.filiere && (
              <div className="text-danger small mt-1">{errors.filiere}</div>
            )}
          </div>

          <div className="mb-4">
            <label className="form-label fw-bold small text-muted text-uppercase d-block mb-3">Genre</label>
            <div className="d-flex gap-4">
              <div className="form-check custom-radio">
                <input
                  className="form-check-input"
                  type="radio"
                  name="sexe"
                  id="sexeM"
                  value="m"
                  checked={formData.sexe === "m"}
                  onChange={handleChange}
                />
                <label className="form-check-label fw-medium" htmlFor="sexeM">
                  <i className="bi bi-gender-male me-1 text-dark-navy"></i>Masculin
                </label>
              </div>
              <div className="form-check custom-radio">
                <input
                  className="form-check-input"
                  type="radio"
                  name="sexe"
                  id="sexeF"
                  value="f"
                  checked={formData.sexe === "f"}
                  onChange={handleChange}
                />
                <label className="form-check-label fw-medium" htmlFor="sexeF">
                  <i className="bi bi-gender-female me-1 text-danger"></i>Féminin
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 pt-3">
            <button type="submit" className="btn btn-dark-navy rounded-pill px-4 py-2 fw-bold shadow-sm d-flex align-items-center flex-grow-1 justify-content-center">
              <i className="bi bi-check-lg me-2 fs-5"></i>
              {stagiaire ? "Mettre à jour" : "Enregistrer"}
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-bold d-flex align-items-center"
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
      <style>{`
        .tracking-wider { letter-spacing: 0.05em; }
        .custom-radio .form-check-input:checked { background-color: #0A121A; border-color: #0A121A; }
      `}</style>
    </div>
  );
}

export default StagiaireForm;
