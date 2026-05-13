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
 * Find or create a session for a given (programme_id, date_session, time_block_id).
 * Returns the session object.
 */
export const findOrCreateSession = createAsyncThunk(
  "sessions/findOrCreate",
  async ({ programme_id, date_session, time_block_id, created_by }, { rejectWithValue }) => {
    try {
      // Try to find existing session
      const listResp = await api.get(`/programmes/${programme_id}/sessions`, {
        params: { per_page: 500 },
      });
      const sessions = listResp.data.data.data ?? listResp.data.data;
      const existing = sessions.find(
        (s) =>
          s.date_session === date_session &&
          s.time_block_id === time_block_id
      );
      if (existing) return existing;

      // Create new session
      const createResp = await api.post("/sessions", {
        programme_id,
        date_session,
        time_block_id,
        created_by: created_by || null,
      });
      return createResp.data.data;
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
