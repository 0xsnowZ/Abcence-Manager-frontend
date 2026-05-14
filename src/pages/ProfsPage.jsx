import { useState, useEffect, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchProfs,
  createProf,
  updateProf,
  deleteProf,
} from "../store/profSlice.jsx";
import { fetchSecteurs, fetchProgrammesBySecteur } from "../store/secteurSlice.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";

const createAssignmentBlock = (secteurId = "", filiereIds = []) => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  secteurId: secteurId ? String(secteurId) : "",
  filiereIds: [...new Set(filiereIds.map((filiereId) => String(filiereId)))],
});

const buildBlocksFromProf = (prof) => {
  if (!prof?.programmes?.length) {
    return [createAssignmentBlock()];
  }

  const blocksBySecteur = new Map();

  prof.programmes.forEach((programme) => {
    const secteurId = programme.filiere?.secteur?.id ? String(programme.filiere.secteur.id) : "";
    const filiereId = String(programme.id);

    if (!blocksBySecteur.has(secteurId)) {
      blocksBySecteur.set(secteurId, []);
    }

    blocksBySecteur.get(secteurId).push(filiereId);
  });

  return [...blocksBySecteur.entries()].map(([secteurId, filiereIds]) =>
    createAssignmentBlock(secteurId, filiereIds),
  );
};

