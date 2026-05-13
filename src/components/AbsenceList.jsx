import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { deleteAttendance, fetchAttendances } from "../store/absenceSlice.jsx";
import { useToast } from "./ToastProvider.jsx";
import ConfirmModal from "./ConfirmModal.jsx";

function AbsenceList({
  onEdit,
  filterType = "all",
  dateRange = null,
  stagiaireFilter = null,
  filiereFilter = null,
}) {
  const dispatch = useDispatch();
  const showToast = useToast();
  const rawAbsences = useSelector((state) => state.absences.items);
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const user = useSelector((state) => state.auth.user);
  const [searchTerm, setSearchTerm] = useState("");
  const [confirm, setConfirm] = useState({ open: false, id: null });

  // Normalize: backend attendance has stagiaire_id; frontend used idstag
  const absences = rawAbsences.map((a) => ({
    ...a,
    idstag: a.stagiaire_id ?? a.idstag,
    justifie: a.justifie ?? !!a.justification,
    date: a.date ?? a.session?.date_session ?? "",
    heures: a.heures ?? 2.5,
  }));

  const getStagiaireName = (absence) => {
    if (absence.stagiaireNom) return absence.stagiaireNom;
    const s = stagiaires.find((st) => st.id === absence.idstag);
    if (!s) return "Inconnu";
    return s.prenom ? `${s.prenom} ${s.nom}` : s.nomComplet || s.nom;
  };

  const getStagiaireFiliere = (id) => {
    const s = stagiaires.find((st) => st.id === id);
    if (!s) return "-";
    const prog = (s.programmes || [])[0];
    return prog?.code_diplome || s.filiere || s.programme_code || "-";
  };

  const filteredAbsences = absences
    .filter((absence) => {
      if (filterType === "justified" && !absence.justifie) return false;
      if (filterType === "unjustified" && absence.justifie) return false;

      if (dateRange && dateRange.length === 2 && (dateRange[0] || dateRange[1])) {
        const start = dateRange[0] ? new Date(dateRange[0]) : null;
        if (start) start.setHours(0, 0, 0, 0);
        const end = dateRange[1] ? new Date(dateRange[1]) : null;
        if (end) end.setHours(23, 59, 59, 999);
        const absDate = new Date(absence.date);
        if (start && absDate < start) return false;
        if (end && absDate > end) return false;
      }

      if (stagiaireFilter && absence.idstag !== parseInt(stagiaireFilter)) return false;

      if (filiereFilter) {
        if (getStagiaireFiliere(absence.idstag) !== filiereFilter) return false;
      }

      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const s = stagiaires.find((st) => st.id === absence.idstag);
        const name = getStagiaireName(absence).toLowerCase();
        const matricule = String(s?.matricule || "").toLowerCase();
        const cin = String(s?.cin || "").toLowerCase();
        const tel = String(s?.telephone || "").toLowerCase();
        return name.includes(q) || matricule.includes(q) || cin.includes(q) || tel.includes(q);
      }

      return true;
    })
    .sort((a, b) => {
      const diff = new Date(b.date) - new Date(a.date);
      return diff !== 0 ? diff : b.id - a.id;
    });

  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, dateRange, stagiaireFilter, filiereFilter, absences.length]);

  const itemsPerPage = 8;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAbsences = filteredAbsences.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAbsences.length / itemsPerPage);

  const handleDelete = async () => {
    const result = await dispatch(deleteAttendance(confirm.id));
    setConfirm({ open: false, id: null });
    if (result.error) {
      showToast("Erreur lors de la suppression.", "error");
    } else {
      dispatch(fetchAttendances());
      showToast("Absence supprimée avec succès.", "success");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("fr-FR");
  };

  return (
    <>
    <div className="card-premium overflow-hidden">
      <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center">
        <h5 className="section-title mb-0 d-flex align-items-center gap-3">
          <span className="avatar-circle avatar-sm avatar-navy">
            <i className="bi bi-calendar2-x-fill" style={{ fontSize: "0.75rem" }}></i>
          </span>
          Historique des Absences
        </h5>
        <span className="badge-soft badge-soft-primary">
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
              placeholder="Rechercher par nom, matricule, CIN ou téléphone..."
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
                <th className="ps-4 py-3 d-none d-sm-table-cell">ID</th>
                <th className="py-3">Stagiaire</th>
                <th className="py-3 d-none d-md-table-cell">Classe</th>
                <th className="py-3">Date</th>
                <th className="py-3 text-center d-none d-md-table-cell">Heures</th>
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
                    <td className="ps-4 body-sm d-none d-sm-table-cell">#{absence.id}</td>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar-circle avatar-md avatar-accent me-3">
                          <i className="bi bi-person-fill" style={{ fontSize: "0.85rem" }}></i>
                        </div>
                        <span className="fw-bold text-dark">
                          {getStagiaireName(absence)}
                        </span>
                      </div>
                    </td>
                    <td className="d-none d-md-table-cell">
                      <span className="badge rounded-pill bg-light text-dark px-3 py-1 border fw-normal">
                        {getStagiaireFiliere(absence.idstag)}
                      </span>
                    </td>
                    <td>
                      <span className="body-sm fw-medium">
                        <i className="bi bi-calendar3 me-2 text-dark-navy opacity-50"></i>
                        {formatDate(absence.date)}
                      </span>
                    </td>
                    <td className="text-center d-none d-md-table-cell">
                      <span className="badge bg-light text-dark fw-bold border rounded-pill px-3 py-1">
                        <i className="bi bi-clock me-1 text-dark-navy"></i>
                        {absence.heures || 2.5}h
                      </span>
                    </td>
                    <td className="text-center">
                      {absence.justifie ? (
                        <span className="badge-soft badge-soft-success">
                          <i className="bi bi-check-circle-fill"></i>Justifiée
                        </span>
                      ) : (
                        <span className="badge-soft badge-soft-danger">
                          <i className="bi bi-x-circle-fill"></i>Non justifiée
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
                            onClick={() => setConfirm({ open: true, id: absence.id })}
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
          <div className="d-flex justify-content-between align-items-center mt-4 border-top pt-3">
            <span className="body-sm">
              Affichage {indexOfFirstItem + 1}-
              {Math.min(indexOfLastItem, filteredAbsences.length)} sur {filteredAbsences.length}
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
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1
                  )
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <li className="page-item disabled">
                          <span className="page-link border-0 text-muted">...</span>
                        </li>
                      )}
                      <li className={`page-item ${currentPage === page ? "active" : ""}`}>
                        <button
                          className={`page-link border-0 ${
                            currentPage === page ? "bg-dark-navy text-white" : "text-dark"
                          }`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    </React.Fragment>
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

    <ConfirmModal
      open={confirm.open}
      title="Supprimer l'absence"
      message="Êtes-vous sûr de vouloir supprimer définitivement cette absence ?"
      confirmLabel="Supprimer"
      variant="danger"
      onConfirm={handleDelete}
      onCancel={() => setConfirm({ open: false, id: null })}
    />
    </>
  );
}

export default AbsenceList;
