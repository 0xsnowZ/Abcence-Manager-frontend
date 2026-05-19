import { useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAttendances } from "../store/absenceSlice.jsx";
import { Users, AlertTriangle, Clock, BarChart3 } from "lucide-react";
import { SkeletonStatCards, SkeletonTableRows } from "../components/Skeleton.jsx";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  RadialBarChart, RadialBar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

// ── helpers ─────────────────────────────────────────────────────────────────
const getStagiaireClasse = (s) =>
  (s.programmes || [])[0]?.code_diplome || s.filiere || s.programme_code || "";

const getStagId  = (a) => a.idstag ?? a.stagiaire_id;
const isJustified = (a) => a.justifie ?? !!a.justification;
const getHours   = (a) => a.heures ?? 2.5;

const getStagName = (s) =>
  s.nomComplet ||
  `${s.prenom || ""} ${s.nom || ""}`.trim() ||
  s.nom ||
  "Inconnu";

const BAR_COLORS = ["#6366f1","#8b5cf6","#0ea5e9","#10b981","#f59e0b","#f43f5e","#ec4899"];
const PIE_COLORS = ["#10b981", "#f43f5e"];
const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

// ── chart tooltip ────────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-premium p-3" style={{ fontSize: "0.8rem", minWidth: 120 }}>
      {label && <p className="fw-semibold mb-1 text-dark">{label}</p>}
      {payload.map((e, i) => (
        <p key={i} className="mb-0" style={{ color: e.color }}>
          {e.name}: <strong>{e.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── component ────────────────────────────────────────────────────────────────
function Statistics({ selectedMonth }) {
  const dispatch = useDispatch();
  const { items: absences, loading, error } = useSelector((state) => state.absences);
  const stagiaires = useSelector((state) => state.stagiaires.items);

  useEffect(() => {
    if (absences.length === 0 && !loading) dispatch(fetchAttendances());
  }, [dispatch, absences.length, loading]);

  const normalizedAbsences = useMemo(() =>
    absences.map((a) => ({
      ...a,
      date: (a.date ?? a.session?.date_session ?? "").slice(0, 10),
      heures: a.heures ?? 2.5,
      justifie: a.justifie ?? !!a.justification,
    })),
    [absences]
  );

  const filteredAbsences = useMemo(() => {
    if (!selectedMonth) return normalizedAbsences;
    return normalizedAbsences.filter((a) => a.date.startsWith(selectedMonth));
  }, [normalizedAbsences, selectedMonth]);

  // ── computed ──────────────────────────────────────────────────────────────
  const totalAbsences     = filteredAbsences.length;
  const totalHeures       = useMemo(() => filteredAbsences.reduce((s, a) => s + getHours(a), 0), [filteredAbsences]);
  const justifiedCount    = useMemo(() => filteredAbsences.filter(isJustified).length, [filteredAbsences]);
  const unjustifiedCount  = totalAbsences - justifiedCount;
  const justifiedPct      = totalAbsences > 0 ? Math.round((justifiedCount / totalAbsences) * 100) : 0;

  const filieres = useMemo(() =>
    [...new Set(stagiaires.map(getStagiaireClasse).filter(Boolean))],
    [stagiaires]
  );

  const absencesByFiliere = useMemo(() =>
    filieres.map((fil, idx) => {
      const filStags   = stagiaires.filter((s) => getStagiaireClasse(s) === fil);
      const filAbsArr  = filteredAbsences.filter((a) => filStags.some((s) => s.id === getStagId(a)));
      return {
        filiere:  fil.length > 12 ? fil.substring(0, 12) + "…" : fil,
        fullName: fil,
        absences: filAbsArr.length,
        heures:   filAbsArr.reduce((s, a) => s + getHours(a), 0),
        fill:     BAR_COLORS[idx % BAR_COLORS.length],
      };
    }).filter((f) => f.heures > 0).sort((a, b) => b.heures - a.heures),
    [filieres, stagiaires, filteredAbsences]
  );

  const pieData = useMemo(() => [
    { name: "Justifiées",     value: justifiedCount },
    { name: "Non Justifiées", value: unjustifiedCount },
  ], [justifiedCount, unjustifiedCount]);

  // Trend chart: daily when a month is selected, monthly otherwise
  const trendData = useMemo(() => {
    const acc = {};
    if (selectedMonth) {
      filteredAbsences.forEach((a) => {
        if (!a.date) return;
        const [, , dd] = a.date.split("-");
        const key = a.date;
        const label = `${dd}/${selectedMonth.split("-")[1]}`;
        if (!acc[key]) acc[key] = { month: label, sortKey: key, justified: 0, unjustified: 0 };
        if (isJustified(a)) acc[key].justified++;
        else acc[key].unjustified++;
      });
    } else {
      normalizedAbsences.forEach((a) => {
        if (!a.date) return;
        const parts = a.date.split("-");
        if (parts.length < 2) return;
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const key = `${y}-${String(m).padStart(2, "0")}`;
        if (!acc[key]) acc[key] = { month: `${MONTH_NAMES[m - 1] || m} ${y}`, sortKey: key, justified: 0, unjustified: 0 };
        if (isJustified(a)) acc[key].justified++;
        else acc[key].unjustified++;
      });
    }
    return Object.values(acc).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [normalizedAbsences, filteredAbsences, selectedMonth]);

  const topAbsents = useMemo(() =>
    stagiaires
      .map((stag) => {
        const stagAbs = filteredAbsences.filter((a) => getStagId(a) === stag.id);
        return {
          ...stag,
          totalAbsences: stagAbs.length,
          totalHeures:   stagAbs.reduce((s, a) => s + getHours(a), 0),
          justified:     stagAbs.filter(isJustified).length,
          unjustified:   stagAbs.filter((a) => !isJustified(a)).length,
        };
      })
      .filter((s) => s.totalAbsences > 0)
      .sort((a, b) => b.totalHeures - a.totalHeures)
      .slice(0, 5),
    [stagiaires, filteredAbsences]
  );

  const recentAbsences = useMemo(() =>
    [...filteredAbsences]
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .slice(0, 6)
      .map((abs) => {
        const stag = stagiaires.find((s) => s.id === getStagId(abs));
        return {
          ...abs,
          stagNom:    stag ? getStagName(stag) : abs.stagiaireNom || "Inconnu",
          stagFiliere: stag ? getStagiaireClasse(stag) : abs.stagiaireFiliere || "-",
        };
      }),
    [filteredAbsences, stagiaires]
  );

  const radialData = [{ name: "Justifiées", value: justifiedPct, fill: "#10b981" }];

  // ── KPI cards config ──────────────────────────────────────────────────────
  const kpiCards = [
    {
      label:    "Total Stagiaires",
      value:    stagiaires.length,
      icon:     Users,
      color:    "#6366f1",
      bg:       "rgba(99,102,241,0.1)",
      trendUp:  true,
    },
    {
      label:    "Total Absences",
      value:    totalAbsences,
      icon:     AlertTriangle,
      color:    "#f43f5e",
      bg:       "rgba(244,63,94,0.1)",
      trendUp:  false,
    },
    {
      label:    "Heures d'Absence",
      value:    `${totalHeures}h`,
      icon:     Clock,
      color:    "#f59e0b",
      bg:       "rgba(245,158,11,0.1)",
      trendUp:  false,
    },
  ];

  // ── loading / error states ────────────────────────────────────────────────
  if (loading && absences.length === 0) {
    return (
      <div>
        <SkeletonStatCards count={3} />
        <div
          className="p-0 mt-2"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <table className="table align-middle mb-0">
            <SkeletonTableRows rows={6} cols={5} />
          </table>
        </div>
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

  const cardStyle = {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-lg)",
    boxShadow: "var(--shadow-card)",
  };
  const headerStyle = {
    borderBottom: "1px solid var(--color-border)",
  };
  const gridColor  = "#f1f5f9";
  const tickColor  = "#94a3b8";
  const rankGradients = [
    "linear-gradient(135deg,#6366f1,#8b5cf6)",
    "linear-gradient(135deg,#0ea5e9,#38bdf8)",
    "linear-gradient(135deg,#f59e0b,#fbbf24)",
  ];

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div className="row g-4 mb-4">
        {kpiCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="col-12 col-sm-6 col-lg-4">
              <div style={{ ...cardStyle, transition: "box-shadow 0.2s, transform 0.2s" }}
                className="p-4 hover-lift">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center justify-content-center rounded-3"
                    style={{ width: 44, height: 44, background: c.bg }}>
                    <Icon size={20} color={c.color} />
                  </div>
                  <span className="badge rounded-pill d-flex align-items-center gap-1"
                    style={{
                      background: c.trendUp ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                      color:      c.trendUp ? "#059669" : "#e11d48",
                      fontSize:   "0.75rem",
                      fontWeight: 600,
                    }}>
                    <i className={`bi bi-arrow-${c.trendUp ? "up" : "down"}-right`}></i>
                  </span>
                </div>
                <p className="mb-1" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--color-text)" }}>
                  {c.value}
                </p>
                <p className="body-sm mb-0">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Row 2: Area Trend + Pie ── */}
      <div className="row g-4 mb-4">
        {/* Area Chart */}
        <div className="col-lg-8">
          <div style={cardStyle} className="overflow-hidden h-100">
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center justify-content-center rounded-2"
                  style={{ width: 32, height: 32, background: "rgba(99,102,241,0.1)" }}>
                  <i className="bi bi-activity" style={{ color: "#6366f1", fontSize: "0.9rem" }}></i>
                </div>
                <span className="section-title">Tendance des Absences</span>
              </div>
              <div className="d-flex gap-3">
                <span className="body-sm d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: "#10b981" }}></span>
                  Justifiées
                </span>
                <span className="body-sm d-flex align-items-center gap-1">
                  <span className="rounded-circle d-inline-block" style={{ width: 10, height: 10, background: "#f43f5e" }}></span>
                  Non Justifiées
                </span>
              </div>
            </div>
            <div className="p-3" style={{ height: 280 }}>
              {trendData.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted body-sm">
                  <i className="bi bi-inbox me-2 opacity-50"></i>Aucune donnée de tendance
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradJust" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gradUnjust" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#f43f5e" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="justified"   name="Justifiées"     stroke="#10b981" strokeWidth={2.5} fill="url(#gradJust)" />
                    <Area type="monotone" dataKey="unjustified" name="Non Justifiées" stroke="#f43f5e" strokeWidth={2.5} fill="url(#gradUnjust)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="col-lg-4">
          <div style={cardStyle} className="overflow-hidden h-100">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(16,185,129,0.1)" }}>
                <i className="bi bi-check-circle-fill" style={{ color: "#10b981", fontSize: "0.9rem" }}></i>
              </div>
              <span className="section-title">Répartition</span>
            </div>
            <div className="p-3">
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                      paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 d-flex flex-column gap-2">
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3"
                  style={{ background: "rgba(16,185,129,0.08)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle" style={{ width: 12, height: 12, background: "#10b981", display: "inline-block" }}></span>
                    <span className="body-sm fw-medium">Justifiées</span>
                  </div>
                  <span className="fw-bold" style={{ color: "#10b981", fontSize: "0.85rem" }}>
                    {justifiedCount} <span className="text-muted fw-normal">({justifiedPct}%)</span>
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3"
                  style={{ background: "rgba(244,63,94,0.08)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle" style={{ width: 12, height: 12, background: "#f43f5e", display: "inline-block" }}></span>
                    <span className="body-sm fw-medium">Non Justifiées</span>
                  </div>
                  <span className="fw-bold" style={{ color: "#f43f5e", fontSize: "0.85rem" }}>
                    {unjustifiedCount} <span className="text-muted fw-normal">({100 - justifiedPct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 3: Bar Chart + Top Absents ── */}
      <div className="row g-4 mb-4">
        {/* Bar Chart */}
        <div className="col-lg-7">
          <div style={cardStyle} className="overflow-hidden h-100">
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center justify-content-center rounded-2"
                  style={{ width: 32, height: 32, background: "rgba(139,92,246,0.1)" }}>
                  <BarChart3 size={16} color="#8b5cf6" />
                </div>
                <span className="section-title">Absences par Filière</span>
              </div>
              <span className="body-sm">{filieres.length} filières</span>
            </div>
            <div className="p-3" style={{ height: 300 }}>
              {absencesByFiliere.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted body-sm">
                  <i className="bi bi-inbox me-2 opacity-50"></i>Aucune donnée
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={absencesByFiliere} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                    <XAxis dataKey="filiere" tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: tickColor }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
                    <Bar dataKey="heures" name="Heures" radius={[6, 6, 0, 0]}>
                      {absencesByFiliere.map((entry, i) => (
                        <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Absents */}
        <div className="col-lg-5">
          <div style={cardStyle} className="overflow-hidden h-100">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(244,63,94,0.1)" }}>
                <i className="bi bi-trophy-fill" style={{ color: "#f43f5e", fontSize: "0.9rem" }}></i>
              </div>
              <span className="section-title">Top Absences</span>
            </div>
            <div>
              {topAbsents.length === 0 ? (
                <div className="text-center py-5 body-sm text-muted">
                  <i className="bi bi-inbox d-block mb-2 opacity-25" style={{ fontSize: "2rem" }}></i>
                  Aucune donnée
                </div>
              ) : (
                topAbsents.map((stag, index) => {
                  const maxH   = Math.max(...topAbsents.map((s) => s.totalHeures), 1);
                  const barPct = (stag.totalHeures / maxH) * 100;
                  return (
                    <div key={stag.id}
                      className="d-flex align-items-center gap-3 px-4 py-3"
                      style={{ borderBottom: index < topAbsents.length - 1 ? "1px solid var(--color-border)" : "none" }}>
                      <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold text-white"
                        style={{
                          width: 32, height: 32, fontSize: "0.75rem",
                          background: index < 3 ? rankGradients[index] : "var(--color-bg)",
                          color: index < 3 ? "#fff" : "var(--color-text-muted)",
                        }}>
                        {index + 1}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-semibold text-truncate" style={{ fontSize: "0.875rem" }}>{getStagName(stag)}</span>
                          <span className="body-sm text-muted ms-2 flex-shrink-0">{getStagiaireClasse(stag)}</span>
                        </div>
                        <div className="rounded-pill overflow-hidden mb-1" style={{ height: 6, background: "var(--color-bg)" }}>
                          <div className="rounded-pill"
                            style={{
                              width: `${barPct}%`, height: "100%",
                              background: index === 0
                                ? "linear-gradient(90deg,#e11d48,#f43f5e)"
                                : index === 1
                                  ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                                  : "linear-gradient(90deg,#94a3b8,#cbd5e1)",
                              transition: "width 0.7s",
                            }}
                          />
                        </div>
                        <div className="d-flex gap-3">
                          <span className="body-sm">{stag.totalAbsences} absences</span>
                          <span className="fw-semibold" style={{ color: "#f43f5e", fontSize: "0.78rem" }}>{stag.totalHeures}h</span>
                          <span style={{ color: "#10b981", fontSize: "0.78rem" }}>{stag.justified} just.</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Row 4: Recent Absences + Quick Stats ── */}
      <div className="row g-4">
        {/* Recent Absences Table */}
        <div className="col-lg-8">
          <div style={cardStyle} className="overflow-hidden">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(245,158,11,0.1)" }}>
                <i className="bi bi-clock-history" style={{ color: "#f59e0b", fontSize: "0.9rem" }}></i>
              </div>
              <span className="section-title">Absences Récentes</span>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0 custom-table">
                <thead className="label-caps" style={{ background: "var(--color-bg)" }}>
                  <tr>
                    <th className="ps-4 py-3 border-0">Stagiaire</th>
                    <th className="py-3 border-0 d-none d-md-table-cell">Filière</th>
                    <th className="py-3 border-0 text-center">Date</th>
                    <th className="py-3 border-0 text-center d-none d-sm-table-cell">Heures</th>
                    <th className="py-3 border-0 text-center pe-4">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAbsences.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 body-sm text-muted">
                        <i className="bi bi-inbox d-block mb-2 opacity-25" style={{ fontSize: "1.5rem" }}></i>
                        Aucune absence récente
                      </td>
                    </tr>
                  ) : recentAbsences.map((abs) => {
                    const just = isJustified(abs);
                    return (
                      <tr key={abs.id}>
                        <td className="ps-4">
                          <div className="d-flex align-items-center gap-2">
                            <div className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold flex-shrink-0"
                              style={{
                                width: 32, height: 32, fontSize: "0.75rem",
                                background: just
                                  ? "linear-gradient(135deg,#10b981,#34d399)"
                                  : "linear-gradient(135deg,#f43f5e,#fb7185)",
                              }}>
                              {abs.stagNom.charAt(0).toUpperCase()}
                            </div>
                            <span className="fw-medium" style={{ fontSize: "0.875rem" }}>{abs.stagNom}</span>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="badge rounded-2 px-2 py-1"
                            style={{ background: "rgba(99,102,241,0.1)", color: "#4f46e5", fontSize: "0.75rem" }}>
                            {abs.stagFiliere}
                          </span>
                        </td>
                        <td className="text-center body-sm">
                          {abs.date ? new Date(abs.date.slice(0, 10) + "T00:00:00").toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="text-center fw-semibold d-none d-sm-table-cell" style={{ fontSize: "0.875rem" }}>
                          {getHours(abs)}h
                        </td>
                        <td className="text-center pe-4">
                          <span className="badge rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                            style={{
                              background: just ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)",
                              color:      just ? "#059669" : "#e11d48",
                              fontSize:   "0.75rem",
                              fontWeight: 600,
                            }}>
                            <i className={`bi bi-${just ? "check-circle" : "x-circle"}`}></i>
                            {just ? "Justifiée" : "Non just."}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Stats Panel */}
        <div className="col-lg-4 d-flex flex-column gap-4">
          {/* Radial justification rate */}
          <div style={cardStyle} className="p-4">
            <span className="section-title d-block mb-3">Taux de Justification</span>
            <div className="d-flex align-items-center gap-3">
              <div style={{ width: 100, height: 100, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart innerRadius="70%" outerRadius="100%"
                    data={radialData} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: "#f1f5f9" }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div>
                <p className="mb-0 fw-bold" style={{ fontSize: "2rem", letterSpacing: "-0.03em", color: "var(--color-text)" }}>
                  {justifiedPct}%
                </p>
                <p className="body-sm mb-0">des absences justifiées</p>
              </div>
            </div>
          </div>

          {/* Filière mini-bars */}
          {absencesByFiliere.length > 0 && (
            <div style={cardStyle} className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span className="section-title">Filières</span>
                <BarChart3 size={16} color="var(--color-text-muted)" />
              </div>
              <div className="d-flex flex-column gap-3">
                {absencesByFiliere.slice(0, 4).map((fil, i) => (
                  <div key={i}>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="body-sm fw-medium text-truncate" style={{ maxWidth: 140 }}>{fil.fullName}</span>
                      <span className="fw-bold body-sm">{fil.heures}h</span>
                    </div>
                    <div className="rounded-pill overflow-hidden" style={{ height: 6, background: "var(--color-bg)" }}>
                      <div className="rounded-pill"
                        style={{
                          height: "100%",
                          width: `${absencesByFiliere[0]?.heures ? (fil.heures / absencesByFiliere[0].heures) * 100 : 0}%`,
                          background: BAR_COLORS[i % BAR_COLORS.length],
                          transition: "width 0.7s",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gradient summary */}
          <div className="p-4 text-white rounded-3"
            style={{
              background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
              boxShadow: "0 4px 20px rgba(99,102,241,0.3)",
            }}>
            <div className="d-flex align-items-center gap-2 mb-3">
              <i className="bi bi-graph-up-arrow text-white"></i>
              <span className="fw-semibold" style={{ fontSize: "0.875rem", opacity: 0.9 }}>Résumé Rapide</span>
            </div>
            <div className="row g-3">
              {[
                { val: filieres.length,    lbl: "Filières" },
                { val: totalAbsences,      lbl: "Absences" },
                { val: justifiedCount,     lbl: "Justifiées" },
                { val: unjustifiedCount,   lbl: "Non Just." },
              ].map((item, i) => (
                <div key={i} className="col-6">
                  <p className="mb-0 fw-bold" style={{ fontSize: "1.5rem" }}>{item.val}</p>
                  <p className="mb-0" style={{ fontSize: "0.75rem", opacity: 0.6 }}>{item.lbl}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Statistics;
