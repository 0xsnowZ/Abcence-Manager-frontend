import React, { useState, useMemo, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import { addAbsence } from "../store/absenceSlice.jsx";

// Saisie Page
function SaisiePage() {
  const dispatch = useDispatch();
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const allAbsences = useSelector((state) => state.absences.items);
  const { user } = useSelector((state) => state.auth);

  const isProf = user?.role === 'prof';
  // Filières assigned to this prof (empty = unrestricted)
  const profFilieres = isProf && user?.filieres?.length > 0 ? user.filieres : [];
  // Lock the select when prof has exactly one filière
  const lockedFiliere = profFilieres.length === 1 ? profFilieres[0] : null;

  // Date range: [startDate, endDate]
  const [dateRange, setDateRange] = useState([new Date(), new Date()]);
  const [filiere, setFiliere] = useState(lockedFiliere || "");
  const [showCalendar, setShowCalendar] = useState(false);

  // If the prof's assigned filière changes (e.g. admin edits), sync to state
  useEffect(() => {
    if (lockedFiliere) {
      setFiliere(lockedFiliere);
      setSaisieData({});
    }
  }, [lockedFiliere]);

  // saisieData: { [`${stagId}|${dateStr}|${slotId}`]: boolean }
  const [saisieData, setSaisieData] = useState({});
  const [successMessage, setSuccessMessage] = useState("");

  // Create a persistent map of ALREADY submitted absences from Redux
  const reduxAbsencesMap = useMemo(() => {
    const map = {};
    allAbsences.forEach((a) => {
      const dateStr = a.date;
      const stagId = a.idstag;

      // If we have explicit slots, use them
      if (a.slots && Array.isArray(a.slots)) {
        a.slots.forEach((slotId) => {
          map[`${stagId}|${dateStr}|${slotId}`] = true;
        });
      } else {
        // Fallback for legacy data/direct entry: fill slots sequentially based on hours
        const numSlots = Math.ceil((a.heures || 2.5) / 2.5);
        for (let i = 1; i <= numSlots; i++) {
          map[`${stagId}|${dateStr}|${i}`] = true;
        }
      }
    });
    return map;
  }, [allAbsences]);

  const slots = [
    { id: 1, label: "08:30-11:00", short: "S1" },
    { id: 2, label: "11:00-13:30", short: "S2" },
    { id: 3, label: "13:30-16:00", short: "S3" },
    { id: 4, label: "16:00-18:30", short: "S4" },
  ];

  const filieres = useMemo(() => {
    const all = [...new Set(stagiaires.map((s) => s.filiere))].sort();
    // If prof has assigned filières, restrict the list
    if (profFilieres.length > 0) return all.filter((f) => profFilieres.includes(f));
    return all;
  }, [stagiaires, profFilieres]);

  const filteredStagiaires = useMemo(() => {
    if (!filiere) return [];
    return stagiaires.filter((s) => s.filiere === filiere);
  }, [stagiaires, filiere]);

  // Calculate dates between start and end
  const getDatesInRange = (startDate, endDate) => {
    const dates = [];
    if (!startDate || !endDate) return dates;

    let currentDate = new Date(startDate.getTime());
    currentDate.setHours(0, 0, 0, 0);

    const end = new Date(endDate.getTime());
    end.setHours(0, 0, 0, 0);

    while (currentDate <= end) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  const dateColumns = useMemo(() => {
    if (dateRange && dateRange.length === 2 && dateRange[0] && dateRange[1]) {
      return getDatesInRange(dateRange[0], dateRange[1]);
    }
    return [];
  }, [dateRange]);

  // Handle individual cell toggle
  const handleSaisieChange = (stagId, dateStr, slotId) => {
    const key = `${stagId}|${dateStr}|${slotId}`;
    // Prevent editing already submitted data through this interface
    if (reduxAbsencesMap[key]) return;

    setSaisieData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper to format date for display
  const formatHeaderDate = (d) => {
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
  };

  // Helper to format date for backend/state
  const formatStoreDate = (d) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  const handleReset = () => {
    setSaisieData({});
    setFiliere("");
    setDateRange([new Date(), new Date()]);
    setSuccessMessage("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!dateColumns.length || !filiere) return;

    let addedCount = 0;

    // Group entries by student and date
    const grouped = {};

    Object.entries(saisieData).forEach(([key, isAbsent]) => {
      if (isAbsent) {
        const [stagId, dateStr, slotId] = key.split("|");
        const groupKey = `${stagId}|${dateStr}`;
        if (!grouped[groupKey]) grouped[groupKey] = [];
        grouped[groupKey].push(parseInt(slotId));
      }
    });

    Object.entries(grouped).forEach(([groupKey, slotsArray]) => {
      const [stagId, dateStr] = groupKey.split("|");
      dispatch(
        addAbsence({
          idstag: parseInt(stagId),
          date: dateStr,
          justifie: false,
          heures: slotsArray.length * 2.5,
          slots: slotsArray,
        }),
      );
      addedCount++;
    });

    if (addedCount > 0) {
      setSuccessMessage(`${addedCount} absence(s) enregistrée(s) avec succès.`);
      setSaisieData({});
      setTimeout(() => setSuccessMessage(""), 5000);
    } else {
      setSuccessMessage("Aucune nouvelle absence à enregistrer.");
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h2 className="fw-bold">
          <i className="bi bi-person-badge me-2 text-dark-navy"></i>
          Registre de Présence
        </h2>
        <p className="text-muted">
          Saisie par séances (S1-S4) de 2h30 chacune. Cliquez sur une case pour
          marquer une absence.
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
            <div className="col-lg-4">
              <label className="form-label fw-bold small text-muted text-uppercase">
                Classe / Filière
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-white border-end-0">
                  <i className={`bi ${lockedFiliere ? 'bi-lock-fill text-warning' : 'bi-mortarboard-fill text-dark-navy'}`}></i>
                </span>
                <select
                  className="form-select border-start-0"
                  value={filiere}
                  onChange={(e) => {
                    setFiliere(e.target.value);
                    setSaisieData({});
                  }}
                  required
                  disabled={!!lockedFiliere}
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map((f, i) => (
                    <option key={i} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
              </div>
              {lockedFiliere && (
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.72rem' }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Filière assignée par l'administrateur
                </small>
              )}
            </div>
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

      {successMessage && (
        <div className="alert alert-success border-0 shadow-sm d-flex align-items-center mb-4 fade show">
          <i className="bi bi-check-circle-fill fs-4 me-3"></i>
          <div className="fw-medium">{successMessage}</div>
        </div>
      )}

      {dateColumns.length > 0 && filiere ? (
        filteredStagiaires.length > 0 ? (
          <form onSubmit={handleSubmit}>
            <div className="card border-0 shadow-lg overflow-hidden">
              <div className="card-header bg-white py-4 border-bottom-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
                    <span className="bg-dark-navy text-white p-2 rounded me-3">
                      <i className="bi bi-people-fill"></i>
                    </span>
                    {filiere}
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

              <div className="table-responsive">
                <table className="table table-bordered table-sm mb-0 align-middle professional-grid">
                  <thead>
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
                          colSpan="4"
                          className="text-center py-2 border-bottom-0"
                          style={{
                            minWidth: "160px",
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
                      {dateColumns.map((d, dIdx) => (
                        <React.Fragment key={dIdx}>
                          {slots.map((s) => (
                            <th
                              key={s.id}
                              className="text-center small py-1 border-top-0"
                              style={{ width: "40px", fontSize: "0.65rem" }}
                            >
                              {s.id}
                            </th>
                          ))}
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStagiaires.map((stagiaire) => (
                      <tr key={stagiaire.id} className="hover-row">
                        <td className="ps-4 fw-bold text-dark border-end-heavy sticky-col bg-white">
                          {stagiaire.nom}
                        </td>
                        {dateColumns.map((d, dIdx) => {
                          const dateStr = formatStoreDate(d);
                          return (
                            <React.Fragment key={dIdx}>
                              {slots.map((s) => {
                                const key = `${stagiaire.id}|${dateStr}|${s.id}`;
                                const isNew = !!saisieData[key];
                                const isSubmitted = !!reduxAbsencesMap[key];
                                const isChecked = isNew || isSubmitted;

                                return (
                                  <td
                                    key={s.id}
                                    className={`text-center p-0 cell-slot ${isNew ? "is-absent" : ""} ${isSubmitted ? "is-submitted" : ""}`}
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
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="card-footer bg-light p-4 text-center border-top-0">
                <button
                  type="submit"
                  className="btn btn-dark-navy px-5 py-3 btn-lg shadow rounded-pill fw-bold"
                >
                  <i className="bi bi-check2-all me-2"></i>
                  VALIDER LE RÉGISTRE D'APPEL
                </button>
                <div className="mt-3 text-secondary small">
                  <i className="bi bi-info-circle-fill me-1"></i>
                  Chaque séance sélectionnée "A" sera enregistrée comme 2h30
                  d'absence.
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
                .professional-grid { border-collapse: collapse; width: 100%; border: 1px solid #ced4da; }
                .professional-grid th, .professional-grid td { border: 1px solid #adb5bd !important; }
                .border-end-heavy { border-right: 3px solid #495057 !important; }
                .sticky-col { position: sticky; left: 0; z-index: 5; background-color: #fff !important; }
                .cell-slot { cursor: pointer; transition: background 0.2s; position: relative; }
                .cell-slot:hover { background-color: #f8f9fa; }
                .is-absent { background-color: #dc3545 !important; border-color: #dc3545 !important; }
                .is-submitted { background-color: #0A121A !important; border-color: #0A121A !important; cursor: default !important; }
                .dot-marker { display: inline-block; width: 6px; height: 6px; background-color: #dee2e6; border-radius: 50%; opacity: 0.6; }
                .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; transition: all 0.2s; }
                .btn-dark-navy:hover { background-color: #1a232f; border-color: #1a232f; color: #fff; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
                .hover-row:hover .sticky-col { background-color: #f8f9fa !important; }
                .bg-dark-navy { background-color: #0A121A; }
                .text-dark-navy { color: #0A121A; }
                .btn-white { background-color: #fff; border-color: #dee2e6; }
                .tracking-wider { letter-spacing: 0.05em; }
            `}</style>
    </div>
  );
}

export default SaisiePage;
