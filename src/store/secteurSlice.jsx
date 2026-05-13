import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

export const fetchSecteurs = createAsyncThunk(
  "secteurs/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get("/secteurs");
      return res.data.data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement");
    }
  }
);

export const fetchProgrammesBySecteur = createAsyncThunk(
  "secteurs/fetchProgrammes",
  async (secteurId, { rejectWithValue }) => {
    try {
      const res = await api.get(`/secteurs/${secteurId}/programmes`);
      return { secteurId, programmes: res.data.data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Erreur de chargement");
    }
  }
);

const secteurSlice = createSlice({
  name: "secteurs",
  initialState: {
    items: [],
    programmesBySecteur: {},
    loading: false,
    loadingProgrammes: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSecteurs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSecteurs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchSecteurs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchProgrammesBySecteur.pending, (state) => {
        state.loadingProgrammes = true;
      })
      .addCase(fetchProgrammesBySecteur.fulfilled, (state, action) => {
        state.loadingProgrammes = false;
        state.programmesBySecteur[action.payload.secteurId] = action.payload.programmes;
      })
      .addCase(fetchProgrammesBySecteur.rejected, (state, action) => {
        state.loadingProgrammes = false;
        state.error = action.payload;
      });
  },
});

export default secteurSlice;
