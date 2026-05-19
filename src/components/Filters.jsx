import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Filters Component

function Filters({ onFilterChange }) {
  const { user } = useSelector((state) => state.auth);
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [stagiaireFilter, setStagiaireFilter] = useState("");
  const [filiereFilter, setFiliereFilter] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  const profFilieres = useMemo(
    () =>
      user?.role === "prof" && Array.isArray(user?.programmes)
        ? user.programmes.map((programme) => programme.code_diplome || programme.code || programme)
        : [],
    [user],
  );

  const getStagiaireClasse = (s) => {
    const prog = (s.programmes || [])[0];
    return prog?.code_diplome || null;
  };

  // Extract available classes from the current user when possible,
  // otherwise fall back to the classes present in the loaded data.
  const filieres = useMemo(() => {
    if (profFilieres.length > 0) {
      return [...new Set(profFilieres)].sort();
    }

    const codes = stagiaires.map(getStagiaireClasse).filter(Boolean);
    return [...new Set(codes)].sort();
  }, [stagiaires, profFilieres]);

  // When a Filière is selected, only show its trainees in the Stagiaire dropdown
  const filteredStagiaires = useMemo(() => {
    const list = !filiereFilter
      ? stagiaires
      : stagiaires.filter((s) => getStagiaireClasse(s) === filiereFilter);
    return [...list].sort((a, b) =>
      (a.nom || "").localeCompare(b.nom || "", "fr", { sensitivity: "base" }) ||
      (a.prenom || "").localeCompare(b.prenom || "", "fr", { sensitivity: "base" })
    );
  }, [stagiaires, filiereFilter]);

  const applyFilters = () => {
    const filters = {
      filterType,
      dateRange: dateRange[0] || dateRange[1] ? dateRange : null,
      stagiaireFilter: stagiaireFilter || null,
      filiereFilter: filiereFilter || null,
    };

    const active = [];
    if (filterType !== "all")
      active.push(filterType === "justified" ? "Justifiées" : "Non justifiées");

    if (dateRange[0] || dateRange[1]) {
      const d1 = dateRange[0] ? dateRange[0].toLocaleDateString('fr-FR') : "...";
      const d2 = dateRange[1] ? dateRange[1].toLocaleDateString('fr-FR') : "...";
      if (dateRange[0] && dateRange[1] && dateRange[0].getTime() === dateRange[1].getTime()) {
        active.push(`Date: ${d1}`);
      } else {
        active.push(`Période: ${d1} au ${d2}`);
      }
    }

    if (stagiaireFilter) {
      const stag = stagiaires.find((s) => s.id === parseInt(stagiaireFilter));
      if (stag) active.push(`Stagiaire: ${stag.nom}`);
    }
    if (filiereFilter) active.push(`Filière: ${filiereFilter}`);

    setActiveFilters(active);
    onFilterChange(filters);
  };

  const clearFilters = () => {
    setFilterType("all");
    setDateRange([null, null]);
    setStagiaireFilter("");
    setFiliereFilter("");
    setActiveFilters([]);
    onFilterChange({
      filterType: "all",
      dateRange: null,
      stagiaireFilter: null,
      filiereFilter: null,
    });
  };

  return (
    <div className="card-premium">
      <div className="card-header py-3 px-4" style={{ background: "var(--color-primary)" }}>
        <h5 className="mb-0 label-caps text-white d-flex align-items-center gap-2">
          <i className="bi bi-funnel-fill"></i>
          Filtrer les Résultats
        </h5>
      </div>
      <div className="card-body p-3">
        <div className="row g-3 align-items-end">

          {/* Classe */}
          <div className="col-12 col-sm-6 col-lg">
            <label className="form-label label-caps mb-1">Classe</label>
            <select
              className="form-select form-select-sm bg-light border-0"
              value={filiereFilter}
              onChange={(e) => { setFiliereFilter(e.target.value); setStagiaireFilter(""); }}
            >
              <option value="">
                {profFilieres.length > 0 ? "Mes classes" : "Toutes les classes"}
              </option>
              {filieres.map((f, i) => <option key={i} value={f}>{f}</option>)}
            </select>
          </div>

          {/* Stagiaire */}
          <div className="col-12 col-sm-6 col-lg">
            <label className="form-label label-caps mb-1">Stagiaire</label>
            <select
              className="form-select form-select-sm bg-light border-0"
              value={stagiaireFilter}
              onChange={(e) => setStagiaireFilter(e.target.value)}
            >
              <option value="">{filiereFilter ? `Tous (${filteredStagiaires.length})` : "Tous les stagiaires"}</option>
              {filteredStagiaires.map((s) => {
                const name = s.prenom ? `${s.nom} ${s.prenom}` : s.nomComplet || s.nom;
                const filiere = getStagiaireClasse(s);
                return (
                  <option key={s.id} value={s.id}>
                    {name}{!filiereFilter && filiere ? ` (${filiere})` : ""}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Période */}
          <div className="col-12 col-sm-6 col-lg position-relative">
            <label className="form-label label-caps mb-1">Période</label>
            <button
              className="btn btn-white border bg-light btn-sm w-100 d-flex justify-content-between align-items-center shadow-none text-start py-2"
              onClick={() => setShowCalendar(!showCalendar)}
              type="button"
              style={{ fontSize: '0.85rem' }}
            >
              <span className="text-dark text-truncate">
                <i className="bi bi-calendar-range me-2 text-dark-navy"></i>
                {dateRange?.[0] ? dateRange[0].toLocaleDateString('fr-FR') : 'Début'}
                <span className="mx-1 text-muted">➟</span>
                {dateRange?.[1] ? dateRange[1].toLocaleDateString('fr-FR') : 'Fin'}
              </span>
              <i className={`bi bi-chevron-${showCalendar ? 'up' : 'down'} text-muted ms-2`}></i>
            </button>
            {showCalendar && (
              <div className="position-absolute start-0 mt-2 bg-white p-2 border rounded shadow-lg date-picker-dropdown" style={{ minWidth: '300px', zIndex: 1050 }}>
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                  <span className="fw-bold small text-muted" style={{ fontSize: '0.7rem' }}>SÉLECTIONNER</span>
                  <button className="btn-close" style={{ fontSize: '0.6rem' }} onClick={() => setShowCalendar(false)}></button>
                </div>
                <Calendar
                  onChange={(val) => { setDateRange(val); if (val && val.length === 2 && val[0] && val[1]) setShowCalendar(false); }}
                  selectRange={true}
                  value={dateRange[0] ? dateRange : null}
                  className="border-0 w-100 x-small-calendar"
                />
              </div>
            )}
          </div>

          {/* Type */}
          <div className="col-12 col-sm-6 col-lg">
            <label className="form-label label-caps mb-1">Type</label>
            <select
              className="form-select form-select-sm bg-light border-0"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">Toutes</option>
              <option value="justified">Justifiées</option>
              <option value="unjustified">Non justifiées</option>
            </select>
          </div>

          {/* Buttons */}
          <div className="col-12 col-sm-auto d-flex gap-2">
            <button className="btn btn-dark-navy btn-sm fw-bold px-3" onClick={applyFilters}>
              <i className="bi bi-check2-circle me-1"></i>Appliquer
            </button>
            <button className="btn btn-outline-secondary btn-sm fw-bold px-3" onClick={clearFilters}>
              Réinitialiser
            </button>
          </div>

        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-3 pt-3 border-top d-flex flex-wrap gap-1 align-items-center">
            <small className="text-muted text-uppercase fw-bold me-1" style={{ fontSize: '0.65rem' }}>Actifs:</small>
            {activeFilters.map((filter, index) => (
              <span key={index} className="badge rounded-pill bg-soft-primary text-primary px-3 border shadow-none" style={{ fontSize: '0.7rem' }}>
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Filters;
