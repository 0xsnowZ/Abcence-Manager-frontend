import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

// Filters Component

function Filters({ onFilterChange }) {
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const [filterType, setFilterType] = useState("all");
  const [dateRange, setDateRange] = useState([null, null]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [stagiaireFilter, setStagiaireFilter] = useState("");
  const [filiereFilter, setFiliereFilter] = useState("");
  const [activeFilters, setActiveFilters] = useState([]);

  // Extract unique filières
  const filieres = useMemo(() => [...new Set(stagiaires.map((s) => s.filiere))].sort(), [stagiaires]);

  // When a Filière is selected, only show its trainees in the Stagiaire dropdown
  const filteredStagiaires = useMemo(() => {
    if (!filiereFilter) return stagiaires;
    return stagiaires.filter((s) => s.filiere === filiereFilter);
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
    <div className="card border-0 shadow-sm">
      <div className="card-header bg-dark text-white py-3">
        <h5 className="mb-0 fw-bold small text-uppercase tracking-wider">
          <i className="bi bi-funnel-fill me-2"></i>
          Filtrer les Résultats
        </h5>
      </div>
      <div className="card-body p-4">
        {/* Filter by Filière */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase">Filière</label>
          <select
            className="form-select bg-light border-0"
            value={filiereFilter}
            onChange={(e) => {
            setFiliereFilter(e.target.value);
            setStagiaireFilter(""); // reset stagiaire when filière changes
          }}
          >
            <option value="">Toutes les filières</option>
            {filieres.map((f, index) => (
              <option key={index} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Stagiaire */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase">Stagiaire</label>
          <select
            className="form-select bg-light border-0"
            value={stagiaireFilter}
            onChange={(e) => setStagiaireFilter(e.target.value)}
          >
            <option value="">
              {filiereFilter ? `Tous (${filteredStagiaires.length})` : "Tous les stagiaires"}
            </option>
            {filteredStagiaires.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nom}{!filiereFilter && ` (${s.filiere})`}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Date Range */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase">Période d'appel</label>
          <div className="position-relative">
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
              <div className="position-absolute start-0 mt-2 bg-white p-2 border rounded shadow-lg" style={{ minWidth: '300px', zIndex: 1050 }}>
                <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                  <span className="fw-bold small text-muted" style={{ fontSize: '0.7rem' }}>SÉLECTIONNER</span>
                  <button className="btn-close" style={{ fontSize: '0.6rem' }} onClick={() => setShowCalendar(false)}></button>
                </div>
                <Calendar
                  onChange={(val) => {
                    setDateRange(val);
                    if (val && val.length === 2 && val[0] && val[1]) setShowCalendar(false);
                  }}
                  selectRange={true}
                  value={dateRange[0] ? dateRange : null}
                  className="border-0 w-100 x-small-calendar"
                />
              </div>
            )}
          </div>
        </div>

        {/* Filter by Justification */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase">Type d'absence</label>
          <select
            className="form-select bg-light border-0"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Toutes les absences</option>
            <option value="justified">Justifiées uniquement</option>
            <option value="unjustified">Non justifiées uniquement</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="d-grid gap-2 mt-4">
          <button className="btn btn-dark-navy rounded-pill fw-bold py-2 shadow-sm" onClick={applyFilters}>
            <i className="bi bi-check2-circle me-2"></i>
            Appliquer les filtres
          </button>
          <button className="btn btn-outline-secondary rounded-pill fw-bold py-2" onClick={clearFilters}>
            Réinitialiser
          </button>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mt-4 pt-3 border-top">
            <small className="text-muted text-uppercase fw-bold" style={{ fontSize: '0.65rem' }}>Filtres actifs:</small>
            <div className="d-flex flex-wrap gap-1 mt-2">
              {activeFilters.map((filter, index) => (
                <span key={index} className="badge rounded-pill bg-soft-primary text-primary px-3 border shadow-none" style={{ fontSize: '0.7rem' }}>
                  {filter}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .bg-soft-primary { background-color: #e7f1ff; }
        .tracking-wider { letter-spacing: 0.05em; }
        .x-small-calendar { font-size: 0.75rem !important; }
        .x-small-calendar .react-calendar__tile { padding: 0.5em 0.2em !important; }
        .btn-white { background-color: #fff; border-color: #dee2e6; }
      `}</style>
    </div>
  );
}

export default Filters;