// ── ProfForm ────────────────────────────────────────────────────────────────
function ProfForm({ prof, onCancel, onSave, secteurs }) {
  const dispatch = useDispatch();
  const { programmesBySecteur, loadingProgrammes } = useSelector((state) => state.secteurs);
  const [form, setForm] = useState(
    prof
      ? {
        name: prof.name || "",
        email: prof.email || "",
        password: "",
        blocks: buildBlocksFromProf(prof),
      }
      : { name: "", email: "", password: "", blocks: [createAssignmentBlock()] },
  );
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingPayload, setPendingPayload] = useState(null);

  const selectedProgrammeIds = useMemo(
    () => form.blocks.flatMap((block) => block.filiereIds),
    [form.blocks],
  );

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Le nom est requis";
    if (!form.email.trim()) e.email = "L'email est requis";
    if (!prof && !form.password.trim())
      e.password = "Le mot de passe est requis";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  useEffect(() => {
    setForm(
      prof
        ? {
          name: prof.name || "",
          email: prof.email || "",
          password: "",
          blocks: buildBlocksFromProf(prof),
        }
        : { name: "", email: "", password: "", blocks: [createAssignmentBlock()] },
    );
    setErrors({});
    setConfirmOpen(false);
    setPendingPayload(null);
  }, [prof]);

  useEffect(() => {
    form.blocks.forEach((block) => {
      if (block.secteurId && !programmesBySecteur[block.secteurId]) {
        dispatch(fetchProgrammesBySecteur(block.secteurId));
      }
    });
  }, [dispatch, form.blocks, programmesBySecteur]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: null }));
  };

  const updateBlock = (blockId, updater) => {
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === blockId ? updater(block) : block)),
    }));
  };

  const handleSecteurChange = (blockId, secteurId) => {
    updateBlock(blockId, () => createAssignmentBlock(secteurId, []));
    if (secteurId && !programmesBySecteur[secteurId]) {
      dispatch(fetchProgrammesBySecteur(secteurId));
    }
  };

  const toggleFiliere = (blockId, filiereId) => {
    const selectedId = String(filiereId);
    updateBlock(blockId, (block) => ({
      ...block,
      filiereIds: block.filiereIds.includes(selectedId)
        ? block.filiereIds.filter((existingId) => existingId !== selectedId)
        : [...block.filiereIds, selectedId],
    }));
  };

  const addBlock = () => {
    setForm((current) => ({
      ...current,
      blocks: [...current.blocks, createAssignmentBlock()],
    }));
  };

  const removeBlock = (blockId) => {
    setForm((current) => {
      const nextBlocks = current.blocks.filter((block) => block.id !== blockId);
      return {
        ...current,
        blocks: nextBlocks.length > 0 ? nextBlocks : [createAssignmentBlock()],
      };
    });
  };

  const preparePayload = () => {
    const programmeIds = [...new Set(form.blocks.flatMap((block) => block.filiereIds))];

    return {
      name: form.name.trim(),
      email: form.email.trim(),
      programme_ids: programmeIds.map((programmeId) => Number(programmeId)),
      ...(form.password ? { password: form.password } : {}),
      ...(prof ? { id: prof.id } : {}),
    };
  };

  const handleSaveClick = () => {
    if (!validate()) return;
    setPendingPayload(preparePayload());
    setConfirmOpen(true);
  };

  const handleSave = async () => {
    if (!pendingPayload) return;
    setSaving(true);
    await onSave(pendingPayload);
    setConfirmOpen(false);
    setPendingPayload(null);
    setSaving(false);
  };

  return (
    <div className="card border-0 shadow-lg overflow-hidden">
      {/* Accent bar */}
      <div
        style={{
          height: 4,
          background: "linear-gradient(90deg,#0A121A,#334155)",
        }}
      />
      <div className="card-header bg-white py-4 border-bottom-0">
        <h5 className="mb-0 fw-bold text-dark d-flex align-items-center">
          <span className="bg-dark-navy text-white p-2 rounded me-3 d-flex">
            <i className="bi bi-person-plus-fill"></i>
          </span>
          {prof ? "Modifier le Professeur" : "Nouveau Professeur"}
        </h5>
      </div>

      <div className="card-body p-4 bg-light border-top border-bottom">
        {/* Nom */}
        <div className="mb-3">
          <label className="form-label fw-bold small text-muted text-uppercase">
            Nom complet
          </label>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-person text-dark-navy"></i>
            </span>
            <input
              type="text"
              className={`form-control border-start-0 ${errors.name ? "is-invalid" : ""}`}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Ex: Ahmed Alami"
            />
          </div>
          {errors.name && (
            <div className="text-danger small mt-1">{errors.name}</div>
          )}
        </div>

        {/* Email */}
        <div className="mb-3">
          <label className="form-label fw-bold small text-muted text-uppercase">
            Adresse Email
          </label>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-envelope text-dark-navy"></i>
            </span>
            <input
              type="email"
              className={`form-control border-start-0 ${errors.email ? "is-invalid" : ""}`}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="prof@school.ma"
            />
          </div>
          {errors.email && (
            <div className="text-danger small mt-1">{errors.email}</div>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase">
            Mot de passe{" "}
            {prof && (
              <span className="text-muted fw-normal">
                (laisser vide pour ne pas changer)
              </span>
            )}
          </label>
          <div className="input-group shadow-sm">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-key text-dark-navy"></i>
            </span>
            <input
              type={showPass ? "text" : "password"}
              className={`form-control border-start-0 border-end-0 ${errors.password ? "is-invalid" : ""}`}
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="input-group-text bg-white border-start-0"
              onClick={() => setShowPass((v) => !v)}
              tabIndex={-1}
            >
              <i
                className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"} text-muted`}
              ></i>
            </button>
          </div>
          {errors.password && (
            <div className="text-danger small mt-1">{errors.password}</div>
          )}
        </div>

        {/* Programmes multi-select */}
        <div className="mb-4">
          <label className="form-label fw-bold small text-muted text-uppercase d-flex justify-content-between align-items-center">
            <span>Assignation secteur / filières</span>
            <span className="badge bg-dark-navy rounded-pill">
              {selectedProgrammeIds.length} sélectionnée(s)
            </span>
          </label>

          <div className="d-grid gap-3">
            {form.blocks.map((block, blockIndex) => {
              const blockProgrammes = block.secteurId ? (programmesBySecteur[block.secteurId] || []) : [];
              const assignedElsewhere = new Set(
                form.blocks
                  .filter((otherBlock) => otherBlock.id !== block.id)
                  .flatMap((otherBlock) => otherBlock.filiereIds),
              );
              const visibleProgrammes = blockProgrammes.filter(
                (programme) => !assignedElsewhere.has(String(programme.id)) || block.filiereIds.includes(String(programme.id)),
              );

              return (
                <div key={block.id} className="border rounded-4 p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
                    <div className="fw-semibold text-dark">
                      Bloc {blockIndex + 1}
                    </div>
                    {form.blocks.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger rounded-pill"
                        onClick={() => removeBlock(block.id)}
                      >
                        <i className="bi bi-trash3 me-1"></i>
                        Retirer
                      </button>
                    )}
                  </div>

                  <div className="mb-3">
                    <label className="form-label small text-muted text-uppercase">Secteur</label>
                    <select
                      className="form-select"
                      value={block.secteurId}
                      onChange={(event) => handleSecteurChange(block.id, event.target.value)}
                    >
                      <option value="">-- Sélectionner un secteur --</option>
                      {secteurs.map((secteur) => (
                        <option key={secteur.id} value={secteur.id}>
                          {secteur.code}
                        </option>
                      ))}
                    </select>
                  </div>

                  {block.secteurId && (
                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label small text-muted text-uppercase mb-0">Filières</label>
                        <small className="text-muted">
                          Sélection multiple possible
                        </small>
                      </div>

                      {loadingProgrammes && !programmesBySecteur[block.secteurId] ? (
                        <div className="py-3 text-muted small">
                          <span className="spinner-border spinner-border-sm me-2" />
                          Chargement des filières...
                        </div>
                      ) : visibleProgrammes.length === 0 ? (
                        <div className="text-muted small fst-italic py-2">
                          Aucune filière disponible pour ce secteur.
                        </div>
                      ) : (
                        <div className="d-flex flex-wrap gap-2">
                          {visibleProgrammes.map((programme) => {
                            const programmeId = String(programme.id);
                            const checked = block.filiereIds.includes(programmeId);

                            return (
                              <button
                                key={programmeId}
                                type="button"
                                className={`btn btn-sm rounded-pill px-3 fw-bold transition-all ${checked ? "btn-dark-navy" : "btn-outline-secondary"
                                  }`}
                                onClick={() => toggleFiliere(block.id, programmeId)}
                              >
                                {checked && <i className="bi bi-check me-1"></i>}
                                {programme.code_diplome}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
                    <small className="text-muted">
                      <i className="bi bi-info-circle me-1"></i>
                      Les filières déjà attribuées dans un autre bloc sont masquées.
                    </small>
                    <button type="button" className="btn btn-sm btn-outline-primary rounded-pill" onClick={addBlock}>
                      <i className="bi bi-plus-lg me-1"></i>
                      Ajouter une autre filière
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Buttons */}
        <div className="d-flex gap-2 pt-3 border-top">
          <button
            className="btn btn-dark-navy rounded-pill px-4 fw-bold flex-grow-1"
            onClick={handleSaveClick}
            disabled={saving}
          >
            {saving ? (
              <span
                className="spinner-border spinner-border-sm me-2"
                role="status"
                aria-hidden="true"
              ></span>
            ) : (
              <i className="bi bi-check2-all me-2"></i>
            )}
            {prof ? "Enregistrer les modifications" : "Créer le Professeur"}
          </button>
          <button
            className="btn btn-outline-secondary rounded-pill px-4 fw-bold"
            onClick={onCancel}
            disabled={saving}
          >
            Annuler
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={prof ? "Confirmer la mise à jour" : "Confirmer la création"}
        message={prof ? "Save changes to this professor?" : "Créer ce professeur maintenant ?"}
        confirmLabel={prof ? "Mettre à jour" : "Créer"}
        variant="primary"
        onConfirm={handleSave}
        onCancel={() => {
          setConfirmOpen(false);
          setPendingPayload(null);
        }}
      />
    </div>
  );
}

// ── ProfsPage ────────────────────────────────────────────────────────────────
function ProfsPage() {
  const dispatch = useDispatch();
  const { items: profs, loading, error } = useSelector((state) => state.profs);
  const { items: secteurs } = useSelector((state) => state.secteurs);

  useEffect(() => {
    dispatch(fetchProfs());
    dispatch(fetchSecteurs());
  }, [dispatch]);

  const showToast = useToast();
  const [selectedProf, setSelectedProf] = useState(null); // null=hidden, false=new, obj=edit
  const [searchTerm, setSearchTerm] = useState("");
  const [actionError, setActionError] = useState(null);
  const [confirm, setConfirm] = useState({ open: false, id: null, name: "" });

  const filteredProfs = useMemo(
    () =>
      profs.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.email || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [profs, searchTerm],
  );

  const handleSave = async (payload) => {
    setActionError(null);
    let result;
    if (payload.id) {
      result = await dispatch(updateProf(payload));
    } else {
      result = await dispatch(createProf(payload));
    }
    if (result.error) {
      setActionError(result.payload || "Une erreur est survenue.");
      showToast(result.payload || "Une erreur est survenue.", "error");
    } else {
      showToast(payload.id ? "Professeur mis à jour avec succès." : "Professeur créé avec succès.", "success");
      setSelectedProf(null);
    }
  };

  const handleDelete = async () => {
    setActionError(null);
    const result = await dispatch(deleteProf(confirm.id));
    setConfirm({ open: false, id: null, name: "" });
    if (result.error) {
      showToast(result.payload || "Erreur lors de la suppression.", "error");
    } else {
      showToast("Professeur supprimé avec succès.", "success");
    }
  };

  return (
    <div className="container-xxl px-4 py-5">
      {/* Page header */}
      <div className="d-flex justify-content-between align-items-center mb-5 flex-wrap gap-3">
        <div>
          <div className="d-flex align-items-center gap-3 mb-2">
            <div className="page-icon-wrap">
              <i className="bi bi-person-gear"></i>
            </div>
            <h1 className="page-title mb-0">Gestion des Professeurs</h1>
          </div>
          <p className="body-sm mb-0">Créez les comptes professeurs et assignez-leur leurs filières.</p>
        </div>
        <button
          className="btn-navy d-flex align-items-center gap-2"
          onClick={() => { setSelectedProf(false); setActionError(null); }}
        >
          <i className="bi bi-plus-lg"></i>Ajouter un Professeur
        </button>
      </div>

      {/* Global error alert */}
      {actionError && (
        <div
          className="alert alert-danger alert-dismissible d-flex align-items-center mb-3 shadow-sm"
          role="alert"
        >
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          <div>{actionError}</div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setActionError(null)}
          ></button>
        </div>
      )}

      <div className="row g-4">
        {/* ── LEFT: List ── */}
        <div className={selectedProf !== null ? "col-lg-7" : "col-12"}>
          <div className="card-premium overflow-hidden">
            <div className="card-header py-3 px-4 d-flex justify-content-between align-items-center">
              <h5 className="section-title mb-0 d-flex align-items-center gap-3">
                <span className="avatar-circle avatar-sm avatar-navy">
                  <i className="bi bi-people-fill" style={{ fontSize: "0.75rem" }}></i>
                </span>
                Professeurs
              </h5>
              <span className="badge-soft badge-soft-primary">
                {filteredProfs.length} prof{filteredProfs.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Search */}
            <div className="px-3 pb-2 pt-2 border-bottom">
              <div className="input-group shadow-none rounded-pill overflow-hidden border">
                <span className="input-group-text bg-white border-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-0 bg-white"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ boxShadow: "none" }}
                />
              </div>
            </div>

            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5 text-muted">
                  <div
                    className="spinner-border text-dark-navy mb-3"
                    role="status"
                  ></div>
                  <p className="fw-medium">Chargement des professeurs…</p>
                </div>
              ) : filteredProfs.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <i className="bi bi-people fs-1 d-block mb-3 opacity-25"></i>
                  <p className="fw-medium">
                    {searchTerm
                      ? "Aucun résultat"
                      : 'Aucun professeur. Cliquez sur "Ajouter un Professeur".'}
                  </p>
                </div>
              ) : (
                <div className="table-responsive scroll-thin">
                  <table className="table align-middle mb-0 premium-table">
                    <thead>
                      <tr>
                        <th className="ps-4 py-3">Professeur</th>
                        <th className="py-3">Filières assignées</th>
                        <th className="py-3 text-end pe-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProfs.map((p) => {
                        const displayName = p.name || p.email || "—";
                        const profProgrammes = p.programmes || [];
                        return (
                          <tr key={p.id} className="prof-row">
                            <td className="ps-4">
                              <div className="d-flex align-items-center">
                                <div
                                  className="rounded-circle bg-dark-navy text-white d-flex align-items-center justify-content-center me-3 fw-bold flex-shrink-0"
                                  style={{ width: 38, height: 38, fontSize: 15 }}
                                >
                                  {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <div className="fw-bold text-dark">
                                    {displayName}
                                  </div>
                                  <small className="text-muted">{p.email}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              {profProgrammes.length > 0 ? (
                                <div className="d-flex flex-wrap gap-1">
                                  {profProgrammes.map((prog) => (
                                    <span
                                      key={prog.id}
                                      className="badge rounded-pill bg-dark-navy px-2"
                                      style={{ fontSize: "0.7rem" }}
                                    >
                                      {prog.code_diplome}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span
                                  className="badge rounded-pill bg-light text-muted border"
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  Toutes (sans restriction)
                                </span>
                              )}
                            </td>
                            <td className="text-end pe-4">
                              <div className="d-flex justify-content-end gap-2">
                                <button
                                  className="btn-action-round btn-edit shadow-sm"
                                  title="Modifier"
                                  onClick={() => {
                                    setSelectedProf(p);
                                    setActionError(null);
                                  }}
                                >
                                  <i className="bi bi-pencil-fill"></i>
                                </button>
                                <button
                                  className="btn-action-round btn-delete shadow-sm"
                                  title="Supprimer"
                                  onClick={() => setConfirm({ open: true, id: p.id, name: p.name || p.email || "ce professeur" })}
                                >
                                  <i className="bi bi-trash3-fill"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Form ── */}
        {selectedProf !== null && (
          <div className="col-lg-5">
            <ProfForm
              prof={selectedProf || null}
              secteurs={secteurs}
              onCancel={() => setSelectedProf(null)}
              onSave={handleSave}
            />
          </div>
        )}
      </div>

      <ConfirmModal
        open={confirm.open}
        title="Supprimer le professeur"
        message={`Supprimer ${confirm.name} ? Il ne pourra plus se connecter.`}
        confirmLabel="Supprimer"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, id: null, name: "" })}
      />

      <style>{`
        .bg-dark-navy { background-color: #0A121A; }
        .text-dark-navy { color: #0A121A; }
        .btn-dark-navy { background-color: #0A121A; border-color: #0A121A; color: #fff; transition: all 0.2s; }
        .btn-dark-navy:hover { background-color: #1a232f; color: #fff; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .btn-action-round { width: 34px; height: 34px; border-radius: 50%; border: none; display: flex; align-items: center; justify-content: center; transition: all 0.2s; font-size: 0.85rem; }
        .btn-edit { background-color: #fff; color: #0d6efd; border: 1px solid #e7f1ff; }
        .btn-edit:hover { background-color: #0d6efd; color: #fff; transform: scale(1.1); }
        .btn-delete { background-color: #fff; color: #dc3545; border: 1px solid #fceaea; }
        .btn-delete:hover { background-color: #dc3545; color: #fff; transform: scale(1.1); }
        .prof-row { transition: background 0.15s; }
        .prof-row:hover { background: #f8f9fa; }
        .transition-all { transition: all 0.2s ease-in-out; }
      `}</style>
    </div>
  );
}

export default ProfsPage;
