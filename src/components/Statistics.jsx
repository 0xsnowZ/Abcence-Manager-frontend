import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";

// Statistics Component

function Statistics() {
  const absences = useSelector((state) => state.absences.items);
  const stagiaires = useSelector((state) => state.stagiaires.items);

  // Calculate statistics
  const totalAbsences = absences.length;
  const totalHeures = absences.reduce((sum, a) => sum + (a.heures || 2.5), 0);
  const justifiedAbsences = absences.filter((a) => a.justifie).length;
  const unjustifiedAbsences = absences.filter((a) => !a.justifie).length;
  const justifiedHeures = absences
    .filter((a) => a.justifie)
    .reduce((sum, a) => sum + (a.heures || 2.5), 0);
  const unjustifiedHeures = absences
    .filter((a) => !a.justifie)
    .reduce((sum, a) => sum + (a.heures || 2.5), 0);

  // Get most recent absences
  const lastAbsences = [...absences]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  const getStagiaireInfo = (idstag) => {
    const s = stagiaires.find((st) => st.id === idstag);
    return s ? s : { nom: "Inconnu", filiere: "-" };
  };

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
                  {totalHeures} heures totales
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
                  <h3 className="fw-bold mb-0 mt-1 text-success">
                    {justifiedAbsences}
                  </h3>
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
                  <h3 className="fw-bold mb-0 mt-1 text-danger">
                    {unjustifiedAbsences}
                  </h3>
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

      {/* Progress & Ranking Grid */}
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
                        {Math.round((justifiedAbsences / totalAbsences) * 100)}%
                      </span>
                    </div>
                    <div
                      className="progress rounded-pill shadow-none border"
                      style={{ height: "12px" }}
                    >
                      <div
                        className="progress-bar bg-success rounded-pill"
                        role="progressbar"
                        style={{
                          width: `${(justifiedAbsences / totalAbsences) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="fw-bold small text-muted text-uppercase">
                        Taux d'irrégularité
                      </span>
                      <span className="badge bg-soft-danger text-danger rounded-pill px-3">
                        {Math.round(
                          (unjustifiedAbsences / totalAbsences) * 100,
                        )}
                        %
                      </span>
                    </div>
                    <div
                      className="progress rounded-pill shadow-none border"
                      style={{ height: "12px" }}
                    >
                      <div
                        className="progress-bar bg-danger rounded-pill"
                        role="progressbar"
                        style={{
                          width: `${(unjustifiedAbsences / totalAbsences) * 100}%`,
                        }}
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
                  <i className="bi bi-trophy-fill"></i>
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
                        const stag = getStagiaireInfo(absence.idstag);
                        const date = new Date(absence.date).toLocaleDateString(
                          "fr-FR",
                        );
                        return (
                          <tr key={absence.id}>
                            <td className="ps-3 fw-medium text-muted">
                              <i className="bi bi-calendar3 me-2 text-dark-navy opacity-50"></i>
                              {date}
                            </td>
                            <td>
                              <span className="fw-bold text-dark d-block mb-0">
                                {stag.nom}
                              </span>
                              <small className="text-muted">
                                {stag.filiere}
                              </small>
                            </td>
                            <td className="text-center fw-bold text-dark">
                              {absence.heures || 2.5}h
                            </td>
                            <td className="text-center pe-3">
                              {absence.justifie ? (
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
        .professional-grid { border-collapse: collapse; width: 100%; border: 1px solid #ced4da; }
        .professional-grid th, .professional-grid td { border: 1px solid #adb5bd !important; }
        .border-end-heavy { border-right: 3px solid #495057 !important; }
        .sticky-col { position: sticky; left: 0; z-index: 5; background-color: #fff !important; }
        .cell-slot { position: relative; vertical-align: middle; }
        .is-absent { background-color: #fceaea !important; color: #dc3545; font-weight: bold; }
        .is-justified { background-color: #e6f9ed !important; color: #198754; font-weight: bold; }
        .hover-row:hover .sticky-col { background-color: #f8f9fa !important; }
        .hover-row:hover td { background-color: rgba(0,0,0,0.01); }
      `}</style>
    </div>
  );
}

export default Statistics;
