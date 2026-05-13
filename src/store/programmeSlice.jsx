import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

/** GET /api/programmes?per_page=200 */
export const fetchProgrammes = createAsyncThunk(
  "programmes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/programmes", { params: { per_page: 200 } });
      return response.data.data.data ?? response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement des programmes");
    }
  }
);

/** GET /api/programmes/:id/stagiaires */
export const fetchProgrammeStagiaires = createAsyncThunk(
  "programmes/fetchStagiaires",
  async (programmeId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/programmes/${programmeId}/stagiaires`, {
        params: { per_page: 500 },
      });
      const raw = response.data.data.data ?? response.data.data;
      // Attach programme_id to each stagiaire for reference
      return { programmeId, stagiaires: raw };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement des stagiaires");
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const programmeSlice = createSlice({
  name: "programmes",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgrammes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgrammes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProgrammes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default programmeSlice;
