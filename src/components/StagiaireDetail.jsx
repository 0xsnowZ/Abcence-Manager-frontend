import { useMemo, useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchTimeBlocks } from "../store/sessionSlice.jsx";
import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const MONTH_NAMES = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Jun",
  "Jul",
  "Aoû",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

const getStagId = (a) => a.idstag ?? a.stagiaire_id;
const isJustified = (a) => a.justifie ?? !!a.justification;
const getHours = (a) => a.heures ?? 2.5;

const PIE_COLOR = { Justifiées: "#10b981", "Non justifiées": "#ef4444" };

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="card-premium p-3"
      style={{ fontSize: "0.8rem", minWidth: 140 }}
    >
      {label && <p className="fw-semibold mb-1">{label}</p>}
      {payload.map((e, i) => (
        <p key={i} style={{ color: e.color, margin: 0 }}>
          {e.name}: <strong>{e.value}</strong>
        </p>
      ))}
    </div>
  );
};

function StagiaireDetail({ stagiaire, onBack }) {
  const dispatch = useDispatch();
  const rawAbsences = useSelector((s) => s.absences.items);
  const { timeBlocks } = useSelector((state) => state.sessions);

  useEffect(() => {
    if (!timeBlocks || timeBlocks.length === 0) {
      dispatch(fetchTimeBlocks());
    }
  }, [dispatch, timeBlocks]);

  const getSeanceLabel = (tbid) => {
    if (!tbid) return "";
    const tb = timeBlocks.find((b) => String(b.id) === String(tbid));
    if (!tb) return "";
    const idx = timeBlocks.findIndex((b) => String(b.id) === String(tbid));
    const slotNum = idx !== -1 ? `S${idx + 1}` : "";
    const timeLabel = tb.heure_debut && tb.heure_fin ? ` (${tb.heure_debut.slice(0, 5)}–${tb.heure_fin.slice(0, 5)})` : "";
    return `${slotNum}${timeLabel}`;
  };

  const stagAbsences = useMemo(
    () =>
      rawAbsences
        .filter((a) => getStagId(a) === stagiaire.id)
        .map((a) => ({
          ...a,
          date: a.date ?? a.session?.date_session ?? "",
          heures: a.heures ?? 2.5,
          justifie: a.justifie ?? !!a.justification,
        })),
    [rawAbsences, stagiaire.id],
  );

  const totalAbsences = stagAbsences.length;
  const totalHeures = stagAbsences.reduce((s, a) => s + getHours(a), 0);
  const justifiedCount = stagAbsences.filter(isJustified).length;
  const tauxJustif =
    totalAbsences > 0 ? Math.round((justifiedCount / totalAbsences) * 100) : 0;

  const trendData = useMemo(() => {
    const map = {};
    stagAbsences.forEach((a) => {
      if (!a.date) return;
      const key = a.date.slice(0, 10);
      if (!map[key]) map[key] = { day: key, Justifiées: 0, "Non just.": 0 };
      if (isJustified(a)) map[key]["Justifiées"]++;
      else map[key]["Non just."]++;
    });
    return Object.values(map)
      .sort((a, b) => a.day.localeCompare(b.day))
      .map((d) => {
        const [y, m, dd] = d.day.split("-");
        return { ...d, day: `${dd}/${m}/${y}` };
      });
  }, [stagAbsences]);

  const pieData = [
    { name: "Justifiées", value: justifiedCount },
    { name: "Non justifiées", value: totalAbsences - justifiedCount },
  ].filter((d) => d.value > 0);

  const sortedAbsences = [...stagAbsences].sort(
    (a, b) => new Date(b.date) - new Date(a.date),
  );

  const displayName = stagiaire.prenom
    ? `${stagiaire.prenom} ${stagiaire.nom}`
    : stagiaire.nomComplet || stagiaire.nom || "—";

  const filiere =
    (stagiaire.programmes || [])[0]?.code_diplome || stagiaire.filiere || "—";

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAbsences = sortedAbsences.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(sortedAbsences.length / itemsPerPage);

  return (
    <div className="anim-fade-in">
      {/* ── Header card ── */}
      <div className="card-premium p-4 mb-4">
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div
            className="avatar-circle avatar-xl flex-shrink-0"
            style={{
              background: ["f", "F"].includes(stagiaire.sexe)
                ? "var(--color-danger-light)"
                : "var(--color-primary-light)",
              color: ["f", "F"].includes(stagiaire.sexe)
                ? "var(--color-danger)"
                : "var(--color-primary)",
              fontSize: "1.6rem",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-grow-1">
            <h2 className="page-title mb-2">{displayName}</h2>
            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="badge-soft badge-soft-primary">{filiere}</span>
              <span className="badge-soft badge-soft-info">
                <i
                  className={`bi bi-gender-${["f", "F"].includes(stagiaire.sexe) ? "female" : "male"} me-1`}
                ></i>
                {["f", "F"].includes(stagiaire.sexe) ? "Féminin" : "Masculin"}
              </span>
              {stagiaire.matricule && (
                <span className="body-sm">
                  <i className="bi bi-hash me-1 opacity-50"></i>
                  {stagiaire.matricule}
                </span>
              )}
              {stagiaire.cin && (
                <span className="body-sm">
                  <i className="bi bi-card-text me-1 opacity-50"></i>
                  {stagiaire.cin}
                </span>
              )}
              {stagiaire.telephone && (
                <span className="body-sm">
                  <i className="bi bi-telephone me-1 opacity-50"></i>
                  {stagiaire.telephone}
                </span>
              )}
            </div>
          </div>
          <button
            className="btn-navy-outline d-flex align-items-center gap-2"
            onClick={onBack}
          >
            <i className="bi bi-arrow-left"></i>Retour
          </button>
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="row g-4 mb-4">
        <div className="col-12 col-sm-4">
          <div className="kpi-card kpi-card--danger">
            <i className="bi bi-calendar-x-fill kpi-bg-icon"></i>
            <div className="kpi-label">Total Absences</div>
            <div className="kpi-number">{totalAbsences}</div>
            <div className="kpi-sub">séances manquées</div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="kpi-card kpi-card--navy">
            <i className="bi bi-clock-fill kpi-bg-icon"></i>
            <div className="kpi-label">Heures Manquées</div>
            <div className="kpi-number">{totalHeures.toFixed(1)}</div>
            <div className="kpi-sub">heures au total</div>
          </div>
        </div>
        <div className="col-12 col-sm-4">
          <div className="kpi-card kpi-card--success">
            <i className="bi bi-shield-check kpi-bg-icon"></i>
            <div className="kpi-label">Taux Justification</div>
            <div className="kpi-number">{tauxJustif}%</div>
            <div className="kpi-sub">
              {justifiedCount} justifiée{justifiedCount !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
      </div>

      {totalAbsences > 0 && (
        <>
          {/* ── Charts ── */}
          <div className="row g-4 mb-4">
            {/* Trend */}
            <div className="col-lg-7">
              <div className="card-premium p-4 h-100">
                <h6 className="section-title mb-4">Évolution par jour</h6>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart
                      data={trendData}
                      margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="gJust" x1="0" y1="0" x2="0" y2="1">
                          <stop
                            offset="5%"
                            stopColor="#10b981"
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="95%"
                            stopColor="#10b981"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="gUnjust"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.18}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--color-border)"
                      />
                      <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Area
                        type="monotone"
                        dataKey="Justifiées"
                        stroke="#10b981"
                        fill="url(#gJust)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="Non just."
                        stroke="#ef4444"
                        fill="url(#gUnjust)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center py-5 body-sm opacity-50">
                    Pas assez de données
                  </div>
                )}
              </div>
            </div>

            {/* Pie */}
            <div className="col-lg-5">
              <div className="card-premium p-4 h-100">
                <h6 className="section-title mb-4">Répartition</h6>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={PIE_COLOR[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── History table ── */}
      <div className="card-premium overflow-hidden">
        <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="section-title mb-0 d-flex align-items-center gap-3">
            <span className="avatar-circle avatar-sm avatar-navy">
              <i
                className="bi bi-calendar2-x-fill"
                style={{ fontSize: "0.75rem" }}
              ></i>
            </span>
            Historique des Absences
          </h5>
          <span className="badge-soft badge-soft-primary">
            {totalAbsences} enregistrements
          </span>
        </div>
        <div className="card-body pt-0">
          {sortedAbsences.length === 0 ? (
            <div className="text-center py-5 body-sm">
              <i className="bi bi-calendar-check fs-1 d-block mb-3 opacity-25 text-success"></i>
              Aucune absence enregistrée — excellent bilan !
            </div>
          ) : (
            <div className="table-responsive scroll-thin">
              <table className="table align-middle mb-0 premium-table">
                <thead>
                  <tr>
                    <th className="ps-4 py-3">Date</th>
                    <th className="py-3">Heures</th>
                    <th className="py-3 text-center">Statut</th>
                    <th className="py-3">Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {currentAbsences.map((a) => (
                    <tr key={a.id}>
                      <td className="ps-4 fw-medium">
                        <span className="d-block">
                          <i className="bi bi-calendar3 me-2 opacity-50"></i>
                          {a.date
                            ? new Date(
                                a.date.slice(0, 10) + "T00:00:00",
                              ).toLocaleDateString("fr-FR")
                            : "—"}
                        </span>
                        {a.time_block_id && (
                          <span className="body-xs text-muted d-block ms-4 seance-mobile-small">
                            {getSeanceLabel(a.time_block_id)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border rounded-pill px-3">
                          <i className="bi bi-clock me-1 opacity-60"></i>
                          {getHours(a)}h
                        </span>
                      </td>
                      <td className="text-center">
                        {isJustified(a) ? (
                          <span className="badge-soft badge-soft-success">
                            <i className="bi bi-check-circle-fill"></i>Justifiée
                          </span>
                        ) : (
                          <span className="badge-soft badge-soft-danger">
                            <i className="bi bi-x-circle-fill"></i>Non justifiée
                          </span>
                        )}
                      </td>
                      <td
                        className="body-sm text-truncate"
                        style={{ maxWidth: 220 }}
                      >
                        {a.justification || (
                          <span className="opacity-40">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light/50">
              <span className="body-sm text-muted">
                Affichage {indexOfFirstItem + 1}-
                {Math.min(indexOfLastItem, sortedAbsences.length)} sur{" "}
                {sortedAbsences.length}
              </span>
              <nav>
                <ul className="pagination pagination-sm mb-0 shadow-sm border rounded">
                  <li
                    className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link border-0 text-dark"
                      onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, i) => (
                    <li
                      key={i + 1}
                      className={`page-item ${currentPage === i + 1 ? "active" : ""}`}
                    >
                      <button
                        className={`page-link border-0 ${
                          currentPage === i + 1
                            ? "bg-dark-navy text-white fw-bold"
                            : "text-dark"
                        }`}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </button>
                    </li>
                  ))}
                  <li
                    className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                  >
                    <button
                      className="page-link border-0 text-dark"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(p + 1, totalPages))
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
      </div>
    </div>
  );
}

export default StagiaireDetail;
