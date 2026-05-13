import { createSlice } from "@reduxjs/toolkit";
import { initialStagiaires } from "../utils/data.jsx";

// Stagiaire Slice - Redux Toolkit
const stagiaireSlice = createSlice({
  name: "stagiaires",
  initialState: {
    items: initialStagiaires || [],
    loading: false,
    error: null,
  },
  reducers: {
    addStagiaire: (state, action) => {
      const newId =
        state.items.length > 0
          ? Math.max(...state.items.map((s) => s.id)) + 1
          : 1;
      state.items.push({
        ...action.payload,
        id: newId,
      });
    },
    updateStagiaire: (state, action) => {
      const index = state.items.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteStagiaire: (state, action) => {
      state.items = state.items.filter((s) => s.id !== action.payload);
    },
    setStagiaires: (state, action) => {
      state.items = action.payload;
    },
  },
});

export const { addStagiaire, updateStagiaire, deleteStagiaire, setStagiaires } =
  stagiaireSlice.actions;
export default stagiaireSlice;
