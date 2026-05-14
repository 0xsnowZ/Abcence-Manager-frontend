import { useState, useRef, useEffect } from "react";
import Statistics from "../components/Statistics.jsx";

const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

const currentMonthKey = (() => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
})();

const monthLabel = (key) => {
  if (!key) return "Toutes les dates";
  const [y, m] = key.split("-").map(Number);
  return `${MONTH_NAMES[m - 1]} ${y}`;
};

function StatisticsPage() {
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [showPicker, setShowPicker]       = useState(false);
  const pickerRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target))
        setShowPicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="container-xxl px-4 py-5">

      {/* ── Page header ── */}
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="stats-page-icon">
              <i className="bi bi-graph-up-arrow"></i>
            </div>
            <h1 className="page-title mb-0">Statistiques</h1>
          </div>
          <p className="body-sm mb-0">Vue globale de l'activité commerciale et de l'assiduité.</p>
        </div>

        {/* Month picker */}
        <div className="position-relative" ref={pickerRef}>
          <button
            className="d-flex align-items-center gap-2 px-3 py-2 rounded-3 border"
            style={{
              background: "rgba(99,102,241,0.08)",
              borderColor: "#6366f1",
              color: "#4f46e5",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onClick={() => setShowPicker((v) => !v)}
          >
            <i className="bi bi-calendar3"></i>
            {monthLabel(selectedMonth)}
            {selectedMonth && (
              <span
                onClick={(e) => { e.stopPropagation(); setSelectedMonth(null); }}
                style={{ marginLeft: 4, opacity: 0.6, fontWeight: 700, lineHeight: 1 }}
                title="Voir toutes les dates"
              >×</span>
            )}
            <i className={`bi bi-chevron-${showPicker ? "up" : "down"} ms-1`} style={{ fontSize: "0.7rem" }}></i>
          </button>

          {showPicker && (
            <div className="position-absolute end-0 mt-2 bg-white border rounded-3 shadow-lg p-3"
              style={{ zIndex: 1050, minWidth: 220 }}>
              <p className="label-caps pb-2 mb-2" style={{ borderBottom: "1px solid var(--color-border)" }}>
                Choisir le mois
              </p>
              <input
                type="month"
                className="form-control form-control-sm border-0 px-0"
                style={{ boxShadow: "none", fontSize: "0.875rem" }}
                value={selectedMonth || ""}
                onChange={(e) => { setSelectedMonth(e.target.value || null); setShowPicker(false); }}
              />
              <button
                className="btn btn-sm w-100 mt-2"
                style={{ color: "#ef4444", fontSize: "0.8rem", background: "rgba(239,68,68,0.06)", border: "none" }}
                onClick={() => { setSelectedMonth(null); setShowPicker(false); }}
              >
                <i className="bi bi-x-circle me-1"></i>Toutes les dates
              </button>
            </div>
          )}
        </div>
      </div>

      <Statistics selectedMonth={selectedMonth} />

    </div>
  );
}

export default StatisticsPage;
