import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

/** GET /api/attendances?per_page=500 */
export const fetchAttendances = createAsyncThunk(
  "absences/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.get("/attendances", {
        params: { per_page: 500, ...params },
      });
      return response.data.data.data ?? response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement des absences");
    }
  }
);

/**
 * POST /api/attendances/bulk
 * payload: { session_id, recorded_by, attendances: [{ stagiaire_id, type_absence_id, justification? }] }
 */
export const bulkSubmitAttendances = createAsyncThunk(
  "absences/bulkSubmit",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/attendances/bulk", payload);
      return response.data.data.attendances;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur d'enregistrement");
    }
  }
);

/** PUT /api/attendances/:id — update justification */
export const updateAttendance = createAsyncThunk(
  "absences/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/attendances/${id}`, payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de mise à jour");
    }
  }
);

/** DELETE /api/attendances/:id */
export const deleteAttendance = createAsyncThunk(
  "absences/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/attendances/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de suppression");
    }
  }
);

// ─── Helper: normalize backend attendance to frontend shape ───────────────────
// Backend Attendance: { id, session_id, stagiaire_id, type_absence_id, justification,
//                       session: { date_session, programme_id, time_block_id },
//                       stagiaire: { id, nom, prenom },
//                       typeAbsence: { code, libelle } }
// Frontend absence: { id, idstag, date, justifie, heures, slots, typeCode }
export const normalizeAttendance = (a) => ({
  id: a.id,
  idstag: a.stagiaire_id,
  stagiaireNom: a.stagiaire ? `${a.stagiaire.prenom} ${a.stagiaire.nom}` : "",
  date: a.session?.date_session || "",
  session_id: a.session_id,
  time_block_id: a.session?.time_block_id || null,
  justifie: !!a.justification,
  justification: a.justification || "",
  heures: 2.5, // each attendance = 1 time block = 2.5h
  typeCode: a.typeAbsence?.code || "ABSENT",
  type_absence_id: a.type_absence_id,
  recorded_by: a.recorded_by,
});

// ─── Slice ─────────────────────────────────────────────────────────────────────
const absenceSlice = createSlice({
  name: "absences",
  initialState: {
    items: [],
    loading: false,
    error: null,
    filter: "all", // 'all', 'justified', 'unjustified'
  },
  reducers: {
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
    setAbsences: (state, action) => {
      state.items = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchAttendances
    builder
      .addCase(fetchAttendances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendances.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAttendances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // bulkSubmitAttendances
    builder
      .addCase(bulkSubmitAttendances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkSubmitAttendances.fulfilled, (state, action) => {
        state.loading = false;
        // Merge new attendances into items (upsert by id)
        if (action.payload) {
          action.payload.forEach((newItem) => {
            const idx = state.items.findIndex((a) => a.id === newItem.id);
            if (idx !== -1) {
              state.items[idx] = newItem;
            } else {
              state.items.push(newItem);
            }
          });
        }
      })
      .addCase(bulkSubmitAttendances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // updateAttendance
    builder
      .addCase(updateAttendance.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.error = action.payload;
      });

    // deleteAttendance
    builder
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setFilter, setAbsences } = absenceSlice.actions;
export default absenceSlice;
