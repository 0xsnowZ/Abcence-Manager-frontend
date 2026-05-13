import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StagiaireForm from "../components/StagiaireForm.jsx";
import StagiaireList from "../components/StagiaireList.jsx";
import {
  addStagiaire,
  updateStagiaire,
  deleteStagiaire,
} from "../store/stagiaireSlice.jsx";

// Stagiaires Page

function StagiairesPage() {
  const { user } = useSelector((state) => state.auth);
  const isProf = user?.role === 'prof';
  const profFilieres = isProf && user?.filieres?.length > 0 ? user.filieres : [];

  const stagiaires = useSelector((state) => state.stagiaires.items);
  
  const allFilieres = useMemo(() => 
    [...new Set(stagiaires.map((s) => s.filiere))].sort(),
    [stagiaires]
  );

  // Filter filières if prof has restrictions
  const filieres = useMemo(() => 
    profFilieres.length > 0 
      ? allFilieres.filter(f => profFilieres.includes(f)) 
      : allFilieres,
    [allFilieres, profFilieres]
  );

  const [showForm, setShowForm] = useState(false);
  const [editingStagiaire, setEditingStagiaire] = useState(null);
  const [selectedFiliere, setSelectedFiliere] = useState(null);

  // Auto-select if prof has only one filière (essential for login/refresh sync)
  useEffect(() => {
    if (profFilieres.length === 1) {
      setSelectedFiliere(profFilieres[0]);
    }
  }, [profFilieres]);

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
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingStagiaire(null);
  };

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
        {user?.role === 'admin' && !showForm && (
          <button className="btn btn-dark-navy rounded-pill px-4 py-2 shadow-sm fw-bold d-flex align-items-center" onClick={handleAddNew}>
            <i className="bi bi-plus-lg me-2 fs-5"></i>
            Nouveau Stagiaire
          </button>
        )}
      </div>

      {showForm ? (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <StagiaireForm
              stagiaire={editingStagiaire}
              onCancel={handleCancel}
              onSave={handleSave}
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
              <p>Aucun stagiaire enregistré. Commencez par en ajouter un.</p>
            </div>
          ) : (
            filieres.map((f) => {
              const count = stagiaires.filter(s => s.filiere === f).length;
              return (
                <div key={f} className="col-md-4 col-lg-3">
                  <div 
                    className="card h-100 border-0 shadow-sm filiere-card transition-all" 
                    onClick={() => setSelectedFiliere(f)}
                    style={{ cursor: 'pointer' }}
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
      `}</style>
    </div>
  );
}

export default StagiairesPage;
