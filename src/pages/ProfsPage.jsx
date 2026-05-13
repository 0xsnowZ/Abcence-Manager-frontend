import React, { useState, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { addProf, updateProf, deleteProf } from "../store/profSlice.jsx";

// ── ProfForm ────────────────────────────────────────────────────────────────
function ProfForm({ prof, onCancel, onSave, allFilieres }) {
  const [form, setForm] = useState(
    prof
      ? { nom: prof.nom, email: prof.email, password: prof.password, filieres: prof.filieres || [] }
      : { nom: "", email: "", password: "", filieres: [] }
  );
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.nom.trim()) e.nom = "Le nom est requis";
    if (!form.email.trim()) e.email = "L'email est requis";
    if (!prof && !form.password.trim()) e.password = "Le mot de passe est requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const toggleFiliere = (f) => {
    setForm((p) => ({
      ...p,
      filieres: p.filieres.includes(f)
        ? p.filieres.filter((x) => x !== f)
        : [...p.filieres, f],
    }));
  };

  return (
    <div className="card border-0 shadow-lg overflow-hidden">
      {/* Accent bar */}
      <div style={{ height: 4, background: "linear-gradient(90deg,#0A121A,#334155)" }} />
      <div className="card-header bg-white py-4 border-bottom-0">
        <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
          <span className="bg-dark-navy text-white p-2 rounded me-3 d-flex">
            <i className="bi bi-person-plus-fill"></i>
          </span>
          {prof ? "Modifier le Professeur" : "Nouveau Professeur"}
        </h5>
      </div>

      <div className="card-body p-4 bg-light border-top border-bottom">
        {/* Nom */}
        <div className="mb-3">
          <label className="form-label fw-bold small text-muted text-uppercase">Nom complet</label>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-person text-dark-navy"></i>
            </span>
            <input
              type="text"
              className={`form-control border-start-0 ${errors.nom ? "is-invalid" : ""}`}
              name="nom"
              value={form.nom}
              onChange={handleChange}
              placeholder="Ex: Ahmed Alami"
            />
          </div>
          {errors.nom && <div className="text-danger small mt-1">{errors.nom}</div>}
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label fw-bold small text-muted text-uppercase">Adresse Email</label>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-envelope text-dark-navy"></i>
            </span>
            <input
              type="email"
              className={`form-control border-start-0 ${errors.email ? "is-invalid" : ""}`}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="prof@school.ma"
            />
          </div>
          {errors.email && <div className="text-danger small mt-1">{errors.email}</div>}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase">
            Mot de passe {prof && <span className="text-muted fw-normal">(laisser vide pour ne pas changer)</span>}
          </label>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-key text-dark-navy"></i>
            </span>
            <input
              type={showPass ? "text" : "password"}
              className={`form-control border-start-0 border-end-0 ${errors.password ? "is-invalid" : ""}`}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="input-group-text bg-white border-start-0"
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
            >
              <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"} text-muted`}></i>
            </button>
          </div>
          {errors.password && <div className="text-danger small mt-1">{errors.password}</div>}
        </div>

        {/* Filières multi-select */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase d-flex justify-content-between">
            <span>Filières assignées</span>
            {form.filieres.length > 0 && (
              <span className="badge bg-dark-navy rounded-pill">{form.filieres.length} sélectionnée(s)</span>
            )}
          </label>
          {allFilieres.length === 0 ? (
            <p className="text-muted small fst-italic">Aucune filière disponible (ajoutez des stagiaires d'abord).</p>
          ) : (
            <div className="d-flex flex-wrap gap-2">
              {allFilieres.map((f) => {
                const checked = form.filieres.includes(f);
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => toggleFiliere(f)}
                    className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${
                      checked
                        ? "btn-dark-navy"
                        : "btn-outline-secondary"
                    }`}
                  >
                    {checked && <i className="bi bi-check me-1"></i>}
                    {f}
                  </button>
                );
              })}
            </div>
          )}
          <div className="mt-2">
            <small className="text-muted">
              <i className="bi bi-info-circle me-1"></i>
              Le professeur ne verra que ces filières dans la page Saisie.
              {form.filieres.length === 0 && " (Aucune restriction si vide)"}
            </small>
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 pt-3 border-top">
          <button
            className="btn btn-dark-navy rounded-pill px-4 fw-bold flex-grow-1"
            onClick={() => {
              if (!validate()) return;
              const payload = { ...form };
              if (prof && !payload.password) payload.password = prof.password;
              if (prof) payload.id = prof.id;
              onSave(payload);
            }}
          >
            <i className="bi bi-check2-all me-2"></i>
            {prof ? "Enregistrer les modifications" : "Créer le Professeur"}
          </button>
          <button
            className="btn btn-outline-secondary rounded-pill px-4 fw-bold"
            onClick={onCancel}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProfsPage ────────────────────────────────────────────────────────────────
function ProfsPage() {
  const dispatch = useDispatch();
  const profs = useSelector((state) => state.profs.items);
  const stagiaires = useSelector((state) => state.stagiaires.items);

  const allFilieres = useMemo(
    () => [...new Set(stagiaires.map((s) => s.filiere))].sort(),
    [stagiaires]
  );

  const [selectedProf, setSelectedProf] = useState(null); // null=hidden, false=new, obj=edit
  const [searchTerm, setSearchTerm] = useState("");

  const filteredProfs = profs.filter(
    (p) =>
      p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (payload) => {
    if (selectedProf && selectedProf.id) {
      dispatch(updateProf(payload));
    } else {
      dispatch(addProf(payload));
    }
    setSelectedProf(null);
  };

  const handleDelete = (id) => {
    if (window.confirm("Supprimer ce professeur ? Il ne pourra plus se connecter.")) {
      dispatch(deleteProf(id));
    }
  };

  return (
    <div className="container py-4">
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h2 className="fw-bold mb-0 d-flex align-items-center">
            <i className="bi bi-person-gear me-3 text-dark-navy"></i>
            Gestion des Professeurs
          </h2>
          <p className="text-muted mb-0 mt-1">
            Créez les comptes professeurs et assignez-leur leurs filières.
          </p>
        </div>
        <button
          className="btn btn-dark-navy rounded-pill px-4 fw-bold shadow-sm"
          onClick={() => setSelectedProf(false)}
        >
          <i className="bi bi-plus-lg me-2"></i>Ajouter un Professeur
        </button>
      </div>

      <div className="row g-4">
        {/* ── LEFT: List ── */}
        <div className={selectedProf !== null ? "col-lg-7" : "col-12"}>
          <div className="card border-0 shadow-sm overflow-hidden">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-bottom-0">
              <h5 className="mb-0 fw-bold d-flex align-items-center">
                <span className="bg-dark-navy text-white p-2 rounded me-3">
                  <i className="bi bi-people-fill"></i>
                </span>
                Professeurs
              </h5>
              <span className="badge rounded-pill border text-dark px-3">
                {filteredProfs.length} prof{filteredProfs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Search */}
            <div className="px-3 pb-2 pt-2 border-bottom">
              <div className="input-group shadow-none rounded-pill overflow-hidden border">
                <span className="input-group-text bg-white border-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-white"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ boxShadow: "none" }}
                />
              </div>
            </div>

            <div className="card-body p-0">
              {filteredProfs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-people fs-1 d-block mb-3 opacity-25"></i>
                  <p className="fw-medium">
                    {searchTerm ? "Aucun résultat" : 'Aucun professeur. Cliquez sur "Ajouter un Professeur".'}
                  </p>
                </div>
              ) : (
                <table className="table align-middle table-hover mb-0">
                  <thead className="bg-light text-muted small text-uppercase fw-bold">
                    <tr>
                      <th className="ps-4 py-3">Professeur</th>
                      <th className="py-3">Filières assignées</th>
                      <th className="py-3 text-end pe-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProfs.map((p) => (
                      <tr key={p.id} className="prof-row">
                        <td className="ps-4">
                          <div className="d-flex align-items-center">
                            <div
                              className="rounded-circle bg-dark-navy text-white d-flex align-items-center justify-content-center me-3 fw-bold flex-shrink-0"
                              style={{ width: 38, height: 38, fontSize: 15 }}
                            >
                              {p.nom.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="fw-bold text-dark">{p.nom}</div>
                              <small className="text-muted">{p.email}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          {p.filieres && p.filieres.length > 0 ? (
                            <div className="d-flex flex-wrap gap-1">
                              {p.filieres.map((f) => (
                                <span
                                  key={f}
                                  className="badge rounded-pill bg-dark-navy px-2"
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  {f}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="badge rounded-pill bg-light text-muted border" style={{ fontSize: "0.7rem" }}>
                              Toutes (sans restriction)
                            </span>
                          )}
                        </td>
                        <td className="text-end pe-4">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn-action-round btn-edit shadow-sm"
                              title="Modifier"
                              onClick={() => setSelectedProf(p)}
                            >
                              <i className="bi bi-pencil-fill"></i>
                            </button>
                            <button
                              className="btn-action-round btn-delete shadow-sm"
                              title="Supprimer"
                              onClick={() => handleDelete(p.id)}
                            >
                              <i className="bi bi-trash3-fill"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        {selectedProf !== null && (
          <div className="col-lg-5">
            <ProfForm
              prof={selectedProf || null}
              allFilieres={allFilieres}
              onCancel={() => setSelectedProf(null)}
              onSave={handleSave}
            />
          </div>
        )}
      </div>

      <style>{`
        .bg-dark-navy { background-color: #0A121A; }
        .text-dark-navy { color: #0A121A; }
        .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; transition: all 0.2s; }
        .btn-dark-navy:hover { background-color: #1a232f; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .btn-action-round { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.85rem; }
        .btn-edit { background-color: #fff; color: #0d6efd; border: 1px solid #e7f1ff; }
        .btn-edit:hover { background-color: #0d6efd; color: #fff; transform: scale(1.1); }
        .btn-delete { background-color: #fff; color: #dc3545; border: 1px solid #fceaea; }
        .btn-delete:hover { background-color: #dc3545; color: #fff; transform: scale(1.1); }
        .prof-row { transition: background 0.15s; }
        .prof-row:hover { background: #f8f9fa; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}

export default ProfsPage;
