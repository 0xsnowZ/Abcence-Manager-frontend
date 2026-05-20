import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createStagiaire, updateStagiaire } from "../store/stagiaireSlice.jsx";
import { useToast } from "./ToastProvider.jsx";

const NEW_FILIERE_KEY = "__new__";

function StagiaireForm({
  stagiaire,
  onCancel,
  onSave,
  filieres = [],
  programmes = [],
}) {
  const dispatch = useDispatch();
  const showToast = useToast();
  const { user } = useSelector((state) => state.auth);
  const isProf = user?.role === "prof";
  const profFilieres = useMemo(
    () =>
      isProf && user?.programmes?.length > 0
        ? user.programmes.map((p) => p.code_diplome)
        : [],
    [isProf, user],
  );

  const availableFilieres = useMemo(() => {
    if (profFilieres.length > 0)
      return filieres.filter((f) => profFilieres.includes(f));
    return filieres;
  }, [filieres, profFilieres]);

  const getInitialFormData = () => ({
    nom: stagiaire?.nom || "",
    prenom: stagiaire?.prenom || "",
    filiere:
      stagiaire?.programmes?.[0]?.code_diplome ||
      (profFilieres.length === 1 ? profFilieres[0] : ""),
    sexe: stagiaire?.sexe || "m",
    matricule: stagiaire?.matricule || "",
  });

  const [formData, setFormData] = useState(getInitialFormData);
  const [errors, setErrors] = useState({});
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const nextFormData = getInitialFormData();
    const currentFiliere = nextFormData.filiere;

    setFormData(nextFormData);
    setShowCustomInput(
      !!currentFiliere && !availableFilieres.includes(currentFiliere),
    );
    setErrors({});
  }, [stagiaire, availableFilieres, profFilieres]);

  const validate = () => {
    const newErrors = {};
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!formData.filiere.trim()) newErrors.filiere = "La filière est requise";
    if (!formData.matricule) newErrors.matricule = "Le matricule est requis";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    // Find programme_id from filiere code
    const programme = programmes.find(
      (p) => p.code_diplome === formData.filiere,
    );

    const payload = {
      nom: formData.nom,
      prenom: formData.prenom,
      sexe: formData.sexe,
      matricule: formData.matricule,
      // filiere stored locally for display
      filiere: formData.filiere,
      programme_code: formData.filiere,
    };

    try {
      if (stagiaire) {
        await dispatch(
          updateStagiaire({ id: stagiaire.id, ...payload }),
        ).unwrap();
        showToast("Stagiaire mis à jour avec succès.", "success");
      } else {
        await dispatch(createStagiaire(payload)).unwrap();
        showToast("Stagiaire créé avec succès.", "success");
      }
      onSave();
    } catch (err) {
      showToast("Erreur lors de l'enregistrement.", "error");
      setErrors({ submit: err });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
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
    <div className="card-premium overflow-hidden">
      <div
        className="card-header py-3 px-4"
        style={{ background: "var(--color-primary)" }}
      >
        <h5 className="mb-0 label-caps text-white d-flex align-items-center gap-2">
          <i className="bi bi-person-plus-fill"></i>
          {stagiaire ? "Modifier le Profil" : "Nouveau Stagiaire"}
        </h5>
      </div>
      <div className="card-body p-4">
        {errors.submit && (
          <div className="alert alert-danger py-2 small mb-3">
            {errors.submit}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          {/* Matricule */}
          <div className="mb-3">
            <label className="form-label label-caps">Matricule</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-hash text-dark-navy"></i>
              </span>
              <input
                type="number"
                className={`form-control form-control-lg border-start-0 bg-light ${errors.matricule ? "is-invalid" : ""}`}
                name="matricule"
                value={formData.matricule}
                onChange={handleChange}
                placeholder="Ex: 12345"
                disabled={!!stagiaire}
              />
            </div>
            {errors.matricule && (
              <div className="text-danger small mt-1">{errors.matricule}</div>
            )}
          </div>

          {/* Prénom */}
          <div className="mb-3">
            <label className="form-label label-caps">Prénom</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-person text-dark-navy"></i>
              </span>
              <input
                type="text"
                className={`form-control form-control-lg border-start-0 bg-light ${errors.prenom ? "is-invalid" : ""}`}
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Ex: Ahmed"
              />
            </div>
            {errors.prenom && (
              <div className="text-danger small mt-1">{errors.prenom}</div>
            )}
          </div>

          {/* Nom */}
          <div className="mb-4">
            <label className="form-label label-caps">Nom de famille</label>
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
                placeholder="Ex: Alami"
              />
            </div>
            {errors.nom && (
              <div className="text-danger small mt-1">{errors.nom}</div>
            )}
          </div>

          {/* Filière */}
          <div className="mb-4">
            <label className="form-label label-caps">Filière / Classe</label>
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-mortarboard text-dark-navy"></i>
              </span>
              <select
                className={`form-select form-select-lg border-start-0 bg-light ${errors.filiere ? "is-invalid" : ""}`}
                value={showCustomInput ? NEW_FILIERE_KEY : formData.filiere}
                onChange={handleFiliereSelect}
                disabled={profFilieres.length === 1}
              >
                <option value="">-- Sélectionner une filière --</option>
                {availableFilieres.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
                {!isProf && (
                  <option value={NEW_FILIERE_KEY}>
                    ✏️ Nouvelle filière...
                  </option>
                )}
              </select>
            </div>
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

          {/* Genre */}
          <div className="mb-4">
            <label className="form-label label-caps d-block mb-3">Genre</label>
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
                  <i className="bi bi-gender-male me-1 text-dark-navy"></i>
                  Masculin
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
                  <i className="bi bi-gender-female me-1 text-danger"></i>
                  Féminin
                </label>
              </div>
            </div>
          </div>

          <div className="d-flex gap-3 pt-3">
            <button
              type="submit"
              className="btn-navy flex-grow-1 justify-content-center py-2"
              disabled={saving}
            >
              {saving ? (
                <span className="spinner-border spinner-border-sm me-2" />
              ) : (
                <i className="bi bi-check-lg fs-5"></i>
              )}
              {stagiaire ? "Mettre à jour" : "Enregistrer"}
            </button>
            <button
              type="button"
              className="btn-navy-outline py-2 px-4"
              onClick={onCancel}
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StagiaireForm;
