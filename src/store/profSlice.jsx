import { createSlice } from "@reduxjs/toolkit";

// Load persisted profs from localStorage
const loadProfs = () => {
  try {
    const stored = localStorage.getItem("profs");
    if (stored) return JSON.parse(stored);
  } catch (_) {}
  // Seed: migrate the old hardcoded teacher
  return [
    {
      id: 1,
      nom: "Professeur Demo",
      email: "teacher@school.ma",
      password: "password",
      filieres: [],
    },
  ];
};

const saveProfs = (items) => {
  localStorage.setItem("profs", JSON.stringify(items));
};

const profSlice = createSlice({
  name: "profs",
  initialState: {
    items: loadProfs(),
  },
  reducers: {
    addProf: (state, action) => {
      const newId =
        state.items.length > 0
          ? Math.max(...state.items.map((p) => p.id)) + 1
          : 1;
      const prof = { ...action.payload, id: newId };
      state.items.push(prof);
      saveProfs(state.items);
    },
    updateProf: (state, action) => {
      const idx = state.items.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = action.payload;
        saveProfs(state.items);
      }
    },
    deleteProf: (state, action) => {
      state.items = state.items.filter((p) => p.id !== action.payload);
      saveProfs(state.items);
    },
  },
});

export const { addProf, updateProf, deleteProf } = profSlice.actions;
export default profSlice.reducer;
