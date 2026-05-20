import { useState, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Statistics from "../components/Statistics.jsx";
import { fetchStagiaires } from "../store/stagiaireSlice.jsx";
import { fetchProgrammes } from "../store/programmeSlice.jsx";

function StatisticsPage() {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const { user } = useSelector((state) => state.auth);

  // ─── Filter States ──────────────────────────────────────────────────────────
  const [activeChoiceView, setActiveChoiceView] = useState("ensemble"); // ensemble | filiere | stagiaire
  const [selectedFiliere, setSelectedFiliere]   = useState("");
  const [selectedStagiaire, setSelectedStagiaire] = useState("");
  const [selectedStatus, setSelectedStatus]       = useState("all"); // all | justifie | unjustified | retard | excusee

  // Date filter presets: all | month | range
  const [datePreset, setDatePreset]   = useState("month");
  
  const currentMonthValue = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  const [selectedMonth, setSelectedMonth] = useState(currentMonthValue);
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");

  // ─── Fetch baseline store data ──────────────────────────────────────────────
  useEffect(() => {
    if (stagiaires.length === 0) dispatch(fetchStagiaires());
    dispatch(fetchProgrammes());
  }, [dispatch, stagiaires.length]);

  // ─── Prof role restrictions ──────────────────────────────────────────────────
  const isProf = user?.role === "prof";
  const profFilieres = useMemo(
    () =>
      isProf && user?.programmes?.length > 0
        ? user.programmes.map((p) => p.code_diplome)
        : [],
    [isProf, user],
  );

  // ─── Computed filters for dropdowns ────────────────────────────────────────
  const getStagiaireClasse = (s) =>
    (s.programmes || [])[0]?.code_diplome || s.filiere || s.programme_code || "";

  const availableFilieres = useMemo(() => {
    const all = [
      ...new Set(stagiaires.map(getStagiaireClasse).filter(Boolean)),
    ].sort();
    if (profFilieres.length > 0) {
      return all.filter((f) => profFilieres.includes(f));
    }
    return all;
  }, [stagiaires, profFilieres]);

  const availableStagiaires = useMemo(() => {
    let list = stagiaires;
    if (selectedFiliere) {
      list = list.filter((s) => getStagiaireClasse(s) === selectedFiliere);
    } else if (profFilieres.length > 0) {
      list = list.filter((s) => profFilieres.includes(getStagiaireClasse(s)));
    }
    return list
      .map((s) => ({
        id: s.id,
        name: s.nomComplet || `${s.nom} ${s.prenom}`.trim() || s.nom,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [stagiaires, selectedFiliere, profFilieres]);

  // If professor has only one assigned class, lock it
  useEffect(() => {
    if (profFilieres.length === 1 && !selectedFiliere) {
      setSelectedFiliere(profFilieres[0]);
    }
  }, [profFilieres, selectedFiliere]);

  // Automatically switch tabs based on dropdown selections for better UX
  const handleStagiaireChange = (val) => {
    setSelectedStagiaire(val);
    if (val) {
      setActiveChoiceView("stagiaire");
    } else if (activeChoiceView === "stagiaire") {
      setActiveChoiceView("ensemble");
    }
  };

  const handleFiliereChange = (val) => {
    setSelectedFiliere(val);
    setSelectedStagiaire(""); // Reset individual student
    if (val) {
      if (activeChoiceView === "stagiaire") {
        setActiveChoiceView("filiere");
      }
    } else {
      if (activeChoiceView === "filiere" || activeChoiceView === "stagiaire") {
        setActiveChoiceView("ensemble");
      }
    }
  };

  const handleResetFilters = () => {
    setSelectedFiliere(profFilieres.length === 1 ? profFilieres[0] : "");
    setSelectedStagiaire("");
    setSelectedStatus("all");
    setDatePreset("month");
    setSelectedMonth(currentMonthValue);
    setStartDate("");
    setEndDate("");
    setActiveChoiceView("ensemble");
  };

  return (
    <div className="container-xxl px-4 py-5">
      {/* ── Page Header ── */}
      <div className="d-flex justify-content-between align-items-start mb-4 page-main-header">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="stats-page-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h1 className="page-title mb-0">Tableau de Bord Analytique</h1>
          </div>
          <p className="body-sm mb-0">Consultez l'assiduité, les tendances clés et analysez les profils.</p>
        </div>

        <button
          className="btn btn-outline-secondary btn-sm fw-bold px-3 d-flex align-items-center gap-1 shadow-sm bg-white"
          onClick={() => window.print()}
          title="Imprimer le rapport analytique"
        >
          <i className="bi bi-printer-fill"></i>
          Imprimer Rapport
        </button>
      </div>

      {/* ── Multi-Filter Panel ── */}
      <div className="card-premium p-3 mb-4 stats-filter-bar bg-white">
        <div className="row g-3 align-items-end">
          {/* Période / Presets */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label label-caps mb-1">Période d'Analyse</label>
            <select
              className="form-select form-select-sm bg-light"
              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)}
            >
              <option value="month">Par mois</option>
              <option value="range">Plage personnalisée</option>
              <option value="all">Toutes les dates</option>
            </select>
          </div>

          {/* Date Picker Input */}
          {datePreset === "month" && (
            <div className="col-12 col-sm-6 col-lg-2">
              <label className="form-label label-caps mb-1">Mois</label>
              <input
                type="month"
                className="form-control form-control-sm bg-light"
                value={selectedMonth || ""}
                onChange={(e) => setSelectedMonth(e.target.value)}
              />
            </div>
          )}

          {datePreset === "range" && (
            <>
              <div className="col-12 col-sm-6 col-lg-2">
                <label className="form-label label-caps mb-1">Du</label>
                <input
                  type="date"
                  className="form-control form-control-sm bg-light"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="col-12 col-sm-6 col-lg-2">
                <label className="form-label label-caps mb-1">Au</label>
                <input
                  type="date"
                  className="form-control form-control-sm bg-light"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {/* Filiere Filter */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label label-caps mb-1">Filière / Classe</label>
            <select
              className="form-select form-select-sm bg-light"
              value={selectedFiliere}
              onChange={(e) => handleFiliereChange(e.target.value)}
              disabled={profFilieres.length === 1}
            >
              <option value="">Toutes les classes</option>
              {availableFilieres.map((f, i) => (
                <option key={i} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Stagiaire Filter */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label label-caps mb-1">Stagiaire</label>
            <select
              className="form-select form-select-sm bg-light"
              value={selectedStagiaire}
              onChange={(e) => handleStagiaireChange(e.target.value)}
            >
              <option value="">Sélectionner un stagiaire</option>
              {availableStagiaires.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="col-12 col-sm-6 col-lg-3">
            <label className="form-label label-caps mb-1">Statut d'Absence</label>
            <select
              className="form-select form-select-sm bg-light"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">Tous les statuts</option>
              <option value="justifie">Justifiées</option>
              <option value="unjustified">Non justifiées</option>
              <option value="retard">Retards</option>
              <option value="excusee">Excusées</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="col-12 col-sm-auto ms-auto">
            <button
              className="btn btn-outline-danger btn-sm fw-bold px-3 w-100"
              onClick={handleResetFilters}
            >
              <i className="bi bi-x-circle me-1"></i>
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      {/* ── View Toggle Bar (Show by Choice) ── */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div className="stats-tab-group">
          <button
            className={`stats-view-tab ${activeChoiceView === "ensemble" ? "active" : ""}`}
            onClick={() => setActiveChoiceView("ensemble")}
          >
            <i className="bi bi-grid-fill"></i>
            Vue d'Ensemble
          </button>
          <button
            className={`stats-view-tab ${activeChoiceView === "filiere" ? "active" : ""}`}
            onClick={() => {
              setActiveChoiceView("filiere");
              setSelectedStagiaire(""); // Clear individual student when switching to class comparison
            }}
          >
            <i className="bi bi-mortarboard-fill"></i>
            Analyse par Filière
          </button>
          <button
            className={`stats-view-tab ${activeChoiceView === "stagiaire" ? "active" : ""}`}
            onClick={() => {
              setActiveChoiceView("stagiaire");
              // Fallback to first available trainee if none is currently selected
              if (!selectedStagiaire && availableStagiaires.length > 0) {
                setSelectedStagiaire(availableStagiaires[0].id);
              }
            }}
            disabled={availableStagiaires.length === 0}
          >
            <i className="bi bi-person-fill"></i>
            Profil Individuel
          </button>
        </div>

        <div className="body-sm text-secondary">
          <i className="bi bi-info-circle me-1"></i>
          Filtres actifs appliqués aux graphiques ci-dessous.
        </div>
      </div>

      {/* ── Statistics Viewport ── */}
      <Statistics
        activeChoiceView={activeChoiceView}
        selectedFiliere={selectedFiliere}
        selectedStagiaire={selectedStagiaire}
        selectedStatus={selectedStatus}
        datePreset={datePreset}
        selectedMonth={selectedMonth}
        startDate={startDate}
        endDate={endDate}
      />
    </div>
  );
}

export default StatisticsPage;
