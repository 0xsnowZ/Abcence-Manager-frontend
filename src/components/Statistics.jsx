import React, { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAttendances } from "../store/absenceSlice.jsx";

// Statistics Component
function Statistics() {
  const dispatch = useDispatch();
  const { items: absences, loading, error } = useSelector((state) => state.absences);
  const stagiaires = useSelector((state) => state.stagiaires.items);

  // Fetch attendances if not yet loaded
  useEffect(() => {
    if (absences.length === 0 && !loading) {
      dispatch(fetchAttendances());
    }
  }, [dispatch, absences.length, loading]);

  // ── Computed stats ──────────────────────────────────────────────────────────
  const totalAbsences = absences.length;

  // Backend stores hours via time_block (2.5h each); fall back to heures field
  const getHours = (a) => a.heures ?? 2.5;

  const totalHeures = useMemo(
    () => absences.reduce((sum, a) => sum + getHours(a), 0),
    [absences]
  );

  const justifiedAbsences = useMemo(
    () => absences.filter((a) => a.justifie || a.justification),
    [absences]
  );

  const unjustifiedAbsences = useMemo(
    () => absences.filter((a) => !a.justifie && !a.justification),
    [absences]
  );

  const justifiedCount = justifiedAbsences.length;
  const unjustifiedCount = unjustifiedAbsences.length;

  const justifiedHeures = useMemo(
    () => justifiedAbsences.reduce((sum, a) => sum + getHours(a), 0),
    [justifiedAbsences]
  );

  const unjustifiedHeures = useMemo(
    () => unjustifiedAbsences.reduce((sum, a) => sum + getHours(a), 0),
    [unjustifiedAbsences]
  );

  // Most recent 5 absences
  const lastAbsences = useMemo(
    () =>
      [...absences]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [absences]
  );

  const getStagiaireInfo = (idstag) => {
    const s = stagiaires.find((st) => st.id === idstag || st.id === Number(idstag));
    if (!s) return { nom: "Inconnu", filiere: "-" };
    const nom =
      s.nomComplet ||
      `${s.prenom || ""} ${s.nom || ""}`.trim() ||
      s.nom ||
      "Inconnu";
    const filiere = s.filiere || s.programme_code || "-";
    return { nom, filiere };
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading && absences.length === 0) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="spinner-border text-dark-navy mb-3" role="status"></div>
        <p className="fw-medium">Chargement des statistiques…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger d-flex align-items-center shadow-sm" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        <div>{error}</div>
      </div>
    );
  }

  return (
    <div className="stats-container">
      {/* Summary Cards */}
      <div className="row g-4 mb-5">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 overflow-hidden transition-all hover-lift">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="bg-dark-navy text-white rounded-circle me-3 shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", flexShrink: 0 }}
                >
                  <i className="bi bi-calendar-x-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fw-bold text-uppercase tracking-wider">
                    Total des absences
                  </h6>
                  <h3 className="fw-bold mb-0 mt-1">{totalAbsences}</h3>
                </div>
              </div>
              <div className="mt-2">
                <span className="badge rounded-pill bg-light text-dark-navy border px-3 py-1 fw-bold">
                  {totalHeures}h totales
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 overflow-hidden transition-all hover-lift">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="bg-soft-success text-success rounded-circle me-3 shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", flexShrink: 0 }}
                >
                  <i className="bi bi-check-circle-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fw-bold text-uppercase tracking-wider">
                    Justifiées
                  </h6>
                  <h3 className="fw-bold mb-0 mt-1 text-success">{justifiedCount}</h3>
                </div>
              </div>
              <div className="mt-2">
                <span className="badge rounded-pill bg-soft-success text-success border border-success px-3 py-1 fw-bold">
                  {justifiedHeures}h validées
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm h-100 overflow-hidden transition-all hover-lift">
            <div className="card-body p-4">
              <div className="d-flex align-items-center mb-3">
                <div
                  className="bg-soft-danger text-danger rounded-circle me-3 shadow-sm d-flex align-items-center justify-content-center"
                  style={{ width: "60px", height: "60px", flexShrink: 0 }}
                >
                  <i className="bi bi-x-circle-fill fs-4"></i>
                </div>
                <div>
                  <h6 className="text-muted mb-0 small fw-bold text-uppercase tracking-wider">
                    Non Justifiées
                  </h6>
                  <h3 className="fw-bold mb-0 mt-1 text-danger">{unjustifiedCount}</h3>
                </div>
              </div>
              <div className="mt-2">
                <span className="badge rounded-pill bg-soft-danger text-danger border border-danger px-3 py-1 fw-bold">
                  {unjustifiedHeures}h à régulariser
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Recent absences */}
      <div className="row g-4 mb-5">
        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-3 border-bottom-0 d-flex align-items-center">
              <div
                className="bg-info text-white rounded-circle me-3 shadow-sm d-flex align-items-center justify-content-center"
                style={{ width: "48px", height: "48px", flexShrink: 0 }}
              >
                <i className="bi bi-pie-chart-fill"></i>
              </div>
              <h5 className="mb-0 fw-bold">Répartition Analytique</h5>
            </div>
            <div className="card-body pt-0">
              {totalAbsences > 0 ? (
                <div className="px-2">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-bold small text-muted text-uppercase">
                        Taux de justification
                      </span>
                      <span className="badge bg-soft-success text-success rounded-pill px-3">
                        {Math.round((justifiedCount / totalAbsences) * 100)}%
                      </span>
                    </div>
                    <div
                      className="progress rounded-pill shadow-none border"
                      style={{ height: "12px" }}
                    >
                      <div
                        className="progress-bar bg-success rounded-pill"
                        role="progressbar"
                        style={{ width: `${(justifiedCount / totalAbsences) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-bold small text-muted text-uppercase">
                        Taux d'irrégularité
                      </span>
                      <span className="badge bg-soft-danger text-danger rounded-pill px-3">
                        {Math.round((unjustifiedCount / totalAbsences) * 100)}%
                      </span>
                    </div>
                    <div
                      className="progress rounded-pill shadow-none border"
                      style={{ height: "12px" }}
                    >
                      <div
                        className="progress-bar bg-danger rounded-pill"
                        role="progressbar"
                        style={{ width: `${(unjustifiedCount / totalAbsences) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                  Aucune donnée disponible
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white py-4 border-bottom-0 d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                <div
                  className="bg-soft-danger text-danger rounded-circle me-3 d-flex align-items-center justify-content-center"
                  style={{ width: "48px", height: "48px", flexShrink: 0 }}
                >
                  <i className="bi bi-clock-history"></i>
                </div>
                Dernières absences
              </h5>
            </div>
            <div className="card-body pt-0">
              {lastAbsences.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-inbox fs-1 d-block mb-3 opacity-25"></i>
                  Aucun record d'absence
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table align-middle custom-table">
                    <thead className="bg-light text-muted small text-uppercase fw-bold">
                      <tr>
                        <th className="ps-3 border-0">Date</th>
                        <th className="border-0">Stagiaire</th>
                        <th className="border-0 text-center">Heures</th>
                        <th className="border-0 text-center pe-3">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lastAbsences.map((absence) => {
                        const stag = getStagiaireInfo(absence.idstag || absence.stagiaire_id);
                        // Use stagiaireNom from normalized data if available
                        const displayName = absence.stagiaireNom || stag.nom;
                        const filiere = absence.stagiaireFiliere || stag.filiere;
                        const date = new Date(absence.date + "T00:00:00").toLocaleDateString("fr-FR");
                        const isJustified = absence.justifie || !!absence.justification;
                        return (
                          <tr key={absence.id}>
                            <td className="ps-3 fw-medium text-muted">
                              <i className="bi bi-calendar3 me-2 text-dark-navy opacity-50"></i>
                              {date}
                            </td>
                            <td>
                              <span className="fw-bold text-dark d-block mb-0">
                                {displayName}
                              </span>
                              <small className="text-muted">{filiere}</small>
                            </td>
                            <td className="text-center fw-bold text-dark">
                              {getHours(absence)}h
                            </td>
                            <td className="text-center pe-3">
                              {isJustified ? (
                                <span className="badge rounded-pill bg-soft-success text-success px-3 py-1 border border-success">
                                  Justifiée
                                </span>
                              ) : (
                                <span className="badge rounded-pill bg-soft-danger text-danger px-3 py-1 border border-danger">
                                  Non justifiée
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .bg-dark-navy { background-color: #0A121A; }
        .text-dark-navy { color: #0A121A; }
        .bg-soft-primary { background-color: #f0f7ff; }
        .bg-soft-danger { background-color: #fff1f1; }
        .bg-soft-success { background-color: #f0fff4; }
        .bg-soft-warning { background-color: #fffbf0; }
        .tracking-wider { letter-spacing: 0.05em; }
        .hover-lift { transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .hover-lift:hover { transform: translateY(-5px); }
        .custom-table tbody tr { border-color: #f8f9fa; }
        .custom-table tbody tr:last-child { border-bottom: none; }
        .card { border: 1px solid rgba(0,0,0,0.05) !important; }
      `}</style>
    </div>
  );
}

export default Statistics;
