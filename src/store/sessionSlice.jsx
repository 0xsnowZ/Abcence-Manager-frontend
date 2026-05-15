import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

/** GET /api/time-blocks */
export const fetchTimeBlocks = createAsyncThunk(
  "sessions/fetchTimeBlocks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/time-blocks");
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement des créneaux");
    }
  }
);

/** GET /api/programmes/:id/sessions */
export const fetchSessionsByProgramme = createAsyncThunk(
  "sessions/fetchByProgramme",
  async (programmeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/programmes/${programmeId}/sessions`, {
        params: { per_page: 500 },
      });
      return response.data.data.data ?? response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement des sessions");
    }
  }
);

/**
 * BUG-01: Find or create a session using the new atomic backend endpoint.
 * Replaces the old 2-call pattern (GET all sessions + conditionally POST)
 * with a single POST that handles the find-or-create atomically in a DB transaction.
 */
export const findOrCreateSession = createAsyncThunk(
  "sessions/findOrCreate",
  async ({ programme_id, date_session, time_block_id, created_by }, { rejectWithValue }) => {
    try {
      const response = await api.post("/sessions/find-or-create", {
        classe_id: programme_id,
        date_session,
        time_block_id,
        created_by: created_by ? String(created_by) : null,
      });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de création de session");
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const sessionSlice = createSlice({
  name: "sessions",
  initialState: {
    items: [],
    timeBlocks: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetchTimeBlocks
    builder
      .addCase(fetchTimeBlocks.fulfilled, (state, action) => {
        state.timeBlocks = action.payload;
      });

    // fetchSessionsByProgramme
    builder
      .addCase(fetchSessionsByProgramme.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSessionsByProgramme.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSessionsByProgramme.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // findOrCreateSession
    builder
      .addCase(findOrCreateSession.fulfilled, (state, action) => {
        const exists = state.items.find((s) => s.id === action.payload.id);
        if (!exists) state.items.push(action.payload);
      });
  },
});

export default sessionSlice;
