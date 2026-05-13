import React, { useState, useMemo, useEffect, useCallback } from "react";
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

// Saisie Page
function SaisiePage() {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const allAbsences = useSelector((state) => state.absences.items);
  const { user } = useSelector((state) => state.auth);
  const { items: programmes } = useSelector((state) => state.programmes);
  const { timeBlocks } = useSelector((state) => state.sessions);

  // Load time blocks, programmes, stagiaires and existing attendances on mount
  useEffect(() => {
    dispatch(fetchTimeBlocks());
    dispatch(fetchProgrammes());
    dispatch(fetchAttendances());
    if (stagiaires.length === 0) dispatch(fetchStagiaires());
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

  // Date range: default = current week Monday–Saturday
  const getCurrentWeek = () => {
    const today = new Date();
    const day = today.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
    const monday = new Date(today);
    monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);
    saturday.setHours(0, 0, 0, 0);
    return [monday, saturday];
  };
  const [dateRange, setDateRange] = useState(getCurrentWeek);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState("");
  const [classeSearch, setClasseSearch] = useState("");
  const [classeDropdownOpen, setClasseDropdownOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // saisieData: { [`${stagId}|${dateStr}|${slotIdx}`]: boolean }
  const [saisieData, setSaisieData] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [submitError, setSubmitError] = useState("");
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
  const reduxAbsencesMap = useMemo(() => {
    const map = {};
    allAbsences.forEach((a) => {
      const dateStr = (a.date || "").slice(0, 10);
      const stagId = a.idstag || a.stagiaire_id;
      const tbId = a.time_block_id;
      // Map time_block_id → slot index
      const slotIdx = slots.findIndex((s) => s.timeBlockId === tbId);
      if (slotIdx !== -1) {
        map[`${stagId}|${dateStr}|${slotIdx + 1}`] = true;
      }
    });
    return map;
  }, [allAbsences, slots]);

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
    setDateRange(getCurrentWeek());
    setSuccessMessage("");
    setSubmitError("");
  };

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!dateColumns.length || !selectedProgramme) return;

      // Collect checked cells: { `stagId|dateStr|slotIdx` }
      const checkedEntries = Object.entries(saisieData).filter(([, v]) => v);
      if (checkedEntries.length === 0) {
        setSuccessMessage("Aucune nouvelle absence à enregistrer.");
        setTimeout(() => setSuccessMessage(""), 3000);
        return;
      }

      setIsSubmitting(true);
      setSubmitError("");

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
            console.warn("No timeBlockId for slot", slotIdx);
            continue;
          }

          // Find or create session
          const session = await dispatch(
            findOrCreateSession({
              programme_id: selectedProgramme.id,
              date_session: dateStr,
              time_block_id: slot.timeBlockId,
              created_by: user?.id || null,
            }),
          ).unwrap();

          // Build bulk attendances payload
          const attendances = stagIds.map((stagId) => ({
            stagiaire_id: stagId,
            type_absence_id: 2, // 2 = ABSENT
            justification: null,
          }));

          await dispatch(
            bulkSubmitAttendances({ session_id: session.id, attendances }),
          ).unwrap();

          totalAdded += stagIds.length;
        }

        // Refresh absences list
        dispatch(fetchAttendances());

        setSuccessMessage(
          `${totalAdded} absence(s) enregistrée(s) avec succès.`,
        );
        setSaisieData({});
        setTimeout(() => setSuccessMessage(""), 5000);
      } catch (err) {
        setSubmitError(
          typeof err === "string" ? err : err?.message || "Une erreur est survenue lors de la soumission.",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [saisieData, dateColumns, selectedProgramme, slots, dispatch, user],
  );

  const lockedProgramme =
    availableProgrammes.length === 1 ? availableProgrammes[0] : null;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold">
          <i className="bi bi-person-badge me-2 text-dark-navy"></i>
          Registre de Présence
        </h2>
        <p className="text-muted">
          Saisie par séances (S1–S4) de 2h30 chacune. Cliquez sur une case pour marquer une absence.
        </p>
      </div>

      <div
        className="card mb-4 border-0 shadow-sm"
        style={{ position: "relative", zIndex: 9999 }}
      >
        <div className="card-header bg-dark text-white py-3">
          <h5 className="mb-0 small text-uppercase fw-bold tracking-wider">
            <i className="bi bi-gear-fill me-2"></i>Configuration du Registre
          </h5>
        </div>
        <div className="card-body bg-light border-bottom">
          <div className="row g-4 align-items-end">
            {/* Programme / Filière select */}
            <div className="col-lg-4">
              <label className="form-label fw-bold small text-muted text-uppercase">
                Classe / Filière
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white border-end-0">
                  <i
                    className={`bi ${
                      lockedProgramme
                        ? "bi-lock-fill text-warning"
                        : "bi-mortarboard-fill text-dark-navy"
                    }`}
                  ></i>
                </span>
                <div className="position-relative flex-grow-1">
                  <input
                    type="text"
                    className="form-control border-start-0 rounded-start-0"
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
                      if (!e.target.value) {
                        setSelectedProgrammeId("");
                        setSaisieData({});
                      }
                    }}
                    onFocus={() => {
                      setClasseSearch("");
                      setClasseDropdownOpen(true);
                    }}
                    onBlur={() => setTimeout(() => setClasseDropdownOpen(false), 150)}
                    disabled={!!lockedProgramme}
                    autoComplete="off"
                  />
                  {classeDropdownOpen && (
                    <ul className="classe-dropdown list-unstyled mb-0 position-absolute w-100 bg-white border rounded shadow" style={{ top: "100%", zIndex: 1050, maxHeight: "220px", overflowY: "auto" }}>
                      {availableProgrammes
                        .filter((p) => {
                          const q = classeSearch.toLowerCase();
                          return (
                            p.code_diplome.toLowerCase().includes(q) ||
                            (p.libelle || "").toLowerCase().includes(q)
                          );
                        })
                        .map((p) => (
                          <li
                            key={p.id}
                            className="classe-dropdown-item px-3 py-2"
                            style={{ cursor: "pointer", fontSize: "0.9rem" }}
                            onMouseDown={() => {
                              setSelectedProgrammeId(String(p.id));
                              setClasseSearch("");
                              setClasseDropdownOpen(false);
                              setSaisieData({});
                            }}
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
                <small
                  className="text-muted d-block mt-1"
                  style={{ fontSize: "0.72rem" }}
                >
                  <i className="bi bi-info-circle me-1"></i>
                  Filière assignée par l'administrateur
                </small>
              )}
            </div>

            {/* Date range picker */}
            <div className="col-lg-5">
              <label className="form-label fw-bold small text-muted text-uppercase">
                Période d'appel
              </label>
              <div className="position-relative">
                <button
                  className="btn btn-white border btn-lg w-100 d-flex justify-content-between align-items-center shadow-sm"
                  onClick={() => setShowCalendar(!showCalendar)}
                  type="button"
                >
                  <span className="text-dark">
                    <i className="bi bi-calendar-check-fill me-2 text-dark-navy"></i>
                    {dateRange?.[0]
                      ? dateRange[0].toLocaleDateString("fr-FR")
                      : "Début"}
                    <span className="mx-2 text-muted">➟</span>
                    {dateRange?.[1]
                      ? dateRange[1].toLocaleDateString("fr-FR")
                      : "Fin"}
                  </span>
                  <i
                    className={`bi bi-chevron-${showCalendar ? "up" : "down"} text-muted`}
                  ></i>
                </button>

                {showCalendar && (
                  <div
                    className="position-absolute start-0 mt-2 bg-white p-3 border rounded shadow-lg"
                    style={{ minWidth: "350px", zIndex: 1050 }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                      <span className="fw-bold small text-muted">
                        CHOISIR LA PLAGE
                      </span>
                      <button
                        className="btn-close btn-sm"
                        onClick={() => setShowCalendar(false)}
                      ></button>
                    </div>
                    <Calendar
                      onChange={(val) => {
                        setDateRange(val);
                        if (val && val.length === 2 && val[0] && val[1])
                          setShowCalendar(false);
                      }}
                      selectRange={true}
                      value={dateRange}
                      className="border-0 w-100"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Reset button */}
            <div className="col-lg-3">
              <button
                className="btn btn-outline-secondary btn-lg w-100"
                type="button"
                onClick={handleReset}
              >
                <i className="bi bi-x-lg me-1"></i> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Success / Error alerts */}
      {successMessage && (
        <div className="alert alert-success border-0 shadow-sm d-flex align-items-center mb-4 fade show">
          <i className="bi bi-check-circle-fill fs-4 me-3"></i>
          <div className="fw-medium">{successMessage}</div>
        </div>
      )}
      {submitError && (
        <div className="alert alert-danger border-0 shadow-sm d-flex align-items-center mb-4">
          <i className="bi bi-exclamation-triangle-fill fs-4 me-3"></i>
          <div className="fw-medium">{submitError}</div>
          <button
            type="button"
            className="btn-close ms-auto"
            onClick={() => setSubmitError("")}
          ></button>
        </div>
      )}

      {dateColumns.length > 0 && selectedProgramme ? (
        filteredStagiaires.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="card-header bg-white py-4 border-bottom-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                    <span className="bg-dark-navy text-white p-2 rounded me-3">
                      <i className="bi bi-people-fill"></i>
                    </span>
                    {selectedProgramme.code_diplome}
                    {selectedProgramme.libelle && (
                      <span className="text-muted fw-normal ms-2 small">
                        — {selectedProgramme.libelle}
                      </span>
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

              <div className="table-responsive" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                <table className="table table-bordered table-sm mb-0 align-middle professional-grid">
                  <thead style={{ position: "sticky", top: 0, zIndex: 20, boxShadow: "inset 0 2px 0 #ced4da, 0 2px 0 #adb5bd" }}>
                    <tr className="bg-light">
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

              <div className="card-footer bg-light p-4 text-center border-top-0">
                <button
                  type="submit"
                  className="btn btn-dark-navy px-5 py-3 btn-lg shadow rounded-pill fw-bold"
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
          <div className="text-center py-5 bg-white border rounded shadow-sm">
            <i
              className="bi bi-people text-muted opacity-25"
              style={{ fontSize: "4rem" }}
            ></i>
            <h5 className="mt-3 text-muted">
              Aucun stagiaire trouvé pour cette filière
            </h5>
            <p className="text-muted small">
              Ajoutez des stagiaires dans la page Stagiaires d'abord.
            </p>
          </div>
        )
      ) : (
        <div
          className="text-center py-5 bg-white border rounded shadow-sm"
          style={{ borderStyle: "dashed" }}
        >
          <i
            className="bi bi-layout-three-columns text-dark-navy opacity-25"
            style={{ fontSize: "5rem" }}
          ></i>
          <h4 className="mt-3 text-dark fw-bold">Registre d'Appel Prêt</h4>
          <p className="text-muted">
            Sélectionnez une filière et une période pour charger la grille de
            saisie professionnelle.
          </p>
        </div>
      )}

      <style>{`
        .professional-grid { border-collapse: collapse; width: 100%; border: 2px solid #ced4da; }
        .professional-grid th, .professional-grid td { border: 1px solid #dee2e6 !important; }
        .professional-grid thead tr:first-child th { border-bottom: 1px solid #dee2e6 !important; }
        .professional-grid thead th { background-color: #f8f9fa; }
        .date-group-start { border-left: 2px solid #adb5bd !important; }
        .border-end-heavy { border-right: 2px solid #adb5bd !important; }
        .sticky-col { position: sticky; left: 0; z-index: 5; background-color: #fff !important; }
        .cell-slot { cursor: pointer; transition: background 0.2s; position: relative; }
        .cell-slot:hover { background-color: #f1f3f5; }
        .is-absent { background-color: #dc3545 !important; border-color: #dc3545 !important; }
        .is-submitted { background-color: #0A121A !important; border-color: #0A121A !important; cursor: default !important; }
        .dot-marker { display: inline-block; width: 6px; height: 6px; background-color: #ced4da; border-radius: 50%; }
        .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; transition: all 0.2s; }
        .btn-dark-navy:hover:not(:disabled) { background-color: #1a232f; border-color: #1a232f; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .hover-row:hover td:not(.is-absent):not(.is-submitted) { background-color: #e8f0fe !important; transition: background-color 0.15s ease; }
        .bg-dark-navy { background-color: #0A121A; }
        .text-dark-navy { color: #0A121A; }
        .classe-dropdown-item:hover { background-color: #e8f0fe; }
        .classe-dropdown { margin-top: 2px; }
        .btn-white { background-color: #fff; border-color: #dee2e6; }
        .tracking-wider { letter-spacing: 0.05em; }
      `}</style>
    </div>
  );
}

export default SaisiePage;
