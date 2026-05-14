import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function CalendarHistory() {
  const absences = useSelector((state) => state.absences.items);
  const stagiaires = useSelector((state) => state.stagiaires.items);
  const { user } = useSelector((state) => state.auth);

  const isProf = user?.role === 'prof';
  const profFilieres = useMemo(() =>
    isProf && user?.programmes?.length > 0
      ? user.programmes.map((p) => p.code_diplome)
      : [],
    [isProf, user]
  );

  const getStagiaireClasse = (s) =>
    (s.programmes || [])[0]?.code_diplome || s.filiere || s.programme_code || "";

  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    return [start, end];
  });
  const [showCalendar, setShowCalendar] = useState(false);

  const filieres = useMemo(() => {
    const all = [...new Set(stagiaires.map(getStagiaireClasse).filter(Boolean))].sort();
    if (profFilieres.length > 0) {
      return all.filter(f => profFilieres.includes(f));
    }
    return all;
  }, [stagiaires, profFilieres]);

  const [filiere, setFiliere] = useState(profFilieres.length === 1 ? profFilieres[0] : "");

  const filteredStagiaires = useMemo(() => {
    if (!filiere) return [];
    return stagiaires.filter((s) => getStagiaireClasse(s) === filiere);
  }, [stagiaires, filiere]);

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

  const formatStoreDate = (d) => {
    const offset = d.getTimezoneOffset();
    const localDate = new Date(d.getTime() - offset * 60 * 1000);
    return localDate.toISOString().split("T")[0];
  };

  // Map: `${stagiaireId}_${date}` → absence[]
  const absenceMap = useMemo(() => {
    const map = {};
    absences.forEach((a) => {
      const sid = a.idstag ?? a.stagiaire_id;
      const date = a.date ?? a.session?.date_session ?? "";
      if (!sid || !date) return;
      const key = `${sid}_${date}`;
      if (!map[key]) map[key] = [];
      map[key].push(a);
    });
    return map;
  }, [absences]);

  return (
    <>
      <div className="card-premium mb-5">
        <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center">
          <h5 className="section-title mb-0 d-flex align-items-center gap-3">
            <span className="avatar-circle avatar-md avatar-navy">
              <i className="bi bi-calendar3-range-fill" style={{ fontSize: "0.85rem" }}></i>
            </span>
            Historique du Calendrier
          </h5>
        </div>
        <div className="card-body p-3">
          <div className="row g-3 align-items-end">
            <div className="col-12 col-sm-5">
              <label className="form-label label-caps mb-1">Classe / Filière</label>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-mortarboard-fill text-dark-navy"></i>
                </span>
                <select
                  className="form-select form-select-sm border-start-0 bg-light"
                  value={filiere}
                  onChange={(e) => setFiliere(e.target.value)}
                >
                  <option value="">Sélectionner une filière</option>
                  {filieres.map((f, i) => (
                    <option key={i} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-12 col-sm-7 position-relative">
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
                  className="position-absolute end-0 mt-2 bg-white p-3 border rounded shadow-lg date-picker-dropdown"
                  style={{ minWidth: "350px", zIndex: 1050 }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-2 px-1">
                    <span className="fw-bold small text-muted" style={{ fontSize: "0.7rem" }}>CHOISIR LA PLAGE</span>
                    <button className="btn-close btn-sm" onClick={() => setShowCalendar(false)}></button>
                  </div>
                  <Calendar
                    onChange={(val) => {
                      setDateRange(val);
                      if (val && val.length === 2 && val[0] && val[1]) setShowCalendar(false);
                    }}
                    selectRange={true}
                    value={dateRange}
                    className="border-0 w-100 x-small-calendar"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {dateColumns.length > 0 && filiere ? (
          filteredStagiaires.length > 0 ? (
            <div className="table-responsive scroll-thin" style={{ maxHeight: "65vh", overflowY: "auto" }}>
              <table className="table table-sm mb-0 align-middle cal-grid">
                <thead style={{ position: "sticky", top: 0, zIndex: 20, boxShadow: "inset 0 2px 0 var(--color-border), 0 2px 0 var(--color-border-strong)" }}>
                  <tr>
                    <th
                      className="ps-4 cal-sticky-col"
                      style={{ width: "220px", zIndex: 10 }}
                    >
                      NOM DU STAGIAIRE
                    </th>
                    {dateColumns.map((d, index) => (
                      <th
                        key={index}
                        className="text-center py-2"
                        style={{ minWidth: "56px" }}
                      >
                        <div className="label-caps lh-1 mb-1">
                          {d.toLocaleDateString("fr-FR", { weekday: "short" })}
                        </div>
                        <div className="fw-600 text-dark" style={{ fontSize: "0.8rem" }}>
                          {d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredStagiaires.map((stagiaire) => (
                    <tr key={stagiaire.id} className="cal-hover-row">
                      <td className="ps-4 fw-600 cal-sticky-col cal-name-col">
                        {stagiaire.prenom ? `${stagiaire.prenom} ${stagiaire.nom}` : stagiaire.nomComplet || stagiaire.nom}
                      </td>
                      {dateColumns.map((d, dIdx) => {
                        const dateStr = formatStoreDate(d);
                        const key = `${stagiaire.id}_${dateStr}`;
                        const dayAbsences = absenceMap[key] || [];
                        const totalHours = dayAbsences.reduce(
                          (sum, a) => sum + (a.heures || 2.5),
                          0,
                        );
                        const allJustified =
                          dayAbsences.length > 0 &&
                          dayAbsences.every((a) => a.justifie ?? !!a.justification);

                        let cellClass = "";
                        let cellContent = null;

                        if (totalHours > 0) {
                          cellClass = allJustified
                            ? "is-justified"
                            : "is-absent";
                          cellContent = `${totalHours}h`;
                        } else {
                          cellContent = (
                            <span className="text-muted opacity-25">-</span>
                          );
                        }

                        return (
                          <td
                            key={dIdx}
                            className={`text-center p-0 cell-slot ${cellClass}`}
                            style={{ height: "48px" }}
                          >
                            {cellContent}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-5">
              <h5 className="body-sm">
                Aucun stagiaire trouvé pour cette filière
              </h5>
            </div>
          )
        ) : (
          <div className="text-center py-5 bg-white">
            <h5 className="text-muted">
              <i className="bi bi-info-circle me-2"></i>Sélectionnez une filière
              {isProf ? "" : " "}pour afficher l'historique
            </h5>
          </div>
        )}
      </div>

    </>
  );
}

export default CalendarHistory;
