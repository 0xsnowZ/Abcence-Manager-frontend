import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AbsenceForm from "../components/AbsenceForm.jsx";
import AbsenceList from "../components/AbsenceList.jsx";
import Filters from "../components/Filters.jsx";
import CalendarHistory from "../components/CalendarHistory.jsx";

// Absences Page

function AbsencesPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [editingAbsence, setEditingAbsence] = useState(null);
  const [filters, setFilters] = useState({
    filterType: "all",
    dateRange: null,
    stagiaireFilter: null,
    filiereFilter: null,
  });

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
          <p className="text-muted mb-0">
            Suivi et gestion des absences individuelles.
          </p>
        </div>
        {!showForm && (
          <button
            className="btn btn-dark-navy rounded-pill px-4 py-2 shadow fw-bold d-flex align-items-center"
            onClick={() => navigate('/saisie')}
          >
            <i className="bi bi-plus-circle-fill me-2 fs-5"></i>
            Déclarer une Absence
          </button>
        )}
      </div>

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
    </div>
  );
}

export default AbsencesPage;
