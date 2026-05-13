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
const SECTEUR_COLORS = {
  DIA: { bg: "#eff6ff", color: "#2563eb" },
  GE:  { bg: "#fffbeb", color: "#d97706" },
  BTP: { bg: "#f0fdf4", color: "#16a34a" },
  GC:  { bg: "#fdf4ff", color: "#9333ea" },
  TH:  { bg: "#fff7ed", color: "#ea580c" },
  FGT: { bg: "#f0fdf4", color: "#15803d" },
  AGC: { bg: "#eff6ff", color: "#1d4ed8" },
};
const defaultIcon  = "bi-grid-fill";
const defaultColor = { bg: "var(--color-primary-light)", color: "var(--color-primary)" };

function StagiairesPage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const isProf = user?.role === "prof";

  const { items: stagiaires, loading: loadingStagiaires } = useSelector((s) => s.stagiaires);
  const { items: secteurs, programmesBySecteur, loading: loadingSecteurs, loadingProgrammes } =
    useSelector((s) => s.secteurs);

  const [selectedSecteur,   setSelectedSecteur]   = useState(null);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [showForm,          setShowForm]           = useState(false);
  const [editingStagiaire,  setEditingStagiaire]   = useState(null);

  useEffect(() => {
    dispatch(fetchStagiaires());
    dispatch(fetchSecteurs());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSecteur && !programmesBySecteur[selectedSecteur.id]) {
      dispatch(fetchProgrammesBySecteur(selectedSecteur.id));
    }
  }, [selectedSecteur, programmesBySecteur, dispatch]);

  const profCodes = useMemo(
    () => (isProf && user?.programmes ? user.programmes.map((p) => p.code_diplome) : []),
    [isProf, user]
  );

  const currentProgrammes = useMemo(() => {
    if (!selectedSecteur) return [];
    const all = programmesBySecteur[selectedSecteur.id] || [];
    return profCodes.length > 0 ? all.filter((p) => profCodes.includes(p.code_diplome)) : all;
  }, [selectedSecteur, programmesBySecteur, profCodes]);

  const handleEdit   = (s) => { setEditingStagiaire(s); setShowForm(true); };
  const handleAddNew = ()  => { setEditingStagiaire(null); setShowForm(true); };
  const handleSave   = ()  => { setShowForm(false); setEditingStagiaire(null); dispatch(fetchStagiaires()); };

  const isLoading = loadingStagiaires || loadingSecteurs;

  if (isLoading && stagiaires.length === 0 && secteurs.length === 0) {
    return (
      <div className="container-xxl px-4 py-5 text-center">
        <div className="spinner-border" style={{ color: "var(--color-primary)" }} role="status" />
        <p className="mt-3 body-sm">Chargement…</p>
      </div>
    );
  }

  return (
    <div className="container-xxl px-4 py-5">

      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-start mb-5 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="page-icon-wrap">
              <i className="bi bi-people-fill"></i>
            </div>
            <h1 className="page-title mb-0">Gestion des Stagiaires</h1>
          </div>
          {/* Breadcrumb */}
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
          <button className="btn-navy d-flex align-items-center gap-2" onClick={handleAddNew}>
            <i className="bi bi-plus-lg"></i>
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

      /* ── Level 2: programmes ── */
      ) : selectedSecteur ? (
        <div>
          <button
            className="btn-navy-outline d-inline-flex align-items-center gap-2 mb-5"
            onClick={() => setSelectedSecteur(null)}
          >
            <i className="bi bi-arrow-left"></i> Retour aux secteurs
          </button>

          {loadingProgrammes ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: "var(--color-primary)" }} role="status" />
            </div>
          ) : currentProgrammes.length === 0 ? (
            <div className="text-center py-5 body-sm">
              <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
              Aucune filière dans ce secteur.
            </div>
          ) : (
            <div className="row g-4">
              {currentProgrammes.map((p) => (
                <div key={p.id} className="col-md-4 col-lg-3">
                  <div
                    className="card-premium card-clickable prog-card text-center p-4"
                    onClick={() => setSelectedProgramme(p.code_diplome)}
                  >
                    <div className="prog-icon-wrap mb-3">
                      <i className="bi bi-mortarboard fs-3"></i>
                    </div>
                    <div className="section-title mb-1">{p.code_diplome}</div>
                    <div className="body-sm">{p.inscriptions_count || 0} Stagiaires</div>
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
            <div className="col-12 text-center py-5 body-sm">
              <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
              Aucun secteur enregistré.
            </div>
          ) : secteurs.map((sec) => {
            const icon  = SECTEUR_ICONS[sec.code]  || defaultIcon;
            const color = SECTEUR_COLORS[sec.code] || defaultColor;
            return (
              <div key={sec.id} className="col-md-4 col-lg-3">
                <div
                  className="card-premium card-clickable secteur-card text-center p-4"
                  onClick={() => setSelectedSecteur(sec)}
                >
                  <div
                    className="secteur-icon-wrap mb-3"
                    style={{ background: color.bg, color: color.color }}
                  >
                    <i className={`bi ${icon} fs-2`}></i>
                  </div>
                  <div className="section-title mb-1">{sec.code}</div>
                  <div className="body-sm">
                    {sec.programmes_count} Classe{sec.programmes_count !== 1 ? "s" : ""}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

export default StagiairesPage;
