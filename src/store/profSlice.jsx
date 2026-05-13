import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

/** GET /api/users?role=prof */
export const fetchProfs = createAsyncThunk(
  "profs/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get("/users", { params: { role: "prof" } });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement des profs");
    }
  }
);

/** POST /api/users */
export const createProf = createAsyncThunk(
  "profs/create",
  async (payload, { rejectWithValue }) => {
    try {
      const response = await api.post("/users", { ...payload, role: "prof" });
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de création");
    }
  }
);

/** PUT /api/users/:id */
export const updateProf = createAsyncThunk(
  "profs/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/users/${id}`, payload);
      return response.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de mise à jour");
    }
  }
);

/** DELETE /api/users/:id */
export const deleteProf = createAsyncThunk(
  "profs/delete",
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/users/${id}`);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de suppression");
    }
  }
);

// ─── Slice ─────────────────────────────────────────────────────────────────────
const profSlice = createSlice({
  name: "profs",
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    // fetchProfs
    builder
      .addCase(fetchProfs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProfs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // createProf
    builder
      .addCase(createProf.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })
      .addCase(createProf.rejected, (state, action) => {
        state.error = action.payload;
      });

    // updateProf
    builder
      .addCase(updateProf.fulfilled, (state, action) => {
        const idx = state.items.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
      })
      .addCase(updateProf.rejected, (state, action) => {
        state.error = action.payload;
      });

    // deleteProf
    builder
      .addCase(deleteProf.fulfilled, (state, action) => {
        state.items = state.items.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProf.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export default profSlice.reducer;
