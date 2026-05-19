import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useToast } from "../components/ToastProvider.jsx";
import { useDispatch, useSelector } from "react-redux";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  fetchTimeBlocks,
  findOrCreateSession,
} from "../store/sessionSlice.jsx";
import { fetchProgrammes } from "../store/programmeSlice.jsx";
import { fetchStagiaires } from "../store/stagiaireSlice.jsx";
import {
  bulkSubmitAttendances,
  fetchAttendances,
} from "../store/absenceSlice.jsx";
import api from "../services/api.js";

// Saisie Page
function SaisiePage() {
  const showToast = useToast();
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const lastFetched = useSelector((state) => state.stagiaires.lastFetched);
  const allAbsences = useSelector((state) => state.absences.items);
  const { user } = useSelector((state) => state.auth);
  const { items: programmes } = useSelector((state) => state.programmes);
  const { timeBlocks } = useSelector((state) => state.sessions);

  // BUG-04: Store ABSENT type_absence id resolved from backend
  const [absentTypeId, setAbsentTypeId] = useState(null);

  // Load time blocks, programmes, stagiaires and existing attendances on mount
  useEffect(() => {
    dispatch(fetchTimeBlocks());
    dispatch(fetchProgrammes());
    // BUG-03: Only load absences for the current view — initial load without filter is fine,
    //         but we skip the redundant re-fetch after submit (handled by Redux merge).
    dispatch(fetchAttendances());
    // PERF-01: Skip re-fetch if data was loaded within the last 5 minutes
    const fiveMinutes = 5 * 60 * 1000;
    if (!lastFetched || Date.now() - lastFetched > fiveMinutes) {
      dispatch(fetchStagiaires());
    }
    // BUG-04: Resolve the 'ABSENT' type_absence id dynamically
    api.get("/type-absences").then((res) => {
      const types = res.data?.data || [];
      const absentType = types.find((t) => t.code === "ABSENT");
      if (absentType) setAbsentTypeId(absentType.id);
    }).catch(() => {
      // Silently fall back — will show error on submit if still null
    });
  }, [dispatch]);

  // Build slots from timeBlocks (TB1→S1, TB2→S2, …) or fall back to static
  const slots = useMemo(() => {
    if (timeBlocks && timeBlocks.length > 0) {
      return timeBlocks.map((tb, idx) => ({
        id: idx + 1, // 1-based UI slot id
        timeBlockId: tb.id, // backend id
        label: `${tb.heure_debut?.slice(0, 5) || ""}–${tb.heure_fin?.slice(0, 5) || ""}`,
        short: `S${idx + 1}`,
        code: tb.code, // e.g. "TB1"
      }));
    }
    // Static fallback while loading
    return [
      {
        id: 1,
        timeBlockId: null,
        label: "08:30–11:00",
        short: "S1",
        code: "TB1",
      },
      {
        id: 2,
        timeBlockId: null,
        label: "11:00–13:30",
        short: "S2",
        code: "TB2",
      },
      {
        id: 3,
        timeBlockId: null,
        label: "13:30–16:00",
        short: "S3",
        code: "TB3",
      },
      {
        id: 4,
        timeBlockId: null,
        label: "16:00–18:30",
        short: "S4",
        code: "TB4",
      },
    ];
  }, [timeBlocks]);

  const isProf = user?.role === "prof";
  // Filières assigned to this prof (from their programmes)
  const profProgrammeIds = useMemo(() => {
    if (!isProf) return [];
    return (user?.programmes || []).map((p) => p.id);
  }, [isProf, user]);

  const getDefaultRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (window.innerWidth <= 767) {
      return [today, today];
    }
    const day = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    return [monday, saturday];
  };
  const [dateRange, setDateRange] = useState(getDefaultRange);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [classeSearch, setClasseSearch] = useState("");
  const [classeDropdownOpen, setClasseDropdownOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // saisieData: { [`${stagId}|${dateStr}|${slotIdx}`]: boolean }
  const [saisieData, setSaisieData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered programmes list (restrict for profs)
  const availableProgrammes = useMemo(() => {
    if (profProgrammeIds.length > 0) {
      return programmes.filter((p) => profProgrammeIds.includes(p.id));
    }
    return programmes;
  }, [programmes, profProgrammeIds]);

  // Auto-select if only one programme available
  useEffect(() => {
    if (availableProgrammes.length === 1 && !selectedProgrammeId) {
      setSelectedProgrammeId(String(availableProgrammes[0].id));
    }
  }, [availableProgrammes, selectedProgrammeId]);

  const selectedProgramme = useMemo(
    () =>
      programmes.find((p) => String(p.id) === String(selectedProgrammeId)) ||
      null,
    [programmes, selectedProgrammeId],
  );

  // Stagiaires for the selected programme
  const filteredStagiaires = useMemo(() => {
    if (!selectedProgramme) return [];
    return stagiaires.filter((s) =>
      (s.programmes || []).some((p) => p.id === selectedProgramme.id),
    );
  }, [stagiaires, selectedProgramme]);

  // Build a map of already-submitted absences for the grid
  // BUG-07: Scope to the current programme's stagiaires to prevent cross-programme false positives
  const reduxAbsencesMap = useMemo(() => {
    const map = {};
    if (!selectedProgramme || filteredStagiaires.length === 0) return map;

    const stagiaireIds = new Set(filteredStagiaires.map((s) => s.id));

    allAbsences.forEach((a) => {
      const stagId = a.idstag || a.stagiaire_id;
      if (!stagiaireIds.has(stagId)) return; // ignore other programmes
      const dateStr = (a.date || "").slice(0, 10);
      const tbId = a.time_block_id;
      const slotIdx = slots.findIndex((s) => s.timeBlockId === tbId);
      if (slotIdx !== -1) {
        map[`${stagId}|${dateStr}|${slotIdx + 1}`] = a;
      }
    });
    return map;
  }, [allAbsences, slots, filteredStagiaires, selectedProgramme]);

  // Calculate dates between start and end
  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    if (!startDate || !endDate) return dates;
    let current = new Date(startDate.getTime());
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate.getTime());
    end.setHours(0, 0, 0, 0);
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const dateColumns = useMemo(() => {
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      return getDatesInRange(dateRange[0], dateRange[1]);
    }
    return [];
  }, [dateRange]);

  const handleSaisieChange = (stagId, dateStr, slotId) => {
    const key = `${stagId}|${dateStr}|${slotId}`;
    if (reduxAbsencesMap[key]) return; // already submitted
    setSaisieData((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const formatHeaderDate = (d) =>
    d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });

  const formatStoreDate = (d) => {
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60 * 1000);
    return local.toISOString().split("T")[0];
  };

  const handleReset = () => {
    setSaisieData({});
    setSelectedProgrammeId("");
    setDateRange(getDefaultRange());
  };

  // Warn user before leaving with unsaved attendance data
  useEffect(() => {
    const hasUnsaved = Object.values(saisieData).some(Boolean);
    if (!hasUnsaved) return;
    const handler = (e) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [saisieData]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!dateColumns.length || !selectedProgramme) return;

      // BUG-04: Ensure ABSENT type id is resolved before submitting
      if (!absentTypeId) {
        showToast("Impossible de résoudre le type d'absence. Veuillez recharger la page.", "error");
        return;
      }

      // Collect checked cells: { `stagId|dateStr|slotIdx` }
      const checkedEntries = Object.entries(saisieData).filter(([, v]) => v);
      if (checkedEntries.length === 0) {
        showToast("Aucune nouvelle absence à enregistrer.", "warning");
        return;
      }

      setIsSubmitting(true);

      try {
        // Group by (date, slotIdx) → need one session per (programme, date, time_block)
        // Then group by session → list of stagiaire_ids
        const byDateSlot = {};
        checkedEntries.forEach(([key]) => {
          const [stagId, dateStr, slotIdx] = key.split("|");
          const dsKey = `${dateStr}|${slotIdx}`;
          if (!byDateSlot[dsKey]) byDateSlot[dsKey] = [];
          byDateSlot[dsKey].push(parseInt(stagId));
        });

        let totalAdded = 0;

        for (const [dsKey, stagIds] of Object.entries(byDateSlot)) {
          const [dateStr, slotIdx] = dsKey.split("|");
          const slot = slots[parseInt(slotIdx) - 1];
          if (!slot || !slot.timeBlockId) {
            showToast("Créneau invalide, veuillez recharger la page.", "warning");
            continue;
          }

          // BUG-01: Single atomic call instead of GET-then-POST
          const session = await dispatch(
            findOrCreateSession({
              programme_id: selectedProgramme.id,
              date_session: dateStr,
              time_block_id: slot.timeBlockId,
              created_by: user?.id || null,
            }),
          ).unwrap();

          // BUG-04: Use dynamically resolved ABSENT type id
          const attendances = stagIds.map((stagId) => ({
            stagiaire_id: stagId,
            type_absence_id: absentTypeId,
            justification: null,
          }));

          await dispatch(
            bulkSubmitAttendances({ session_id: session.id, attendances }),
          ).unwrap();

          totalAdded += stagIds.length;
        }

        // BUG-03: Do NOT re-fetch all 500 absences — the Redux store is already
        // updated by bulkSubmitAttendances.fulfilled via the normalizeAttendance merge.

        showToast(`${totalAdded} absence(s) enregistrée(s) avec succès.`, "success");
        setSaisieData({});
      } catch (err) {
        showToast(
          typeof err === "string" ? err : err?.message || "Une erreur est survenue lors de la soumission.",
          "error",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [saisieData, dateColumns, selectedProgramme, slots, dispatch, user, absentTypeId],
  );

  const lockedProgramme =
    availableProgrammes.length === 1 ? availableProgrammes[0] : null;

  return (
    <div className="container-xxl px-4 py-5">
      <div className="d-flex align-items-start gap-3 mb-5">
        <div className="saisie-page-icon">
          <i className="bi bi-person-badge"></i>
        </div>
        <div>
          <h1 className="page-title mb-1">Registre de Présence</h1>
          <p className="body-sm mb-0">
            Saisie par séances (S1–S4) de 2h30 chacune. Cliquez sur une case pour marquer une absence.
          </p>
        </div>
      </div>

      <div className="card-premium mb-4" style={{ position: "relative", zIndex: 30 }}>
        <div className="card-header py-3 px-4" style={{ background: "var(--color-primary)" }}>
          <h6 className="mb-0 label-caps text-white d-flex align-items-center gap-2">
            <i className="bi bi-gear-fill"></i>Configuration du Registre
          </h6>
        </div>
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">

            {/* Classe / Filière */}
            <div className="col-12 col-sm-6 col-lg">
              <label className="form-label label-caps mb-1">Classe / Filière</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className={`bi ${lockedProgramme ? "bi-lock-fill text-warning" : "bi-mortarboard-fill text-dark-navy"}`}></i>
                </span>
                <div className="position-relative flex-grow-1">
                  <input
                    type="text"
                    className="form-control form-control-sm border-start-0 rounded-start-0 bg-light"
                    placeholder="Sélectionner une classe..."
                    value={
                      classeDropdownOpen
                        ? classeSearch
                        : selectedProgramme
                        ? `${selectedProgramme.code_diplome}${selectedProgramme.libelle ? ` — ${selectedProgramme.libelle}` : ""}`
                        : ""
                    }
                    onChange={(e) => {
                      setClasseSearch(e.target.value);
                      setClasseDropdownOpen(true);
                      if (!e.target.value) { setSelectedProgrammeId(""); setSaisieData({}); }
                    }}
                    onFocus={() => { setClasseSearch(""); setClasseDropdownOpen(true); }}
                    onBlur={() => setTimeout(() => setClasseDropdownOpen(false), 150)}
                    disabled={!!lockedProgramme}
                    autoComplete="off"
                  />
                  {classeDropdownOpen && (
                    <ul className="classe-dropdown list-unstyled mb-0 position-absolute w-100 bg-white border rounded shadow" style={{ top: "100%", zIndex: 1050, maxHeight: "220px", overflowY: "auto" }}>
                      {availableProgrammes
                        .filter((p) => {
                          const q = classeSearch.toLowerCase();
                          return p.code_diplome.toLowerCase().includes(q) || (p.libelle || "").toLowerCase().includes(q);
                        })
                        .map((p) => (
                          <li
                            key={p.id}
                            className="classe-dropdown-item px-3 py-2"
                            style={{ cursor: "pointer", fontSize: "0.9rem" }}
                            onMouseDown={() => { setSelectedProgrammeId(String(p.id)); setClasseSearch(""); setClasseDropdownOpen(false); setSaisieData({}); }}
                          >
                            <span className="fw-bold">{p.code_diplome}</span>
                            {p.libelle && <span className="text-muted ms-2" style={{ fontSize: "0.8rem" }}>— {p.libelle}</span>}
                          </li>
                        ))}
                      {availableProgrammes.filter((p) => {
                        const q = classeSearch.toLowerCase();
                        return p.code_diplome.toLowerCase().includes(q) || (p.libelle || "").toLowerCase().includes(q);
                      }).length === 0 && (
                        <li className="px-3 py-2 text-muted" style={{ fontSize: "0.85rem" }}>Aucune classe trouvée</li>
                      )}
                    </ul>
                  )}
                </div>
              </div>
              {lockedProgramme && (
                <small className="text-muted d-block mt-1" style={{ fontSize: "0.72rem" }}>
                  <i className="bi bi-info-circle me-1"></i>Filière assignée par l'administrateur
                </small>
              )}
            </div>

            {/* Période d'appel */}
            <div className="col-12 col-sm-6 col-lg position-relative">
              <label className="form-label label-caps mb-1">Période d'appel</label>
              <button
                className="btn btn-white border bg-light btn-sm w-100 d-flex justify-content-between align-items-center shadow-none text-start py-2"
                onClick={() => setShowCalendar(!showCalendar)}
                type="button"
                style={{ fontSize: "0.85rem" }}
              >
                <span className="text-dark text-truncate">
                  <i className="bi bi-calendar-range me-2 text-dark-navy"></i>
                  {dateRange?.[0] ? dateRange[0].toLocaleDateString("fr-FR") : "Début"}
                  <span className="mx-1 text-muted">➟</span>
                  {dateRange?.[1] ? dateRange[1].toLocaleDateString("fr-FR") : "Fin"}
                </span>
                <i className={`bi bi-chevron-${showCalendar ? "up" : "down"} text-muted ms-2`}></i>
              </button>
              {showCalendar && (
                <div
                  className="position-absolute start-0 mt-2 bg-white p-3 border rounded shadow-lg date-picker-dropdown"
                  style={{ minWidth: "350px", zIndex: 1050 }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="fw-bold small text-muted" style={{ fontSize: "0.7rem" }}>CHOISIR LA PLAGE</span>
                    <button className="btn-close btn-sm" onClick={() => setShowCalendar(false)}></button>
                  </div>
                  <Calendar
                    onChange={(val) => { setDateRange(val); if (val && val.length === 2 && val[0] && val[1]) setShowCalendar(false); }}
                    selectRange={true}
                    value={dateRange}
                    className="border-0 w-100 x-small-calendar"
                  />
                </div>
              )}
            </div>

            {/* Reset */}
            <div className="col-12 col-sm-auto">
              <button className="btn btn-outline-secondary btn-sm fw-bold px-3" type="button" onClick={handleReset}>
                <i className="bi bi-x-lg me-1"></i>Réinitialiser
              </button>
            </div>

          </div>
        </div>
      </div>


      {dateColumns.length > 0 && selectedProgramme ? (
        filteredStagiaires.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <div className="card-premium overflow-hidden">
              <div className="card-header py-4 px-4">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 section-title d-flex align-items-center gap-3">
                    <span className="avatar-circle avatar-md avatar-navy">
                      <i className="bi bi-people-fill" style={{ fontSize: "0.9rem" }}></i>
                    </span>
                    {selectedProgramme.code_diplome}
                    {selectedProgramme.libelle && (
                      <span className="body-sm fw-normal">— {selectedProgramme.libelle}</span>
                    )}
                  </h5>
                  <div className="d-flex gap-4">
                    {slots.map((s) => (
                      <div key={s.id} className="text-center">
                        <div className="fw-bold text-dark-navy small">
                          {s.short}
                        </div>
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.65rem" }}
                        >
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="table-responsive scroll-thin" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                <table className="table table-sm mb-0 align-middle professional-grid">
                  <thead style={{ position: "sticky", top: 0, zIndex: 20, boxShadow: "inset 0 2px 0 var(--color-border), 0 2px 0 var(--color-border-strong)" }}>
                    <tr style={{ background: "var(--color-bg)" }}>
                      <th
                        rowSpan="2"
                        className="ps-4 border-bottom-0 sticky-col"
                        style={{ width: "240px", zIndex: 10 }}
                      >
                        NOM DU STAGIAIRE
                      </th>
                      {dateColumns.map((d, index) => (
                        <th
                          key={index}
                          colSpan={slots.length}
                          className="text-center py-2 border-bottom-0 date-group-start"
                          style={{
                            minWidth: `${slots.length * 40}px`,
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <div
                            className="text-uppercase text-muted lh-1 mb-1"
                            style={{ fontSize: "0.6rem" }}
                          >
                            {d.toLocaleDateString("fr-FR", {
                              weekday: "short",
                            })}
                          </div>
                          <div className="fw-bold text-dark">
                            {formatHeaderDate(d)}
                          </div>
                        </th>
                      ))}
                    </tr>
                    <tr className="bg-light text-muted">
                      {dateColumns.map((_, dIdx) => (
                        <React.Fragment key={dIdx}>
                          {slots.map((s, sIdx) => (
                            <th
                              key={s.id}
                              className={`text-center py-1 border-top-0${sIdx === 0 ? " date-group-start" : ""}`}
                              style={{ width: "40px", fontSize: "0.6rem", lineHeight: 1.2 }}
                            >
                              <div className="fw-bold text-dark-navy">{s.short}</div>
                            </th>
                          ))}
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStagiaires.map((stagiaire) => {
                      const displayName =
                        stagiaire.nomComplet ||
                        `${stagiaire.prenom || ""} ${stagiaire.nom || ""}`.trim() ||
                        stagiaire.nom ||
                        "—";
                      return (
                        <tr key={stagiaire.id} className="hover-row">
                          <td className="ps-4 fw-bold text-dark border-end-heavy sticky-col bg-white">
                            {displayName}
                          </td>
                          {dateColumns.map((d, dIdx) => {
                            const dateStr = formatStoreDate(d);
                            return (
                              <React.Fragment key={dIdx}>
                                {slots.map((s, sIdx) => {
                                  const key = `${stagiaire.id}|${dateStr}|${s.id}`;
                                  const isNew = !!saisieData[key];
                                  const isSubmitted = !!reduxAbsencesMap[key];
                                  const isChecked = isNew || isSubmitted;

                                  return (
                                    <td
                                      key={s.id}
                                      className={`text-center p-0 cell-slot${sIdx === 0 ? " date-group-start" : ""} ${isNew ? "is-absent" : ""} ${isSubmitted ? "is-submitted" : ""}`}
                                      onClick={() =>
                                        handleSaisieChange(
                                          stagiaire.id,
                                          dateStr,
                                          s.id,
                                        )
                                      }
                                      style={{ height: "48px" }}
                                    >
                                      {isChecked ? (
                                        <span className="text-white fw-bold">
                                          A
                                        </span>
                                      ) : (
                                        <span className="dot-marker"></span>
                                      )}
                                    </td>
                                  );
                                })}
                              </React.Fragment>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="card-footer p-4 text-center">
                <button
                  type="submit"
                  className="btn-navy px-5 py-3"
                  style={{ fontSize: "0.95rem", borderRadius: "var(--radius-pill)" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                        aria-hidden="true"
                      ></span>
                      Enregistrement…
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check2-all me-2"></i>
                      VALIDER LE RÉGISTRE D'APPEL
                    </>
                  )}
                </button>
                <div className="mt-3 text-secondary small">
                  <i className="bi bi-info-circle-fill me-1"></i>
                  Chaque séance sélectionnée "A" sera enregistrée comme une
                  absence de 2h30.
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="card-premium text-center py-5 px-4">
            <i className="bi bi-people opacity-25" style={{ fontSize: "4rem", color: "var(--color-text-muted)" }}></i>
            <div className="section-title mt-3 mb-1">Aucun stagiaire trouvé</div>
            <p className="body-sm mb-0">Ajoutez des stagiaires dans la page Stagiaires d'abord.</p>
          </div>
        )
      ) : (
        <div className="card-premium text-center py-5 px-4" style={{ borderStyle: "dashed" }}>
          <i className="bi bi-layout-three-columns opacity-25" style={{ fontSize: "5rem", color: "var(--color-primary)" }}></i>
          <div className="section-title mt-3 mb-1">Registre d'Appel Prêt</div>
          <p className="body-sm mb-0">
            Sélectionnez une filière et une période pour charger la grille de saisie professionnelle.
          </p>
        </div>
      )}

    </div>
  );
}

export default SaisiePage;
