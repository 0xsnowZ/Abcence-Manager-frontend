import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StagiaireForm from "../components/StagiaireForm.jsx";
import StagiaireList from "../components/StagiaireList.jsx";
import { fetchStagiaires } from "../store/stagiaireSlice.jsx";
import { fetchProgrammes } from "../store/programmeSlice.jsx";

function StagiairesPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isProf = user?.role === "prof";

  // Prof's assigned programme codes
  const profFilieres = useMemo(
    () =>
      isProf && user?.programmes?.length > 0
        ? user.programmes.map((p) => p.code_diplome)
        : [],
    [isProf, user]
  );

  const { items: stagiaires, loading, error } = useSelector((state) => state.stagiaires);
  const { items: programmes } = useSelector((state) => state.programmes);

  // Derive filiere list from programmes (code_diplome)
  const allFilieres = useMemo(
    () => programmes.map((p) => p.code_diplome).sort(),
    [programmes]
  );

  const filieres = useMemo(
    () =>
      profFilieres.length > 0
        ? allFilieres.filter((f) => profFilieres.includes(f))
        : allFilieres,
    [allFilieres, profFilieres]
  );

  const [showForm, setShowForm] = useState(false);
  const [editingStagiaire, setEditingStagiaire] = useState(null);
  const [selectedFiliere, setSelectedFiliere] = useState(null);

  useEffect(() => {
    dispatch(fetchStagiaires());
    dispatch(fetchProgrammes());
  }, [dispatch]);

  // Auto-select if prof has only one filière
  useEffect(() => {
    if (profFilieres.length === 1) {
      setSelectedFiliere(profFilieres[0]);
    }
  }, [profFilieres]);

  // Count stagiaires per filiere (by programme inscription)
  const countByFiliere = useMemo(() => {
    const map = {};
    stagiaires.forEach((s) => {
      const code = s.filiere || s.programme_code || "";
      if (code) map[code] = (map[code] || 0) + 1;
    });
    return map;
  }, [stagiaires]);

  const handleEdit = (stagiaire) => {
    setEditingStagiaire(stagiaire);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingStagiaire(null);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingStagiaire(null);
    dispatch(fetchStagiaires());
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStagiaire(null);
  };

  if (loading && stagiaires.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status" />
        <p className="mt-3 text-muted">Chargement des stagiaires...</p>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-people-fill me-3 text-dark-navy"></i>
            Gestion des Stagiaires
          </h2>
          <p className="text-muted mb-0">
            {selectedFiliere
              ? `Liste des stagiaires - Filière ${selectedFiliere}`
              : "Sélectionnez une filière pour gérer les stagiaires."}
          </p>
        </div>
        {user?.role === "admin" && !showForm && (
          <button
            className="btn btn-dark-navy rounded-pill px-4 py-2 shadow-sm fw-bold d-flex align-items-center"
            onClick={handleAddNew}
          >
            <i className="bi bi-plus-lg me-2 fs-5"></i>
            Nouveau Stagiaire
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      )}

      {showForm ? (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <StagiaireForm
              stagiaire={editingStagiaire}
              onCancel={handleCancel}
              onSave={handleSave}
              filieres={filieres}
              programmes={programmes}
            />
          </div>
        </div>
      ) : !selectedFiliere ? (
        <div className="row g-4">
          {filieres.length === 0 ? (
            <div className="col-12 text-center py-5">
              <div className="text-muted mb-3">
                <i className="bi bi-inbox fs-1"></i>
              </div>
              <p>Aucun programme enregistré. Ajoutez des programmes dans le backend.</p>
            </div>
          ) : (
            filieres.map((f) => {
              const count = countByFiliere[f] || 0;
              return (
                <div key={f} className="col-md-4 col-lg-3">
                  <div
                    className="card h-100 border-0 shadow-sm filiere-card transition-all"
                    onClick={() => setSelectedFiliere(f)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-body text-center p-4">
                      <div className="bg-soft-dark-navy text-dark-navy p-3 rounded-circle d-inline-flex mb-3">
                        <i className="bi bi-mortarboard fs-3"></i>
                      </div>
                      <h5 className="fw-bold mb-1">{f}</h5>
                      <p className="text-muted small mb-0">{count} Stagiaires</p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <StagiaireList
          onEdit={handleEdit}
          filiere={selectedFiliere}
          onBack={() => setSelectedFiliere(null)}
        />
      )}
      <style>{`
        .filiere-card:hover { transform: translateY(-5px); box-shadow: 0 10px 20px rgba(0,0,0,0.05) !important; border: 1px solid #0A121A !important; }
        .bg-soft-dark-navy { background-color: #e7f1ff; }
        .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; }
        .btn-dark-navy:hover { background-color: #1a232f; color: #fff; }
        .text-dark-navy { color: #0A121A; }
      `}</style>
    </div>
  );
}

export default StagiairesPage;
