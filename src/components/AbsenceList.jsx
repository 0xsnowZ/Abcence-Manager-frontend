import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteAbsence } from "../store/absenceSlice.jsx";

// Absence List Component

function AbsenceList({
  onEdit,
  filterType = "all",
  dateRange = null,
  stagiaireFilter = null,
  filiereFilter = null,
}) {
  const dispatch = useDispatch();
  const absences = useSelector((state) => state.absences.items);
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const user = useSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");

  const getStagiaireName = (id) => {
    const stagiaire = stagiaires.find((s) => s.id === id);
    return stagiaire ? stagiaire.nom : "Inconnu";
  };

  const getStagiaireFiliere = (id) => {
    const stagiaire = stagiaires.find((s) => s.id === id);
    return stagiaire ? stagiaire.filiere : "-";
  };

  const filteredAbsences = absences
    .filter((absence) => {
      // Filter by justification type
      if (filterType === "justified" && !absence.justifie) return false;
      if (filterType === "unjustified" && absence.justifie) return false;

      // Filter by date range
      if (
        dateRange &&
        dateRange.length === 2 &&
        (dateRange[0] || dateRange[1])
      ) {
        const start = dateRange[0] ? new Date(dateRange[0]) : null;
        if (start) start.setHours(0, 0, 0, 0);

        const end = dateRange[1] ? new Date(dateRange[1]) : null;
        if (end) end.setHours(23, 59, 59, 999);

        const absDate = new Date(absence.date);

        if (start && absDate < start) return false;
        if (end && absDate > end) return false;
      }

      if (stagiaireFilter && absence.idstag !== parseInt(stagiaireFilter))
        return false;

      // Filter by filière
      if (filiereFilter) {
        const stagiaireFiliere = getStagiaireFiliere(absence.idstag);
        if (stagiaireFiliere !== filiereFilter) return false;
      }

      // Filter by search term
      if (searchTerm) {
        const stagiaireName = getStagiaireName(absence.idstag).toLowerCase();
        return stagiaireName.includes(searchTerm.toLowerCase());
      }

      return true;
    })
    .sort((a, b) => {
      // Sort by date descending
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (dateB - dateA !== 0) return dateB - dateA;
      // If dates are same, sort by ID descending
      return b.id - a.id;
    });

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm,
    filterType,
    dateRange,
    stagiaireFilter,
    filiereFilter,
    absences.length,
  ]);

  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAbsences = filteredAbsences.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(filteredAbsences.length / itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) {
      dispatch(deleteAbsence(id));
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden">
      <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
          <span className="bg-dark-navy text-white p-2 rounded me-3 d-flex shadow-sm">
            <i className="bi bi-calendar2-x-fill"></i>
          </span>
          Historique des Absences
        </h5>
        <span className="badge rounded-pill bg-soft-dark-navy text-dark-navy px-3 py-2 border shadow-none">
          {filteredAbsences.length} Enregistrements
        </span>
      </div>
      <div className="card-body pt-0">
        <div className="mb-4">
          <div className="input-group input-group-lg shadow-sm rounded-pill overflow-hidden border">
            <span className="input-group-text bg-white border-0 ps-4">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-0 bg-white"
              placeholder="Rechercher par nom de stagiaire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle table-hover custom-table">
            <thead className="bg-light text-muted small text-uppercase fw-bold">
              <tr>
                <th className="ps-4 py-3">ID</th>
                <th className="py-3">Stagiaire</th>
                <th className="py-3">Filière</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-center">Heures</th>
                <th className="py-3 text-center">Statut</th>
                <th className="py-3 text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAbsences.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                    <span className="fw-medium">Aucune absence trouvée</span>
                  </td>
                </tr>
              ) : (
                currentAbsences.map((absence) => (
                  <tr key={absence.id} className="transition-all">
                    <td className="ps-4 text-muted small">#{absence.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle me-3 bg-light text-dark-navy shadow-sm border">
                          <i className="bi bi-person-fill"></i>
                        </div>
                        <span className="fw-bold text-dark">
                          {getStagiaireName(absence.idstag)}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="badge rounded-pill bg-light text-dark px-3 py-1 border fw-normal">
                        {getStagiaireFiliere(absence.idstag)}
                      </span>
                    </td>
                    <td>
                      <span className="text-muted small fw-medium">
                        <i className="bi bi-calendar3 me-2 text-dark-navy opacity-50"></i>
                        {formatDate(absence.date)}
                      </span>
                    </td>
                    <td className="text-center">
                      <span className="badge bg-light text-dark fw-bold border rounded-pill px-3 py-1">
                        <i className="bi bi-clock me-1 text-dark-navy"></i>
                        {absence.heures || 2.5}h
                      </span>
                    </td>
                    <td className="text-center">
                      {absence.justifie ? (
                        <span className="badge rounded-pill bg-soft-success text-success px-3 py-1 border border-success">
                          <i className="bi bi-check-circle-fill me-1"></i>
                          Justifiée
                        </span>
                      ) : (
                        <span className="badge rounded-pill bg-soft-danger text-danger px-3 py-1 border border-danger">
                          <i className="bi bi-x-circle-fill me-1"></i>
                          Non justifiée
                        </span>
                      )}
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn-action-round btn-edit shadow-sm"
                          onClick={() => onEdit(absence)}
                          title="Modifier"
                        >
                          <i className="bi bi-pencil-fill"></i>
                        </button>
                        {user?.role === "admin" && (
                          <button
                            className="btn-action-round btn-delete shadow-sm"
                            onClick={() => handleDelete(absence.id)}
                            title="Supprimer"
                          >
                            <i className="bi bi-trash3-fill"></i>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
            <span className="text-muted small">
              Affichage {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredAbsences.length)} sur{" "}
              {filteredAbsences.length}
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0 shadow-sm border rounded">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link border-0 text-dark"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {/* Dynamically generate page numbers to avoid huge lists if many pages */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1,
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <li className="page-item disabled">
                          <span className="page-link border-0 text-muted">
                            ...
                          </span>
                        </li>
                      )}
                      <li
                        className={`page-item ${currentPage === page ? "active" : ""}`}
                      >
                        <button
                          className={`page-link border-0 ${currentPage === page ? "bg-dark-navy text-white pointer-events-none" : "text-dark"}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    </React.Fragment>
                  ))}
                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link border-0 text-dark"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      <style>{`
        .bg-soft-primary { background-color: #e7f1ff; }
        .bg-soft-danger { background-color: #fceaea; }
        .bg-soft-success { background-color: #e6f9ed; }
        .avatar-circle { width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; }
        .custom-table tbody tr { transition: all 0.2s; border-color: #f8f9fa; }
        .custom-table tbody tr:hover { background-color: #fcfcfc; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .btn-action-round { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.85rem; }
        .btn-edit { background-color: #fff; color: #0d6efd; border: 1px solid #e7f1ff; }
        .btn-edit:hover { background-color: #0d6efd; color: #fff; transform: scale(1.1); }
        .btn-delete { background-color: #fff; color: #dc3545; border: 1px solid #fceaea; }
        .btn-delete:hover { background-color: #dc3545; color: #fff; transform: scale(1.1); }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}

export default AbsenceList;
