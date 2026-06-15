import { useState, useRef, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as XLSX from "xlsx";
import { importStagiairesFromExcel, fetchStagiaires } from "../store/stagiaireSlice.jsx";
import { useToast } from "./ToastProvider.jsx";

const COLUMN_MAP = {
  matriculeetudiant: "matricule",
  nom: "nom",
  prenom: "prenom",
  sexe: "sexe",
  datenaissance: "date_naissance",
  lieunaissance: "lieu_naissance",
  cin: "cin",
  ntelelephone: "telephone",
  codediplome: "code_diplome",
  dateinscription: "date_inscription",
  datedossiercomplet: "date_dossier_complet",
};

const DATE_FIELDS = new Set(["date_naissance", "date_inscription", "date_dossier_complet"]);

const FIELD_LABELS = {
  matricule: "Matricule",
  nom: "Nom",
  prenom: "Prénom",
  sexe: "Sexe",
  date_naissance: "Date Naissance",
  lieu_naissance: "Lieu Naissance",
  cin: "CIN",
  telephone: "Téléphone",
  code_diplome: "Code Diplome",
  date_inscription: "Date Inscription",
  date_dossier_complet: "Date Dossier Complet",
};

const FIELD_ORDER = [
  "matricule", "nom", "prenom", "sexe", "date_naissance", "lieu_naissance",
  "cin", "telephone", "code_diplome", "date_inscription", "date_dossier_complet",
];

function normalizeDate(val) {
  if (val == null || val === "") return null;
  // Already a Date object
  if (val instanceof Date && !isNaN(val)) {
    return val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (!str) return null;
  // Excel serial number (e.g. 45000)
  if (/^\d+(\.\d+)?$/.test(str) && parseInt(str) > 40000) {
    const d = XLSX.SSF.parse_date_code(parseFloat(str));
    if (d) {
      const m = String(d.m).padStart(2, "0");
      const day = String(d.d).padStart(2, "0");
      return `${d.y}-${m}-${day}`;
    }
  }
  // DD/MM/YYYY or D/M/YYYY
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (dmy) {
    const [, day, month, year] = dmy;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }
  // YYYY-MM-DD already
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  // Try native Date parsing as fallback
  const d = new Date(str);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return null;
}

function ExcelImportModal({ onClose }) {
  const dispatch = useDispatch();
  const showToast = useToast();
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const wb = XLSX.read(evt.target.result, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: "" });
      const mapped = raw.map((r) => {
        const entry = {};
        Object.entries(r).forEach(([key, val]) => {
          const k = key.toLowerCase().replace(/[\s\-_]/g, "");
          const mappedKey = COLUMN_MAP[k];
          if (mappedKey) {
            entry[mappedKey] = DATE_FIELDS.has(mappedKey) ? normalizeDate(val) : String(val).trim();
          }
        });
        return entry;
      }).filter((r) => r.matricule && r.nom && r.prenom);
      setRows(mapped);
      setResult(null);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    const res = await dispatch(importStagiairesFromExcel(rows));
    setImporting(false);
    if (res.error) {
      showToast(res.payload || "Erreur lors de l'import.", "error");
    } else {
      setResult(res.payload);
      showToast(
        `Import terminé : ${res.payload.created} créés, ${res.payload.updated} mis à jour, ${res.payload.errors} erreurs.`,
        "success"
      );
      dispatch(fetchStagiaires());
    }
  };

  return (
    <>
      <div className="modal fade show d-block" role="dialog" aria-modal="true" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg overflow-hidden">
            <div style={{ height: 4, background: "var(--color-primary)" }} />
            <div className="modal-header border-0 pb-1">
              <h5 className="modal-title d-flex align-items-center gap-2 fw-bold" style={{ fontSize: "1rem" }}>
                <i className="bi bi-file-earmark-spreadsheet-fill text-primary" />
                Importer depuis Excel
              </h5>
              <button className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFile}
                className="form-control mb-3"
              />

              {rows.length > 0 && (
                <div className="mb-3">
                  <div className="alert alert-info py-2 mb-2" style={{ fontSize: "0.85rem" }}>
                    <i className="bi bi-info-circle me-1"></i>
                    {rows.length} stagiaire(s) détectés.
                  </div>
                  <div style={{ maxHeight: 300, overflow: "auto" }} className="border rounded small">
                    <table className="table table-sm mb-0" style={{ fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                      <thead>
                        <tr>
                          <th className="sticky-top bg-white">#</th>
                          {FIELD_ORDER.filter((f) => rows.some((r) => r[f] != null && r[f] !== "")).map((f) => (
                            <th key={f} className="sticky-top bg-white">{FIELD_LABELS[f] || f}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 100).map((r, i) => (
                          <tr key={i}>
                            <td className="text-muted">{i + 1}</td>
                            {FIELD_ORDER.filter((f) => rows.some((r) => r[f] != null && r[f] !== "")).map((f) => (
                              <td key={f}>{r[f] != null && r[f] !== "" ? r[f] : "—"}</td>
                            ))}
                          </tr>
                        ))}
                        {rows.length > 100 && (
                          <tr><td colSpan={99} className="text-muted text-center">... et {rows.length - 100} autres</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {result && (
                <div className="alert alert-success py-2" style={{ fontSize: "0.85rem" }}>
                  <i className="bi bi-check-circle-fill me-1"></i>
                  {result.created} créés, {result.updated} mis à jour, {result.errors} erreurs.
                </div>
              )}
            </div>
            <div className="modal-footer border-0 pt-0">
              <button className="btn btn-outline-secondary rounded-pill btn-sm px-4" onClick={onClose}>
                Fermer
              </button>
              <button
                className="btn btn-dark-navy btn-sm px-4 rounded-pill"
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
              >
                {importing ? (
                  <><span className="spinner-border spinner-border-sm me-2"></span>Importation...</>
                ) : (
                  <><i className="bi bi-upload me-2"></i>Importer{rows.length > 0 ? ` (${rows.length})` : ""}</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1054 }} onClick={onClose} />
    </>
  );
}

export default ExcelImportModal;
