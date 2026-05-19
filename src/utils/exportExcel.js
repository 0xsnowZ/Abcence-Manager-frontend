import * as XLSX from "xlsx";

// ─── Status label map ──────────────────────────────────────────────────────────
const STATUS_LABELS = {
  non_justifie:    "Non justifiée",
  justifie:        "Justifiée",
  retard:          "Retard",
  absence_excusee: "Absence excusée",
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
function getStagiaire(stagiaires, idstag) {
  return stagiaires.find((s) => s.id === idstag) || null;
}

function getClasse(stagiaires, idstag) {
  const s = getStagiaire(stagiaires, idstag);
  if (!s) return "—";
  return (s.programmes || [])[0]?.code_diplome || s.filiere || s.programme_code || "—";
}

function buildRow(absence, stagiaires) {
  const s = getStagiaire(stagiaires, absence.idstag);
  const name =
    absence.stagiaireNom ||
    (s ? `${s.prenom ?? ""} ${s.nom ?? ""}`.trim() : "Inconnu");

  return {
    ID:            absence.id,
    Stagiaire:     name,
    Matricule:     s?.matricule ?? "—",
    Classe:        getClasse(stagiaires, absence.idstag),
    Date:          absence.date
                     ? new Date(absence.date).toLocaleDateString("fr-FR")
                     : "—",
    "Heures":      absence.heures ?? 2.5,
    Statut:        STATUS_LABELS[absence.status] ?? "Non justifiée",
    Justification: absence.justification || "",
  };
}

/**
 * Set reasonable column widths on a worksheet.
 */
function applyColWidths(ws) {
  ws["!cols"] = [
    { wch: 6  }, // ID
    { wch: 28 }, // Stagiaire
    { wch: 14 }, // Matricule
    { wch: 14 }, // Classe
    { wch: 12 }, // Date
    { wch: 8  }, // Heures
    { wch: 18 }, // Statut
    { wch: 40 }, // Justification
  ];
}

/**
 * Build a worksheet from an array of absence objects.
 */
function makeSheet(absences, stagiaires) {
  const rows = absences.map((a) => buildRow(a, stagiaires));
  const ws   = XLSX.utils.json_to_sheet(rows);
  applyColWidths(ws);
  return ws;
}

// ─── Main export function ──────────────────────────────────────────────────────
/**
 * Export filtered absences to an Excel (.xlsx) file and trigger browser download.
 *
 * @param {Array}  filteredAbsences  Normalized absence objects already filtered by the UI
 * @param {Array}  stagiaires        Full stagiaire list from Redux store
 * @param {string} filiereFilter     Currently active class filter ("" = all classes)
 */
export function exportAbsencesToExcel(filteredAbsences, stagiaires, filiereFilter) {
  const workbook = XLSX.utils.book_new();
  const dateStr  = new Date().toISOString().slice(0, 10);

  if (filiereFilter) {
    // ── Single class → one sheet ─────────────────────────────────────────────
    const sheetName = filiereFilter.slice(0, 31); // Excel max 31 chars
    const ws        = makeSheet(filteredAbsences, stagiaires);
    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    XLSX.writeFile(workbook, `absences_${filiereFilter}_${dateStr}.xlsx`);
  } else {
    // ── All classes → one sheet per class ────────────────────────────────────
    const byClasse = {};
    filteredAbsences.forEach((a) => {
      const classe = getClasse(stagiaires, a.idstag);
      if (!byClasse[classe]) byClasse[classe] = [];
      byClasse[classe].push(a);
    });

    const classes = Object.keys(byClasse).sort();

    if (classes.length === 0) {
      // Guard: avoid empty workbook (Excel won't open it)
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, ws, "Aucune donnée");
    } else {
      classes.forEach((classe) => {
        const ws = makeSheet(byClasse[classe], stagiaires);
        XLSX.utils.book_append_sheet(workbook, ws, classe.slice(0, 31));
      });
    }

    XLSX.writeFile(workbook, `absences_toutes_classes_${dateStr}.xlsx`);
  }
}
