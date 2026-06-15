import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

/** GET /api/stagiaires — fetches all pages */
export const fetchStagiaires = createAsyncThunk(
  "stagiaires/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      let all = [];
      let page = 1;
      while (true) {
        const response = await api.get("/stagiaires", { params: { per_page: 500, page } });
        const payload  = response.data.data;
        const items    = payload.data ?? payload;
        all = all.concat(items);
        if (!payload.next_page_url) break;
        page++;
      }
      return all;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement");
    }
  }
);

/** POST /api/stagiaires */
export const createStagiaire = createAsyncThunk(
  "stagiaires/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/stagiaires", payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de création");
    }
  }
);

/** PUT /api/stagiaires/:id */
export const updateStagiaire = createAsyncThunk(
  "stagiaires/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/stagiaires/${id}`, payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de mise à jour");
    }
  }
);

/** POST /api/stagiaires/upsert-from-excel — upsert without deleting */
export const importStagiairesFromExcel = createAsyncThunk(
  "stagiaires/importFromExcel",
  async (stagiaires, { rejectWithValue }) => {
    try {
      const response = await api.post("/stagiaires/upsert-from-excel", { stagiaires });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur d'import");
    }
  }
);

/** POST /api/import-stagiaires/replace — deletes all stagiaires + attendances + inscriptions first */
export const importReplaceStagiaires = createAsyncThunk(
  "stagiaires/importReplace",
  async (stagiaires, { rejectWithValue }) => {
    try {
      const response = await api.post("/import-stagiaires/replace", { stagiaires });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de remplacement");
    }
  }
);

/** DELETE /api/stagiaires/:id */
export const deleteStagiaire = createAsyncThunk(
  "stagiaires/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/stagiaires/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de suppression");
    }
  }
);

// ─── Helper: normalize backend stagiaire to frontend shape ────────────────────
// Backend: { id, matricule, nom, prenom, sexe, ... }
// Frontend: { id, matricule, nom (full), prenom, sexe, filiere (from programme) }
export const normalizeStagiaire = (s) => ({
  id: s.id,
  matricule: s.matricule,
  nom: s.nom,
  prenom: s.prenom,
  nomComplet: `${s.nom} ${s.prenom}`,
  sexe: s.sexe || "m",
  filiere: s.filiere || s.programme_code || "",
  programmes: s.programmes || [],
  cin: s.cin || "",
  telephone: s.telephone || s.tel || "",
});

// Sort stagiaires alphabetically: nom (family name) then prenom
const sortStagiaires = (items) =>
  [...items].sort((a, b) => {
    const cmp = (a.nom || "").localeCompare(b.nom || "", "fr", { sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return (a.prenom || "").localeCompare(b.prenom || "", "fr", { sensitivity: "base" });
  });

// ─── Slice ─────────────────────────────────────────────────────────────────────
const stagiaireSlice = createSlice({
  name: "stagiaires",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {
    setStagiaires: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchStagiaires
    builder
      .addCase(fetchStagiaires.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStagiaires.fulfilled, (state, action) => {
        state.loading = false;
        state.items = sortStagiaires(action.payload);
      })

      .addCase(fetchStagiaires.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createStagiaire
    builder
      .addCase(createStagiaire.pending, (state) => { state.error = null; })
      .addCase(createStagiaire.fulfilled, (state, action) => {
        state.items = sortStagiaires([...state.items, normalizeStagiaire(action.payload)]);
      })
      .addCase(createStagiaire.rejected, (state, action) => {
        state.error = action.payload;
      });

    // updateStagiaire
    builder
      .addCase(updateStagiaire.pending, (state) => { state.error = null; })
      .addCase(updateStagiaire.fulfilled, (state, action) => {
        const idx = state.items.findIndex((s) => s.id === action.payload.id);
        if (idx !== -1) state.items[idx] = normalizeStagiaire(action.payload);
        state.items = sortStagiaires(state.items);
      })
      .addCase(updateStagiaire.rejected, (state, action) => {
        state.error = action.payload;
      });

    // deleteStagiaire
    builder
      .addCase(deleteStagiaire.fulfilled, (state, action) => {
        state.items = state.items.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteStagiaire.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setStagiaires } = stagiaireSlice.actions;
export default stagiaireSlice;
