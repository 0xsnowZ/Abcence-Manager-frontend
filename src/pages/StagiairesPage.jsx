import { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import StagiaireForm from "../components/StagiaireForm.jsx";
import StagiaireList from "../components/StagiaireList.jsx";
import { fetchStagiaires } from "../store/stagiaireSlice.jsx";
import { fetchSecteurs, fetchProgrammesBySecteur } from "../store/secteurSlice.jsx";

const SECTEUR_ICONS = {
  DIA: "bi-cpu-fill",
  GE:  "bi-lightning-charge-fill",
  BTP: "bi-building-fill",
  GC:  "bi-compass-fill",
  TH:  "bi-cup-hot-fill",
  FGT: "bi-tree-fill",
  AGC: "bi-bar-chart-fill",
};
const defaultIcon = "bi-grid-fill";

function StagiairesPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const isProf = user?.role === "prof";

  const { items: stagiaires, loading: loadingStagiaires } = useSelector((s) => s.stagiaires);
  const { items: secteurs, programmesBySecteur, loading: loadingSecteurs, loadingProgrammes } =
    useSelector((s) => s.secteurs);

  // navigation: secteur object → programme code_diplome string → stagiaire list
  const [selectedSecteur,    setSelectedSecteur]    = useState(null);
  const [selectedProgramme,  setSelectedProgramme]  = useState(null); // code_diplome

  const [showForm,          setShowForm]          = useState(false);
  const [editingStagiaire,  setEditingStagiaire]  = useState(null);

  useEffect(() => {
    dispatch(fetchStagiaires());
    dispatch(fetchSecteurs());
  }, [dispatch]);

  // fetch programmes for the selected secteur (cached)
  useEffect(() => {
    if (selectedSecteur && !programmesBySecteur[selectedSecteur.id]) {
      dispatch(fetchProgrammesBySecteur(selectedSecteur.id));
    }
  }, [selectedSecteur, programmesBySecteur, dispatch]);

  const profCodes = useMemo(
    () => (isProf && user?.programmes ? user.programmes.map((p) => p.code_diplome) : []),
    [isProf, user]
  );

  // programmes to show at level 2 (filtered for prof)
  const currentProgrammes = useMemo(() => {
    if (!selectedSecteur) return [];
    const all = programmesBySecteur[selectedSecteur.id] || [];
    return profCodes.length > 0 ? all.filter((p) => profCodes.includes(p.code_diplome)) : all;
  }, [selectedSecteur, programmesBySecteur, profCodes]);

  const handleEdit  = (s) => { setEditingStagiaire(s); setShowForm(true); };
  const handleAddNew = () => { setEditingStagiaire(null); setShowForm(true); };
  const handleSave  = () => {
    setShowForm(false);
    setEditingStagiaire(null);
    dispatch(fetchStagiaires());
  };

  const isLoading = loadingStagiaires || loadingSecteurs;

  if (isLoading && stagiaires.length === 0 && secteurs.length === 0) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-dark" role="status" />
        <p className="mt-3 text-muted">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="container py-4">

      {/* ── Header + breadcrumb ── */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-people-fill me-3 text-dark-navy"></i>
            Gestion des Stagiaires
          </h2>
          <nav aria-label="breadcrumb">
            <ol className="breadcrumb mb-0 small">
              <li
                className={`breadcrumb-item ${!selectedSecteur ? "active" : "bc-link"}`}
                onClick={() => { setSelectedSecteur(null); setSelectedProgramme(null); }}
              >
                Secteurs
              </li>
              {selectedSecteur && (
                <li
                  className={`breadcrumb-item ${!selectedProgramme ? "active" : "bc-link"}`}
                  onClick={() => setSelectedProgramme(null)}
                >
                  {selectedSecteur.code}
                </li>
              )}
              {selectedProgramme && (
                <li className="breadcrumb-item active">{selectedProgramme}</li>
              )}
            </ol>
          </nav>
        </div>
        {user?.role === "admin" && !showForm && selectedProgramme && (
          <button
            className="btn btn-dark-navy rounded-pill px-4 py-2 fw-bold d-flex align-items-center"
            onClick={handleAddNew}
          >
            <i className="bi bi-plus-lg me-2 fs-5"></i>
            Nouveau Stagiaire
          </button>
        )}
      </div>

      {/* ── Form ── */}
      {showForm ? (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <StagiaireForm
              stagiaire={editingStagiaire}
              onCancel={() => { setShowForm(false); setEditingStagiaire(null); }}
              onSave={handleSave}
            />
          </div>
        </div>

      /* ── Level 3: stagiaire list ── */
      ) : selectedProgramme ? (
        <StagiaireList
          onEdit={handleEdit}
          filiere={selectedProgramme}
          onBack={() => setSelectedProgramme(null)}
        />

      /* ── Level 2: programmes of selected secteur ── */
      ) : selectedSecteur ? (
        <div>
          <button
            className="btn btn-sm btn-outline-dark-navy rounded-pill mb-4 px-3"
            onClick={() => setSelectedSecteur(null)}
          >
            <i className="bi bi-arrow-left me-1"></i> Retour aux secteurs
          </button>

          {loadingProgrammes ? (
            <div className="text-center py-5">
              <div className="spinner-border text-dark" role="status" />
            </div>
          ) : currentProgrammes.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
              Aucune filière dans ce secteur.
            </div>
          ) : (
            <div className="row g-4">
              {currentProgrammes.map((p) => (
                <div key={p.id} className="col-md-4 col-lg-3">
                  <div
                    className="card h-100 border-0 shadow-sm prog-card"
                    onClick={() => setSelectedProgramme(p.code_diplome)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="card-body text-center p-4">
                      <div className="bg-soft-dark-navy text-dark-navy p-3 rounded-circle d-inline-flex mb-3">
                        <i className="bi bi-mortarboard fs-3"></i>
                      </div>
                      <h5 className="fw-bold mb-1">{p.code_diplome}</h5>
                      <p className="text-muted small mb-0">{p.inscriptions_count || 0} Stagiaires</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      /* ── Level 1: secteurs ── */
      ) : (
        <div className="row g-4">
          {secteurs.length === 0 ? (
            <div className="col-12 text-center py-5 text-muted">
              <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
              Aucun secteur enregistré.
            </div>
          ) : secteurs.map((sec) => {
            const icon = SECTEUR_ICONS[sec.code] || defaultIcon;
            return (
              <div key={sec.id} className="col-md-4 col-lg-3">
                <div
                  className="card h-100 border-0 shadow-sm secteur-card"
                  onClick={() => setSelectedSecteur(sec)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="card-body text-center p-4">
                    <div className="secteur-icon-wrap mb-3">
                      <i className={`bi ${icon} fs-2`}></i>
                    </div>
                    <h5 className="fw-bold mb-1">{sec.code}</h5>
                    <p className="text-muted small mb-0">{sec.programmes_count} Classe{sec.programmes_count !== 1 ? "s" : ""}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .secteur-card:hover, .prog-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,.07) !important;
          border: 1px solid #0A121A !important;
        }
        .secteur-card, .prog-card { transition: all .2s ease-in-out; }
        .secteur-icon-wrap { width:60px; height:60px; border-radius:50%; background:#e7f1ff; color:#0A121A; display:inline-flex; align-items:center; justify-content:center; }
        .bg-soft-dark-navy   { background-color: #e7f1ff; }
        .btn-dark-navy       { background-color: #0A121A; border-color: #0A121A; color: #fff; }
        .btn-dark-navy:hover { background-color: #1a232f; color: #fff; }
        .text-dark-navy      { color: #0A121A; }
        .btn-outline-dark-navy       { color: #0A121A; border-color: #0A121A; }
        .btn-outline-dark-navy:hover { background-color: #0A121A; color: #fff; }
        .bc-link { cursor: pointer; color: #0A121A; }
        .bc-link:hover { text-decoration: underline; }
      `}</style>
    </div>
  );
}

export default StagiairesPage;
