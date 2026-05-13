import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteStagiaire } from "../store/stagiaireSlice.jsx";
import { deleteAttendance } from "../store/absenceSlice.jsx";

function StagiaireList({ onEdit, filiere, onBack }) {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const absences = useSelector((state) => state.absences.items);
  const user = useSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");

  const getAbsenceCount = (stagiaireId) =>
    absences.filter((a) => (a.stagiaire_id || a.idstag) === stagiaireId).length;

  const getDisplayName = (s) => {
    if (s.prenom && s.nom) return `${s.prenom} ${s.nom}`;
    return s.nomComplet || s.nom || "—";
  };

  const filteredStagiaires = useMemo(() => {
    return stagiaires
      .filter((s) =>
        (s.programmes || []).some((p) => p.code_diplome === filiere)
      )
      .filter((s) =>
        getDisplayName(s).toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  const handleDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce stagiaire ?")) {
      const related = absences.filter((a) => (a.stagiaire_id || a.idstag) === id);
      for (const a of related) {
        await dispatch(deleteAttendance(a.id));
      }
      dispatch(deleteStagiaire(id));
    }
  };

  return (
    <div className="card-premium overflow-hidden anim-fade-in">
      <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div className="d-flex align-items-center flex-wrap gap-2">
          <button className="btn-navy-outline d-inline-flex align-items-center gap-1 me-2 py-1 px-3" style={{ fontSize: "0.82rem" }} onClick={onBack}>
            <i className="bi bi-arrow-left"></i>Retour
          </button>
          <h5 className="section-title mb-0 d-flex align-items-center gap-3">
            <span className="avatar-circle avatar-md avatar-navy">
              <i className="bi bi-mortarboard-fill" style={{ fontSize: "0.85rem" }}></i>
            </span>
            Stagiaires — {filiere}
          </h5>
        </div>
        <span className="badge-soft badge-soft-primary">
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
              style={{ boxShadow: "none" }}
            />
          </div>
        </div>

        <div className="table-responsive scroll-thin">
          <table className="table align-middle mb-0 premium-table">
            <thead>
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
                    <td className="ps-4 body-sm">#{stagiaire.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className={`avatar-circle avatar-md me-3 ${
                            ["f", "F"].includes(stagiaire.sexe)
                              ? "bg-soft-danger text-danger"
                              : "avatar-accent"
                          }`}
                        >
                          {getDisplayName(stagiaire).charAt(0).toUpperCase()}
                        </div>
                        <span className="fw-bold text-dark">{getDisplayName(stagiaire)}</span>
                      </div>
                    </td>
                    <td className="text-center">
                      {["m", "H"].includes(stagiaire.sexe) ? (
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
                        className={`badge rounded-pill px-3 py-1 ${
                          getAbsenceCount(stagiaire.id) > 0
                            ? "bg-soft-warning text-warning border border-warning"
                            : "bg-soft-success text-success border border-success"
                        }`}
                      >
                        {getAbsenceCount(stagiaire.id)} séances
                      </span>
                    </td>
                    <td className="text-end pe-4">
                      <div className="d-flex justify-content-end gap-2">
                        {user?.role === "admin" && (
                          <button
                            className="btn-action-round btn-edit shadow-sm"
                            onClick={() => onEdit(stagiaire)}
                            title="Modifier"
                          >
                            <i className="bi bi-pencil-fill"></i>
                          </button>
                        )}
                        {user?.role === "admin" && (
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

        {totalPages > 1 && (
          <div className="d-flex justify-content-between align-items-center mt-4">
            <span className="body-sm">
              Affichage {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredStagiaires.length)} sur{" "}
              {filteredStagiaires.length}
            </span>
            <nav>
              <ul className="pagination pagination-sm mb-0 shadow-sm border rounded">
                <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link border-0 text-dark"
                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>
                {[...Array(totalPages)].map((_, i) => (
                  <li key={i + 1} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                    <button
                      className={`page-link border-0 ${
                        currentPage === i + 1 ? "bg-dark-navy text-white" : "text-dark"
                      }`}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link border-0 text-dark"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
}

export default StagiaireList;
