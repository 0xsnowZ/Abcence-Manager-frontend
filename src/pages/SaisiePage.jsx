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
import AbsenceDetailModal from "../components/AbsenceDetailModal.jsx";

function SaisiePage() {
  const showToast = useToast();
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const allAbsences = useSelector((state) => state.absences.items);
  const absencesLoading = useSelector((state) => state.absences.loading);
  const { user } = useSelector((state) => state.auth);
  const { items: programmes } = useSelector((state) => state.programmes);
  const { timeBlocks } = useSelector((state) => state.sessions);

  const [detailAbsence, setDetailAbsence] = useState(null);

  useEffect(() => {
    dispatch(fetchTimeBlocks());
    dispatch(fetchProgrammes());
    if (allAbsences.length === 0 && !absencesLoading) dispatch(fetchAttendances());
    if (stagiaires.length === 0) dispatch(fetchStagiaires());
  }, [dispatch]);

  const slots = useMemo(() => {
    if (timeBlocks && timeBlocks.length > 0) {
      return timeBlocks.map((tb, idx) => ({
        id: idx + 1,
        timeBlockId: tb.id,
        label: `${tb.heure_debut?.slice(0, 5) || ""}–${tb.heure_fin?.slice(0, 5) || ""}`,
        short: `S${idx + 1}`,
        code: tb.code,
      }));
    }
    return [
      { id: 1, timeBlockId: null, label: "08:30–11:00", short: "S1", code: "TB1" },
      { id: 2, timeBlockId: null, label: "11:00–13:30", short: "S2", code: "TB2" },
      { id: 3, timeBlockId: null, label: "13:30–16:00", short: "S3", code: "TB3" },
      { id: 4, timeBlockId: null, label: "16:00–18:30", short: "S4", code: "TB4" },
    ];
  }, [timeBlocks]);

  const isProf = user?.role === "prof";
  const profProgrammeIds = useMemo(() => {
    if (!isProf) return [];
    return (user?.programmes || []).map((p) => p.id);
  }, [isProf, user]);

  const getDefaultRange = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (window.innerWidth <= 767) return [today, today];
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
  const [saisieData, setSaisieData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableProgrammes = useMemo(() => {
    let list = programmes;
    if (profProgrammeIds.length > 0) {
      list = programmes.filter((p) => profProgrammeIds.includes(p.id));
    }
    return [...list].sort((a, b) => (a.code_diplome || "").localeCompare(b.code_diplome || "fr"));
  }, [programmes, profProgrammeIds]);

  useEffect(() => {
    if (availableProgrammes.length === 1 && !selectedProgrammeId) {
      setSelectedProgrammeId(String(availableProgrammes[0].id));
    }
  }, [availableProgrammes, selectedProgrammeId]);

  const selectedProgramme = useMemo(
    () => programmes.find((p) => String(p.id) === String(selectedProgrammeId)) || null,
    [programmes, selectedProgrammeId],
  );

  const filteredStagiaires = useMemo(() => {
    if (!selectedProgramme) return [];
    return stagiaires
      .filter((s) =>
        (s.programmes || []).some((p) => p.id === selectedProgramme.id),
      )
      .sort((a, b) =>
        (a.nom || "").localeCompare(b.nom || "", "fr", { sensitivity: "base" }) ||
        (a.prenom || "").localeCompare(b.prenom || "", "fr", { sensitivity: "base" })
      );
  }, [stagiaires, selectedProgramme]);

  // Store absence object per cell, not just boolean
  const reduxAbsencesMap = useMemo(() => {
    const map = {};
    allAbsences.forEach((a) => {
      const dateStr = (a.date || "").slice(0, 10);
      const stagId = a.idstag || a.stagiaire_id;
      const tbId = a.time_block_id;
      const slotIdx = slots.findIndex((s) => s.timeBlockId === tbId);
      if (slotIdx !== -1) {
        map[`${stagId}|${dateStr}|${slotIdx + 1}`] = a;
      }
    });
    return map;
  }, [allAbsences, slots]);

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

  const handleCellClick = (stagId, dateStr, slotId) => {
    const key = `${stagId}|${dateStr}|${slotId}`;
    const existing = reduxAbsencesMap[key];
    if (existing) {
      setDetailAbsence(existing);
      return;
    }
    // Toggle new absence selection
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

      const checkedEntries = Object.entries(saisieData).filter(([, v]) => v);
      if (checkedEntries.length === 0) {
        showToast("Aucune nouvelle absence à enregistrer.", "warning");
        return;
      }

      setIsSubmitting(true);

      try {
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

          const session = await dispatch(
            findOrCreateSession({
              programme_id: selectedProgramme.id,
              date_session: dateStr,
              time_block_id: slot.timeBlockId,
              created_by: user?.id || null,
            }),
          ).unwrap();

          const attendances = stagIds.map((stagId) => ({
            stagiaire_id: stagId,
            type_absence_id: 2,
            justification: null,
          }));

          await dispatch(
            bulkSubmitAttendances({ session_id: session.id, attendances }),
          ).unwrap();

          totalAdded += stagIds.length;
        }

        // No fetchAttendances() needed — bulkSubmitAttendances.fulfilled reducer
        // upserts items into the Redux store immediately
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
    [saisieData, dateColumns, selectedProgramme, slots, dispatch, user],
  );

  const lockedProgramme = availableProgrammes.length === 1 ? availableProgrammes[0] : null;

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
              <div className="card-header py-3 px-4">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 saisie-grid-header">
                  <h5 className="mb-0 section-title d-flex align-items-center gap-2">
                    <span className="avatar-circle avatar-md avatar-navy">
                      <i className="bi bi-people-fill" style={{ fontSize: "0.9rem" }}></i>
                    </span>
                    {selectedProgramme.code_diplome}
                    {selectedProgramme.libelle && (
                      <span className="body-sm fw-normal d-none d-sm-inline">— {selectedProgramme.libelle}</span>
                    )}
                  </h5>
                  <div className="d-flex gap-2 gap-sm-4">
                    {slots.map((s) => (
                      <div key={s.id} className="text-center">
                        <div className="fw-bold text-dark-navy small">{s.short}</div>
                        <div className="text-muted saisie-slot-time">
                          <span className="saisie-slot-time-full">{s.label}</span>
                          <span className="saisie-slot-time-compact">
                            <span>{s.label.split(/–|-/)[0]}</span>
                            <span className="saisie-slot-time-arrow">↓</span>
                            <span>{s.label.split(/–|-/)[1]}</span>
                          </span>
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
                      <th rowSpan="2" className="ps-4 border-bottom-0 sticky-col" style={{ width: "180px", zIndex: 10 }}>
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
                          <div className="text-uppercase text-muted lh-1 mb-1" style={{ fontSize: "0.6rem" }}>
                            {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                          </div>
                          <div className="fw-bold text-dark">{formatHeaderDate(d)}</div>
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
                        `${stagiaire.nom || ""} ${stagiaire.prenom || ""}`.trim() ||
                        stagiaire.nom || "—";
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
                                  const absenceData = reduxAbsencesMap[key];
                                  const isSubmitted = !!absenceData;
                                  const isChecked = isNew || isSubmitted;

                                  let cellClass = `text-center p-0 cell-slot${sIdx === 0 ? " date-group-start" : ""}`;

                                  return (
                                    <td
                                      key={s.id}
                                      className={cellClass}
                                      onClick={() => handleCellClick(stagiaire.id, dateStr, s.id)}
                                      style={{ height: "48px" }}
                                      title={isSubmitted ? "Cliquer pour voir les détails" : ""}
                                    >
                                      {isNew ? (
                                        <span className="abs-badge abs-badge--new">A</span>
                                      ) : isSubmitted ? (
                                        <span className={`abs-badge ${absenceData.status === "justifie" ? "abs-badge--justified" : "abs-badge--unjustified"}`}>A</span>
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
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
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
                  Chaque séance sélectionnée "A" sera enregistrée comme une absence de 2h30.
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

      {detailAbsence && (
        <AbsenceDetailModal
          absence={detailAbsence}
          onClose={() => setDetailAbsence(null)}
        />
      )}
    </div>
  );
}

export default SaisiePage;
