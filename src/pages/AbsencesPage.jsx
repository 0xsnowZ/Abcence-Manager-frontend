import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AbsenceForm from "../components/AbsenceForm.jsx";
import AbsenceList from "../components/AbsenceList.jsx";
import Filters from "../components/Filters.jsx";
import CalendarHistory from "../components/CalendarHistory.jsx";
import { fetchAttendances } from "../store/absenceSlice.jsx";
import { fetchStagiaires } from "../store/stagiaireSlice.jsx";

function AbsencesPage() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { loading, error } = useSelector((state) => state.absences);
  const absences = useSelector((state) => state.absences.items);
  const stagiaires = useSelector((state) => state.stagiaires.items);

  const [showForm,        setShowForm]        = useState(false);
  const [editingAbsence,  setEditingAbsence]  = useState(null);
  const [filters,         setFilters]         = useState({
    filterType: "all",
    dateRange: null,
    stagiaireFilter: null,
    filiereFilter: null,
  });

  useEffect(() => {
    if (absences.length === 0 && !loading) dispatch(fetchAttendances());
    if (stagiaires.length === 0) dispatch(fetchStagiaires());
  }, [dispatch]);

  const handleEdit         = (absence) => { setEditingAbsence(absence); setShowForm(true); };
  const handleSave         = ()        => { setShowForm(false); setEditingAbsence(null); };
  const handleCancel       = ()        => { setShowForm(false); setEditingAbsence(null); };
  const handleFilterChange = (f)       => setFilters(f);

  return (
    <div className="container-xxl px-4 py-5">

      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-start mb-5 page-main-header">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="abs-page-icon">
              <i className="bi bi-calendar-x-fill"></i>
            </div>
            <h1 className="page-title mb-0">Gestion des Absences</h1>
          </div>
          <p className="body-sm mb-0">Suivi et gestion des absences individuelles.</p>
        </div>

        {!showForm && (
          <button
            className="btn-navy d-flex align-items-center gap-2"
            onClick={() => navigate("/saisie")}
          >
            <i className="bi bi-plus-circle-fill"></i>
            Déclarer une Absence
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger rounded-3 mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}


      {showForm ? (
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <AbsenceForm
              absence={editingAbsence}
              onCancel={handleCancel}
              onSave={handleSave}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="mb-4">
            <Filters onFilterChange={handleFilterChange} />
          </div>
          <div className="mb-4">
            <AbsenceList
              onEdit={handleEdit}
              filterType={filters.filterType}
              dateRange={filters.dateRange}
              stagiaireFilter={filters.stagiaireFilter}
              filiereFilter={filters.filiereFilter}
              loading={loading}
            />
          </div>
          <CalendarHistory />
        </>
      )}

    </div>
  );
}

export default AbsencesPage;
