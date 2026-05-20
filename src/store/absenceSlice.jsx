import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

export const fetchAttendances = createAsyncThunk(
  "absences/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      let all  = [];
      let page = 1;
      while (true) {
        const response = await api.get("/attendances", {
          params: { per_page: 500, page, ...params },
        });
        const payload = response.data.data;
        const items   = payload.data ?? payload;
        all = all.concat(Array.isArray(items) ? items : []);
        if (!payload.next_page_url) break;
        page++;
      }
      return all;
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

/** POST /api/attendances — create new attendance */
export const createAttendance = createAsyncThunk(
  "absences/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/attendances", payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de création");
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

/** PATCH /api/attendances/:id/status — update absence status */
export const updateAttendanceStatus = createAsyncThunk(
  "absences/updateStatus",
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await api.patch(`/attendances/${id}/status`, { status });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de mise à jour du statut");
    }
  }
);

// ─── Helper: normalize backend attendance to frontend shape ───────────────────
// Backend Attendance: { id, session_id, stagiaire_id, type_absence_id, status,
//                       created_by_user_id, updated_by_user_id, created_at, updated_at,
//                       justification, justified_at, recorded_by, recorded_at,
//                       session: { date_session, programme_id, time_block_id },
//                       stagiaire: { id, nom, prenom },
//                       typeAbsence: { code, libelle },
//                       createdByUser: { id, name, email },
//                       updatedByUser: { id, name, email } }
// Frontend absence: { id, idstag, date, status, createdByUser, updatedByUser,
//                     created_at, updated_at, justifie, justification, heures, typeCode }
export const normalizeAttendance = (a) => ({
  id: a.id,
  idstag: a.stagiaire_id,
  stagiaireNom: a.stagiaire ? `${a.stagiaire.nom} ${a.stagiaire.prenom}` : "",
  date: a.session?.date_session || a.date || "",
  session_id: a.session_id,
  time_block_id: a.session?.time_block_id || a.time_block_id || null,
  timeBlock: a.session?.time_block ?? a.session?.timeBlock ?? a.timeBlock ?? null,
  session: a.session || null,
  status: a.status || "non_justifie",
  justifie: a.status === "justifie" || !!a.justification,
  justification: a.justification || "",
  justified_at: a.justified_at,
  heures: 2.5, // each attendance = 1 time block = 2.5h
  typeCode: a.typeAbsence?.code || "ABSENT",
  type_absence_id: a.type_absence_id,
  recorded_by: a.recorded_by,
  recorded_at: a.recorded_at,
  created_at: a.created_at,
  updated_at: a.updated_at,
  created_by_user_id: a.created_by_user_id,
  updated_by_user_id: a.updated_by_user_id,
  createdByUser: a.createdByUser ?? a.created_by_user,
  updatedByUser: a.updatedByUser ?? a.updated_by_user,
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
        state.items = action.payload.map(normalizeAttendance);
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
            const normalized = normalizeAttendance(newItem);
            const idx = state.items.findIndex((a) => a.id === normalized.id);
            if (idx !== -1) {
              state.items[idx] = normalized;
            } else {
              state.items.push(normalized);
            }
          });
        }
      })
      .addCase(bulkSubmitAttendances.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createAttendance
    builder
      .addCase(createAttendance.pending, (state) => { state.error = null; })
      .addCase(createAttendance.fulfilled, (state, action) => {
        state.items.push(normalizeAttendance(action.payload));
      })
      .addCase(createAttendance.rejected, (state, action) => {
        state.error = action.payload;
      });

    // updateAttendance
    builder
      .addCase(updateAttendance.pending, (state) => { state.error = null; })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) state.items[idx] = normalizeAttendance(action.payload);
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.error = action.payload;
      });

    // deleteAttendance
    builder
      .addCase(deleteAttendance.pending, (state) => { state.error = null; })
      .addCase(deleteAttendance.fulfilled, (state, action) => {
        state.items = state.items.filter((a) => a.id !== action.payload);
      })
      .addCase(deleteAttendance.rejected, (state, action) => {
        state.error = action.payload;
      });

    // updateAttendanceStatus
    builder
      .addCase(updateAttendanceStatus.pending, (state) => { state.error = null; })
      .addCase(updateAttendanceStatus.fulfilled, (state, action) => {
        const idx = state.items.findIndex((a) => a.id === action.payload.id);
        if (idx !== -1) {
          state.items[idx] = normalizeAttendance(action.payload);
        }
      })
      .addCase(updateAttendanceStatus.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setFilter, setAbsences } = absenceSlice.actions;
export default absenceSlice;
