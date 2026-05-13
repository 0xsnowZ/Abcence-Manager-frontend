import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteStagiaire } from "../store/stagiaireSlice.jsx";
import { deleteAbsence } from "../store/absenceSlice.jsx";

// Stagiaire List Component

function StagiaireList({ onEdit, filiere, onBack }) {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const absences = useSelector((state) => state.absences.items);
  const user = useSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");

  const getAbsenceCount = (stagiaireId) => {
    return absences.filter((a) => a.idstag === stagiaireId).length;
  };

  const filteredStagiaires = useMemo(() => {
    return stagiaires
      .filter((s) => s.filiere === filiere)
      .filter((s) => s.nom.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [stagiaires, filiere, searchTerm]);

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filiere, stagiaires.length]);

  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStagiaires = filteredStagiaires.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStagiaires.length / itemsPerPage);

  const handleDelete = (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce stagiaire ?")) {
      dispatch(deleteStagiaire(id));
      // Also delete related absences
      const relatedAbsences = absences.filter((a) => a.idstag === id);
      relatedAbsences.forEach((a) => dispatch(deleteAbsence(a.id)));
    }
  };

  return (
    <div className="card border-0 shadow-sm overflow-hidden anim-fade-in">
      <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-sm btn-outline-dark-navy rounded-pill me-3 px-3 d-flex align-items-center"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left me-1"></i>
            Retour
          </button>
          <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
            <span className="bg-dark-navy text-white p-2 rounded me-3 d-flex shadow-sm">
              <i className="bi bi-mortarboard-fill"></i>
            </span>
            Stagiaires - {filiere}
          </h5>
        </div>
        <span className="badge rounded-pill bg-soft-dark-navy text-dark-navy px-3 py-2 border shadow-none">
          {filteredStagiaires.length} Inscrits
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
              placeholder={`Rechercher un stagiaire dans ${filiere}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ boxShadow: 'none' }}
            />
          </div>
        </div>

        <div className="table-responsive">
          <table className="table align-middle table-hover custom-table">
            <thead className="bg-light text-muted small text-uppercase fw-bold">
              <tr>
                <th className="ps-4 py-3">ID</th>
                <th className="py-3">Nom Complet</th>
                <th className="py-3 text-center">Genre</th>
                <th className="py-3 text-center">Absences</th>
                <th className="py-3 text-end pe-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStagiaires.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-5">
                    <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                    <span className="fw-medium">Aucun stagiaire trouvé</span>
                  </td>
                </tr>
              ) : (
                currentStagiaires.map((stagiaire) => (
                  <tr key={stagiaire.id} className="transition-all">
                    <td className="ps-4 text-muted small">#{stagiaire.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className={`avatar-circle me-3 shadow-sm ${stagiaire.sexe === "f" ? "bg-soft-danger text-danger" : "bg-soft-dark-navy text-dark-navy"}`}>
                          {stagiaire.nom.charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-bold text-dark">{stagiaire.nom}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      {stagiaire.sexe === "m" ? (
                        <span className="text-dark-navy" title="Masculin">
                          <i className="bi bi-gender-male fs-5"></i>
                        </span>
                      ) : (
                        <span className="text-danger" title="Féminin">
                          <i className="bi bi-gender-female fs-5"></i>
                        </span>
                      )}
                    </td>
                    <td className="text-center">
                      <span
                        className={`badge rounded-pill px-3 py-1 ${getAbsenceCount(stagiaire.id) > 0 ? "bg-soft-warning text-warning border border-warning" : "bg-soft-success text-success border border-success"}`}
                      >
                        {getAbsenceCount(stagiaire.id)} séances
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        {user?.role === 'admin' && (
                          <button
                            className="btn-action-round btn-edit shadow-sm"
                            onClick={() => onEdit(stagiaire)}
                            title="Modifier"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            className="btn-action-round btn-delete shadow-sm"
                            onClick={() => handleDelete(stagiaire.id)}
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
          <div className="d-flex justify-content-between align-items-center mt-4">
            <span className="text-muted small">
              Affichage {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredStagiaires.length)} sur {filteredStagiaires.length}
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0 shadow-sm border rounded">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link border-0 text-dark" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}>
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                    <button
                      className={`page-link border-0 ${currentPage === i + 1 ? 'bg-dark-navy text-white pointer-events-none' : 'text-dark'}`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link border-0 text-dark" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}>
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
      <style>{`
        .anim-fade-in { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .bg-soft-primary { background-color: #e7f1ff; }
        .bg-soft-danger { background-color: #fceaea; }
        .bg-soft-warning { background-color: #fff8e6; }
        .bg-soft-success { background-color: #e6f9ed; }
        .avatar-circle { width: 38px; height: 38px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 0.9rem; }
        .custom-table tbody tr { transition: all 0.2s; border-color: #f8f9fa; }
        .custom-table tbody tr:hover { background-color: #fcfcfc; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.02); }
        .btn-action-round { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.85rem; }
        .btn-edit { background-color: #fff; color: #0d6efd; border: 1px solid #e7f1ff; }
        .btn-edit:hover { background-color: #0d6efd; color: #fff; transform: scale(1.1); }
        .btn-delete { background-color: #fff; color: #dc3545; border: 1px solid #fceaea; }
        .btn-delete:hover { background-color: #dc3545; color: #fff; transform: scale(1.1); }
        .btn-outline-dark-navy { color: #0A121A; border-color: #0A121A; }
        .btn-outline-dark-navy:hover { background-color: #0A121A; color: #fff; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}

export default StagiaireList;
