import { useEffect, useMemo, Fragment } from "react";
import { useSelector, useDispatch } from "react-redux";
import { fetchAttendances } from "../store/absenceSlice.jsx";
import { fetchStagiaires } from "../store/stagiaireSlice.jsx";
import { fetchTimeBlocks } from "../store/sessionSlice.jsx";
import { Users, AlertTriangle, Clock, BarChart3, Award, TrendingUp, Calendar, ShieldAlert } from "lucide-react";
import { SkeletonStatCards, SkeletonTableRows } from "../components/Skeleton.jsx";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
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
    <div className="card-premium p-3 bg-white" style={{ fontSize: "0.8rem", minWidth: 120 }}>
      {label && <p className="fw-semibold mb-1 text-dark">{label}</p>}
      {payload.map((e, i) => (
        <p key={i} className="mb-0" style={{ color: e.color }}>
          {e.name}: <strong>{e.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── SVG Progress Ring ────────────────────────────────────────────────────────
const CircularProgressRing = ({ percentage, color = "#10b981", size = 110, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  return (
    <svg width={size} height={size} className="circular-gauge">
      <circle
        stroke="rgba(0, 0, 0, 0.05)"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        style={{
          transform: "rotate(-90deg)",
          transformOrigin: "50% 50%",
          transition: "stroke-dashoffset 0.6s ease",
        }}
      />
    </svg>
  );
};

// ── component ────────────────────────────────────────────────────────────────
function Statistics({
  activeChoiceView,
  selectedFiliere,
  selectedStagiaire,
  selectedStatus,
  datePreset,
  selectedMonth,
  startDate,
  endDate,
}) {
  const dispatch = useDispatch();
  const { items: absences, loading, error } = useSelector((state) => state.absences);
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const { timeBlocks } = useSelector((state) => state.sessions);

  useEffect(() => {
    if (absences.length === 0 && !loading) dispatch(fetchAttendances());
    if (stagiaires.length === 0) dispatch(fetchStagiaires());
    if (timeBlocks.length === 0) dispatch(fetchTimeBlocks());
  }, [dispatch, absences.length, loading, stagiaires.length, timeBlocks.length]);

  const normalizedAbsences = useMemo(() =>
    absences.map((a) => ({
      ...a,
      date: (a.date ?? a.session?.date_session ?? "").slice(0, 10),
      heures: a.heures ?? 2.5,
      justifie: a.justifie ?? !!a.justification,
    })),
    [absences]
  );

  // ─── Filter logic ─────────────────────────────────────────────────────────
  const filteredAbsences = useMemo(() => {
    let list = normalizedAbsences;

    // 1. Date filter preset
    if (datePreset === "month" && selectedMonth) {
      list = list.filter((a) => a.date.startsWith(selectedMonth));
    } else if (datePreset === "range") {
      if (startDate) {
        list = list.filter((a) => a.date >= startDate);
      }
      if (endDate) {
        list = list.filter((a) => a.date <= endDate);
      }
    }

    // 2. Class/Filiere filter
    if (selectedFiliere) {
      list = list.filter((a) => {
        const stag = stagiaires.find((s) => String(s.id) === String(getStagId(a)));
        if (!stag) return false;
        return getStagiaireClasse(stag) === selectedFiliere;
      });
    }

    // 3. Trainee/Stagiaire filter
    if (selectedStagiaire) {
      list = list.filter((a) => String(getStagId(a)) === String(selectedStagiaire));
    }

    // 4. Absence Status filter
    if (selectedStatus && selectedStatus !== "all") {
      list = list.filter((a) => {
        if (selectedStatus === "justifie") return a.justifie === true && a.status !== "retard" && a.status !== "absence_excusee";
        if (selectedStatus === "unjustified") return a.justifie === false && a.status !== "retard" && a.status !== "absence_excusee";
        if (selectedStatus === "retard") return a.status === "retard";
        if (selectedStatus === "excusee") return a.status === "absence_excusee";
        return true;
      });
    }

    return list;
  }, [normalizedAbsences, datePreset, selectedMonth, startDate, endDate, selectedFiliere, selectedStagiaire, selectedStatus, stagiaires]);

  // ─── Shared computed metrics ─────────────────────────────────────────────
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
      const filAbsArr  = filteredAbsences.filter((a) => filStags.some((s) => String(s.id) === String(getStagId(a))));
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

  // Trend chart
  const trendData = useMemo(() => {
    const acc = {};
    const scopeAbsences = selectedStagiaire ? filteredAbsences : (selectedFiliere ? filteredAbsences : normalizedAbsences);
    
    if (datePreset === "month" && selectedMonth) {
      scopeAbsences.forEach((a) => {
        if (!a.date || !a.date.startsWith(selectedMonth)) return;
        const [, , dd] = a.date.split("-");
        const key = a.date;
        const label = `${dd}/${selectedMonth.split("-")[1]}`;
        if (!acc[key]) acc[key] = { month: label, sortKey: key, justified: 0, unjustified: 0 };
        if (isJustified(a)) acc[key].justified++;
        else acc[key].unjustified++;
      });
    } else {
      scopeAbsences.forEach((a) => {
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
  }, [normalizedAbsences, filteredAbsences, datePreset, selectedMonth, selectedFiliere, selectedStagiaire]);

  // Top trainees with absences
  const topAbsents = useMemo(() =>
    stagiaires
      .map((stag) => {
        const stagAbs = filteredAbsences.filter((a) => String(getStagId(a)) === String(stag.id));
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
        const stag = stagiaires.find((s) => String(s.id) === String(getStagId(abs)));
        return {
          ...abs,
          stagNom:    stag ? getStagName(stag) : abs.stagiaireNom || "Inconnu",
          stagFiliere: stag ? getStagiaireClasse(stag) : abs.stagiaireFiliere || "-",
        };
      }),
    [filteredAbsences, stagiaires]
  );

  // ─── Individual Trainee Computations ──────────────────────────────────────
  const selectedTraineeObj = useMemo(() => {
    if (!selectedStagiaire) return null;
    return stagiaires.find((s) => String(s.id) === String(selectedStagiaire));
  }, [selectedStagiaire, stagiaires]);

  const individualStats = useMemo(() => {
    if (!selectedStagiaire) return null;
    const studentAbs = filteredAbsences.filter((a) => String(getStagId(a)) === String(selectedStagiaire));
    const hoursCount = studentAbs.reduce((sum, a) => sum + getHours(a), 0);
    const justCount  = studentAbs.filter(isJustified).length;
    const unjCount   = studentAbs.length - justCount;
    const retardCount = studentAbs.filter((a) => a.status === "retard").length;
    const excuseCount = studentAbs.filter((a) => a.status === "absence_excusee").length;

    // Assiduity rate formula: assuming standard period is 96 class hours
    const presentRate = Math.max(0, 100 - Math.round((hoursCount / 96) * 100));

    return {
      presentRate,
      hoursCount,
      justCount,
      unjCount,
      retardCount,
      excuseCount,
      totalCount: studentAbs.length,
    };
  }, [selectedStagiaire, filteredAbsences]);

  const individualTimeline = useMemo(() => {
    if (!selectedStagiaire) return [];
    return [...filteredAbsences]
      .filter((a) => String(getStagId(a)) === String(selectedStagiaire))
      .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
      .map((a) => {
        let badgeClass = "unjustified";
        let statusLabel = "Non justifiée";
        let statusBadgeClass = "bg-soft-danger text-danger";

        if (a.status === "justifie" || a.justifie) {
          badgeClass = "justifie";
          statusLabel = "Justifiée";
          statusBadgeClass = "bg-soft-success text-success";
        } else if (a.status === "retard") {
          badgeClass = "retard";
          statusLabel = "Retard";
          statusBadgeClass = "bg-soft-warning text-warning";
        } else if (a.status === "absence_excusee") {
          badgeClass = "excusee";
          statusLabel = "Excusée";
          statusBadgeClass = "bg-soft-info text-info";
        }

        const tb = timeBlocks.find((b) => String(b.id) === String(a.time_block_id));
        const idx = timeBlocks.findIndex((b) => String(b.id) === String(a.time_block_id));
        const sessionSlot = idx !== -1 ? `S${idx + 1}` : (a.session?.time_block?.code || "N/A");
        const sessionTime = tb
          ? `${tb.heure_debut?.slice(0, 5)}–${tb.heure_fin?.slice(0, 5)}`
          : (a.session?.time_block
            ? `${a.session.time_block.heure_debut?.slice(0, 5)}–${a.session.time_block.heure_fin?.slice(0, 5)}`
            : "N/A");

        return {
          ...a,
          badgeClass,
          statusLabel,
          statusBadgeClass,
          sessionSlot,
          sessionTime,
        };
      });
  }, [selectedStagiaire, filteredAbsences, timeBlocks]);

  // ─── Class analytics details ──────────────────────────────────────────────
  const classStudentsRoster = useMemo(() => {
    if (!selectedFiliere) return [];
    const classStags = stagiaires.filter((s) => getStagiaireClasse(s) === selectedFiliere);
    return classStags
      .map((stag) => {
        const stagAbs = filteredAbsences.filter((a) => String(getStagId(a)) === String(stag.id));
        const hours = stagAbs.reduce((sum, a) => sum + getHours(a), 0);
        return {
          ...stag,
          absences: stagAbs.length,
          heures: hours,
          justified: stagAbs.filter(isJustified).length,
          unjustified: stagAbs.length - stagAbs.filter(isJustified).length,
          attendanceRate: Math.max(0, 100 - Math.round((hours / 96) * 100)),
        };
      })
      .sort((a, b) => b.heures - a.heures);
  }, [selectedFiliere, stagiaires, filteredAbsences]);

  const classInterventions = useMemo(() => {
    return classStudentsRoster.filter((s) => s.heures >= 10);
  }, [classStudentsRoster]);

  // ─── KPI Cards config ──────────────────────────────────────────────────────
  const kpiCards = [
    {
      label:    selectedFiliere ? `Stagiaires de ${selectedFiliere}` : "Total Stagiaires",
      value:    selectedFiliere 
                  ? stagiaires.filter((s) => getStagiaireClasse(s) === selectedFiliere).length 
                  : stagiaires.length,
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

  // ─── loading / error states ────────────────────────────────────────────────
  if (loading && absences.length === 0) {
    return (
      <div>
        <SkeletonStatCards count={3} />
        <div className="p-4 mt-4 bg-white border rounded-3">
          <SkeletonTableRows rows={6} cols={5} />
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

  // ─── VIEW RENDERERS ───────────────────────────────────────────────────────

  // Choice 1: Global Overview Renders
  const renderGlobalOverview = () => (
    <>
      {/* Row 2: Area Trend + Pie */}
      <div className="row g-4 mb-4">
        {/* Area Chart */}
        <div className="col-lg-8">
          <div style={cardStyle} className="overflow-hidden h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center justify-content-center rounded-2"
                  style={{ width: 32, height: 32, background: "rgba(99,102,241,0.1)" }}>
                  <TrendingUp size={16} color="#6366f1" />
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
          <div style={cardStyle} className="overflow-hidden h-100 bg-white">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(16,185,129,0.1)" }}>
                <i className="bi bi-check-circle-fill" style={{ color: "#10b981", fontSize: "0.9rem" }}></i>
              </div>
              <span className="section-title">Répartition</span>
            </div>
            <div className="p-3">
              <div style={{ height: 200 }}>
                {totalAbsences === 0 ? (
                  <div className="d-flex align-items-center justify-content-center h-100 text-muted body-sm">
                    Aucune absence
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                        paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              <div className="mt-2 d-flex flex-column gap-2">
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3"
                  style={{ background: "rgba(16,185,129,0.08)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle" style={{ width: 12, height: 12, background: "#10b981", display: "inline-block" }}></span>
                    <span className="body-sm fw-medium">Justifiées</span>
                  </div>
                  <span className="fw-bold animate-fade-in" style={{ color: "#10b981", fontSize: "0.85rem" }}>
                    {justifiedCount} <span className="text-muted fw-normal">({justifiedPct}%)</span>
                  </span>
                </div>
                <div className="d-flex align-items-center justify-content-between p-2 rounded-3"
                  style={{ background: "rgba(244,63,94,0.08)" }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-circle" style={{ width: 12, height: 12, background: "#f43f5e", display: "inline-block" }}></span>
                    <span className="body-sm fw-medium">Non Justifiées</span>
                  </div>
                  <span className="fw-bold animate-fade-in" style={{ color: "#f43f5e", fontSize: "0.85rem" }}>
                    {unjustifiedCount} <span className="text-muted fw-normal">({100 - justifiedPct}%)</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Bar Chart + Top Absents */}
      <div className="row g-4 mb-4">
        {/* Bar Chart */}
        <div className="col-lg-7">
          <div style={cardStyle} className="overflow-hidden h-100 bg-white">
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
          <div style={cardStyle} className="overflow-hidden h-100 bg-white">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(244,63,94,0.1)" }}>
                <Award size={16} color="#f43f5e" />
              </div>
              <span className="section-title">Palmarès des Absences (Top 5)</span>
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
                      <span className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0 fw-bold text-white shadow-sm"
                        style={{
                          width: 30, height: 30, fontSize: "0.75rem",
                          background: index < 3 ? rankGradients[index] : "var(--color-bg)",
                          color: index < 3 ? "#fff" : "var(--color-text-muted)",
                        }}>
                        {index + 1}
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-bold text-truncate" style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>{getStagName(stag)}</span>
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
                                  : "linear-gradient(90deg,#6366f1,#8b5cf6)",
                              transition: "width 0.7s",
                            }}
                          />
                        </div>
                        <div className="d-flex gap-3">
                          <span className="body-sm text-secondary">{stag.totalAbsences} absences</span>
                          <span className="fw-semibold text-danger" style={{ fontSize: "0.78rem" }}>{stag.totalHeures}h</span>
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

      {/* Row 4: Recent Absences */}
      <div className="row g-4 mb-2">
        <div className="col-12">
          <div style={cardStyle} className="overflow-hidden bg-white">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(245,158,11,0.1)" }}>
                <Clock size={16} color="#f59e0b" />
              </div>
              <span className="section-title">Flux d'Absences Récentes</span>
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
                        Aucune absence récente enregistrée
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
                            <span className="fw-semibold text-dark-navy" style={{ fontSize: "0.85rem" }}>{abs.stagNom}</span>
                          </div>
                        </td>
                        <td className="d-none d-md-table-cell">
                          <span className="badge rounded-2 px-2 py-1"
                            style={{ background: "rgba(99,102,241,0.06)", color: "#4f46e5", fontSize: "0.725rem", border: "1px solid rgba(99,102,241,0.15)" }}>
                            {abs.stagFiliere}
                          </span>
                        </td>
                        <td className="text-center body-sm fw-medium text-secondary">
                          {abs.date ? new Date(abs.date.slice(0, 10) + "T00:00:00").toLocaleDateString("fr-FR") : "-"}
                        </td>
                        <td className="text-center fw-semibold text-dark d-none d-sm-table-cell" style={{ fontSize: "0.825rem" }}>
                          {getHours(abs)}h
                        </td>
                        <td className="text-center pe-4">
                          <span className="badge rounded-pill px-3 py-1 d-inline-flex align-items-center gap-1"
                            style={{
                              background: just ? "rgba(16,185,129,0.08)" : "rgba(244,63,94,0.08)",
                              color:      just ? "#059669" : "#e11d48",
                              fontSize:   "0.725rem",
                              fontWeight: 700,
                              border: just ? "1px solid rgba(16,185,129,0.15)" : "1px solid rgba(244,63,94,0.15)",
                            }}>
                            <i className={`bi bi-${just ? "check-circle-fill" : "x-circle-fill"}`}></i>
                            {just ? "Justifiée" : "Non justifiée"}
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
      </div>
    </>
  );

  // Choice 2: Class comparative and deep metrics
  const renderClassAnalytics = () => (
    <>
      <div className="row g-4 mb-4">
        {/* Class roster and metrics */}
        <div className="col-lg-8">
          <div style={cardStyle} className="overflow-hidden h-100 bg-white">
            <div className="d-flex align-items-center justify-content-between px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center gap-2">
                <div className="d-flex align-items-center justify-content-center rounded-2"
                  style={{ width: 32, height: 32, background: "rgba(99,102,241,0.1)" }}>
                  <i className="bi bi-people-fill text-primary" style={{ fontSize: "0.95rem" }}></i>
                </div>
                <span className="section-title">Rapport d'assiduité : {selectedFiliere || "Toutes les filières"}</span>
              </div>
              <span className="badge bg-soft-info text-info border px-3" style={{ fontSize: "0.725rem", fontWeight: 700 }}>
                {classStudentsRoster.length} Stagiaires
              </span>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0 custom-table">
                <thead className="label-caps bg-light" style={{ fontSize: "0.65rem" }}>
                  <tr>
                    <th className="ps-4 py-3">Nom du Stagiaire</th>
                    <th className="py-3 text-center">Taux Présence</th>
                    <th className="py-3 text-center">Absences</th>
                    <th className="py-3 text-center">Heures</th>
                    <th className="py-3 text-center pe-4">Justification</th>
                  </tr>
                </thead>
                <tbody>
                  {classStudentsRoster.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-5 text-muted body-sm">
                        <i className="bi bi-info-circle me-2"></i>Aucun stagiaire trouvé. Sélectionnez une filière.
                      </td>
                    </tr>
                  ) : (
                    classStudentsRoster.map((s) => {
                      const ringColor = s.attendanceRate >= 90 ? "#10b981" : (s.attendanceRate >= 75 ? "#f59e0b" : "#f43f5e");
                      return (
                        <tr key={s.id}>
                          <td className="ps-4">
                            <span className="fw-bold text-dark-navy" style={{ fontSize: "0.85rem" }}>
                              {s.nomComplet || `${s.nom} ${s.prenom}`.trim() || s.nom}
                            </span>
                          </td>
                          <td className="text-center">
                            <div className="d-inline-flex align-items-center gap-2">
                              <CircularProgressRing percentage={s.attendanceRate} color={ringColor} size={28} strokeWidth={3} />
                              <span className="fw-bold text-dark" style={{ fontSize: "0.8rem" }}>{s.attendanceRate}%</span>
                            </div>
                          </td>
                          <td className="text-center fw-medium text-secondary">{s.absences}</td>
                          <td className="text-center fw-bold text-danger" style={{ fontSize: "0.825rem" }}>{s.heures}h</td>
                          <td className="text-center pe-4">
                            <span className="fw-semibold text-success" style={{ fontSize: "0.78rem" }}>{s.justified} just.</span>
                            <span className="mx-1 text-muted">/</span>
                            <span className="fw-semibold text-danger" style={{ fontSize: "0.78rem" }}>{s.unjustified} non-just.</span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Actionable alerts for this class */}
        <div className="col-lg-4">
          <div style={cardStyle} className="overflow-hidden h-100 bg-white">
            <div className="d-flex align-items-center gap-2 px-4 py-3" style={headerStyle}>
              <div className="d-flex align-items-center justify-content-center rounded-2"
                style={{ width: 32, height: 32, background: "rgba(244,63,94,0.1)" }}>
                <ShieldAlert size={16} color="#f43f5e" />
              </div>
              <span className="section-title">Interventions Nécéssaires</span>
            </div>
            <div className="p-3">
              <p className="body-xs text-muted mb-3">
                Stagiaires ayant accumulé plus de <strong>10 heures</strong> d'absences. Une relance ou avertissement est conseillé.
              </p>
              <div className="d-flex flex-column gap-3">
                {classInterventions.length === 0 ? (
                  <div className="text-center py-4 bg-light rounded-3 text-success body-sm fw-medium">
                    <i className="bi bi-patch-check-fill me-2"></i>
                    Aucun cas critique !
                  </div>
                ) : (
                  classInterventions.map((s, idx) => (
                    <div key={s.id} className="d-flex align-items-center gap-3 p-2 rounded-3 border bg-light">
                      <div className="avatar-circle avatar-sm bg-soft-danger text-danger fw-bold">
                        {idx + 1}
                      </div>
                      <div className="flex-grow-1 min-w-0">
                        <p className="fw-bold text-dark-navy mb-0 text-truncate" style={{ fontSize: "0.8rem" }}>
                          {s.nomComplet || `${s.nom} ${s.prenom}`.trim() || s.nom}
                        </p>
                        <span className="body-xs text-danger fw-bold">{s.heures}h cumulées</span>
                      </div>
                      <span className="badge rounded-pill bg-danger px-2 py-1" style={{ fontSize: "0.6rem" }}>CRITIQUE</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  // Choice 3: Individual Stagiaire Assiduity Profile
  const renderStagiaireProfile = () => {
    if (!selectedTraineeObj) {
      return (
        <div className="text-center py-5 bg-white card-premium">
          <i className="bi bi-search d-block mb-3 opacity-25" style={{ fontSize: "3rem" }}></i>
          <h5 className="text-muted">Sélectionnez un stagiaire dans les filtres pour afficher son profil.</h5>
        </div>
      );
    }

    const { presentRate, hoursCount, justCount, unjCount, retardCount, excuseCount, totalCount } = individualStats;
    const ringColor = presentRate >= 90 ? "#10b981" : (presentRate >= 75 ? "#f59e0b" : "#f43f5e");

    return (
      <div className="row g-4">
        {/* Profile Card & present dial */}
        <div className="col-lg-4">
          <div style={cardStyle} className="p-4 bg-white mb-4 text-center">
            <span className="avatar-circle avatar-xl bg-soft-primary text-primary fw-bold mx-auto mb-3" style={{ fontSize: "2rem" }}>
              {getStagName(selectedTraineeObj).charAt(0).toUpperCase()}
            </span>
            <h4 className="fw-bold text-dark-navy mb-1">{getStagName(selectedTraineeObj)}</h4>
            <p className="body-sm text-secondary mb-3">{getStagiaireClasse(selectedTraineeObj)}</p>

            <hr className="my-3 opacity-10" />

            <div className="my-4 d-inline-flex position-relative align-items-center justify-content-center">
              <CircularProgressRing percentage={presentRate} color={ringColor} size={150} strokeWidth={10} />
              <div className="gauge-inner-text">
                <span className="fw-bold d-block text-dark-navy" style={{ fontSize: "2.25rem", letterSpacing: "-0.04em" }}>
                  {presentRate}%
                </span>
                <span className="body-xs text-uppercase text-muted fw-bold">Présent</span>
              </div>
            </div>

            <p className="body-xs text-muted mb-0">
              Taux estimé sur un volume standard de cours de 96 heures.
            </p>
          </div>

          <div style={cardStyle} className="p-4 bg-white">
            <h5 className="section-title mb-3 d-flex align-items-center gap-2">
              <i className="bi bi-sliders text-primary"></i>
              Indicateurs Clés
            </h5>
            <div className="d-flex flex-column gap-3">
              {[
                { lbl: "Absences Total", val: `${totalCount} sessions`, icon: "bi-calendar-event", bg: "rgba(99,102,241,0.08)", color: "#4f46e5" },
                { lbl: "Heures Perdues", val: `${hoursCount} heures`, icon: "bi-clock-fill", bg: "rgba(244,63,94,0.08)", color: "#e11d48" },
                { lbl: "Absences Justifiées", val: `${justCount} validées`, icon: "bi-shield-check", bg: "rgba(16,185,129,0.08)", color: "#059669" },
                { lbl: "Retards Signalés", val: `${retardCount} retards`, icon: "bi-alarm", bg: "rgba(245,158,11,0.08)", color: "#d97706" },
              ].map((item, idx) => (
                <div key={idx} className="d-flex align-items-center justify-content-between p-2 rounded-3" style={{ background: item.bg }}>
                  <div className="d-flex align-items-center gap-2">
                    <span className="rounded-2 d-flex align-items-center justify-content-center" style={{ width: 28, height: 28, background: "#fff", border: "1px solid rgba(0,0,0,0.05)" }}>
                      <i className={`bi ${item.icon}`} style={{ color: item.color, fontSize: "0.85rem" }}></i>
                    </span>
                    <span className="body-sm fw-medium text-dark-navy">{item.lbl}</span>
                  </div>
                  <span className="fw-bold text-dark" style={{ fontSize: "0.825rem" }}>{item.val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Timeline tracking list */}
        <div className="col-lg-8">
          <div style={cardStyle} className="p-4 bg-white h-100">
            <h5 className="section-title mb-4 d-flex align-items-center gap-2">
              <i className="bi bi-clock-history text-primary"></i>
              Chronologie des Absences
            </h5>

            {individualTimeline.length === 0 ? (
              <div className="text-center py-5 bg-light rounded-3 text-muted body-sm">
                <i className="bi bi-calendar-check d-block mb-2 opacity-50" style={{ fontSize: "2rem" }}></i>
                Aucune absence signalée pour ce stagiaire dans la période spécifiée.
              </div>
            ) : (
              <div className="timeline-container animate-fade-in">
                {individualTimeline.map((abs, idx) => (
                  <div key={idx} className="timeline-item">
                    <div className={`timeline-badge ${abs.badgeClass}`}></div>
                    <div className="timeline-content">
                      <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                        <span className="fw-bold text-dark-navy" style={{ fontSize: "0.875rem" }}>
                          {new Date(abs.date + "T00:00:00").toLocaleDateString("fr-FR", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })}
                        </span>
                        <span className={`badge rounded-pill px-3 py-1 ${abs.statusBadgeClass}`} style={{ fontSize: "0.7rem", fontWeight: 700 }}>
                          {abs.statusLabel}
                        </span>
                      </div>
                      <p className="body-sm text-secondary mb-1">
                        <strong>Séance :</strong> {abs.sessionSlot} ({abs.sessionTime}) &bull; <strong>Heures :</strong> {getHours(abs)}h
                      </p>
                      {abs.justification && (
                        <p className="body-sm text-success mb-1">
                          <i className="bi bi-file-earmark-check-fill me-1"></i>
                          <strong>Justification :</strong> {abs.justification}
                        </p>
                      )}
                      {abs.motif && (
                        <p className="body-sm text-muted mb-0" style={{ fontSize: "0.78rem" }}>
                          <i className="bi bi-chat-left-dots-fill me-1 opacity-50"></i>
                          <strong>Motif :</strong> "{abs.motif}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* ── KPI Cards ── */}
      <div className="row g-4 mb-4 page-main-header">
        {kpiCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="col-12 col-sm-6 col-lg-4">
              <div style={{ ...cardStyle, transition: "box-shadow 0.2s, transform 0.2s" }}
                className="p-4 hover-lift bg-white">
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
                <p className="mb-1 animate-fade-in" style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.03em", lineHeight: 1, color: "var(--color-text)" }}>
                  {c.value}
                </p>
                <p className="body-sm mb-0">{c.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Choice Conditional Viewport ── */}
      <div className="animate-fade-in">
        {activeChoiceView === "ensemble" && renderGlobalOverview()}
        {activeChoiceView === "filiere" && renderClassAnalytics()}
        {activeChoiceView === "stagiaire" && renderStagiaireProfile()}
      </div>
    </div>
  );
}

export default Statistics;
