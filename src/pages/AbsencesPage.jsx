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
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.absences);
  const stagiaires = useSelector((state) => state.stagiaires.items);

  const [showForm, setShowForm] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [filters, setFilters] = useState({
    filterType: "all",
    dateRange: null,
    stagiaireFilter: null,
    filiereFilter: null,
  });

  useEffect(() => {
    dispatch(fetchAttendances());
    if (stagiaires.length === 0) dispatch(fetchStagiaires());
  }, [dispatch]);

  const handleEdit = (absence) => {
    setEditingAbsence(absence);
    setShowForm(true);
  };

  const handleSave = () => {
    setShowForm(false);
    setEditingAbsence(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAbsence(null);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-5">
        <div>
          <h2 className="fw-bold mb-1">
            <i className="bi bi-calendar-x-fill me-3 text-dark-navy"></i>
            Gestion des Absences
          </h2>
          <p className="text-muted mb-0">Suivi et gestion des absences individuelles.</p>
        </div>
        {!showForm && (
          <button
            className="btn btn-dark-navy rounded-pill px-4 py-2 shadow fw-bold d-flex align-items-center"
            onClick={() => navigate("/saisie")}
          >
            <i className="bi bi-plus-circle-fill me-2 fs-5"></i>
            Déclarer une Absence
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-danger mb-4">
          <i className="bi bi-exclamation-triangle me-2"></i>{error}
        </div>
      )}

      {loading && (
        <div className="text-center py-3">
          <div className="spinner-border spinner-border-sm text-dark me-2" role="status" />
          <span className="text-muted small">Chargement des absences...</span>
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
          <div className="row g-4 mb-5">
            <div className="col-lg-3">
              <Filters onFilterChange={handleFilterChange} />
            </div>
            <div className="col-lg-9">
              <AbsenceList
                onEdit={handleEdit}
                filterType={filters.filterType}
                dateRange={filters.dateRange}
                stagiaireFilter={filters.stagiaireFilter}
                filiereFilter={filters.filiereFilter}
              />
            </div>
          </div>
          <CalendarHistory />
        </>
      )}
      <style>{`
        .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; }
        .btn-dark-navy:hover { background-color: #1a232f; color: #fff; }
        .text-dark-navy { color: #0A121A; }
      `}</style>
    </div>
  );
}

export default AbsencesPage;
