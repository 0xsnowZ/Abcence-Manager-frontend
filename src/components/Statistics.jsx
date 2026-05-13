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
      {/* KPI Cards */}
      <div className="row g-4 mb-5">
        {/* Total */}
        <div className="col-md-4">
          <div className="kpi-card kpi-card--navy hover-lift">
            <i className="bi bi-calendar-x-fill kpi-bg-icon"></i>
            <div className="kpi-label">Total des absences</div>
            <div className="kpi-number">{totalAbsences}</div>
            <div className="kpi-sub">{totalHeures}h au total</div>
          </div>
        </div>

        {/* Justified */}
        <div className="col-md-4">
          <div className="kpi-card kpi-card--success hover-lift">
            <i className="bi bi-check-circle-fill kpi-bg-icon"></i>
            <div className="kpi-label">Absences justifiées</div>
            <div className="kpi-number" style={{ color: "var(--color-success)" }}>{justifiedCount}</div>
            <div className="kpi-sub">{justifiedHeures}h validées</div>
          </div>
        </div>

        {/* Unjustified */}
        <div className="col-md-4">
          <div className="kpi-card kpi-card--danger hover-lift">
            <i className="bi bi-x-circle-fill kpi-bg-icon"></i>
            <div className="kpi-label">Non justifiées</div>
            <div className="kpi-number" style={{ color: "var(--color-danger)" }}>{unjustifiedCount}</div>
            <div className="kpi-sub">{unjustifiedHeures}h à régulariser</div>
          </div>
        </div>
      </div>

      {/* Progress & Recent absences */}
      <div className="row g-4 mb-5">
        <div className="col-lg-5">
          <div className="card-premium h-100">
            <div className="card-header py-3 px-4 d-flex align-items-center gap-3">
              <span className="avatar-circle avatar-md" style={{ background: "var(--color-info-light)", color: "var(--color-info)" }}>
                <i className="bi bi-pie-chart-fill" style={{ fontSize: "0.9rem" }}></i>
              </span>
              <h5 className="section-title mb-0">Répartition Analytique</h5>
            </div>
            <div className="card-body pt-0">
              {totalAbsences > 0 ? (
                <div className="px-2">
                  <div className="mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span className="label-caps">
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
                      <span className="label-caps">
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
          <div className="card-premium h-100">
            <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="section-title mb-0 d-flex align-items-center gap-3">
                <span className="avatar-circle avatar-md" style={{ background: "var(--color-danger-light)", color: "var(--color-danger)" }}>
                  <i className="bi bi-clock-history" style={{ fontSize: "0.9rem" }}></i>
                </span>
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
                    <thead className="label-caps bg-light">
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
                              <small className="body-sm">{filiere}</small>
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

    </div>
  );
}

export default Statistics;
