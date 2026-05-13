import { createSlice } from "@reduxjs/toolkit";
import { initialAbsences } from "../utils/data.jsx";

// Absence Slice - Redux Toolkit
const absenceSlice = createSlice({
  name: "absences",
  initialState: {
    items: initialAbsences || [],
    loading: false,
    error: null,
    filter: "all", // 'all', 'justified', 'unjustified'
  },
  reducers: {
    addAbsence: (state, action) => {
      const newId =
        state.items.length > 0
          ? Math.max(...state.items.map((a) => a.id)) + 1
          : 1;
      state.items.push({
        ...action.payload,
        id: newId,
      });
    },
    updateAbsence: (state, action) => {
      const index = state.items.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteAbsence: (state, action) => {
      state.items = state.items.filter((a) => a.id !== action.payload);
    },
    setAbsences: (state, action) => {
      state.items = action.payload;
    },
    setFilter: (state, action) => {
      state.filter = action.payload;
    },
  },
});

export const {
  addAbsence,
  updateAbsence,
  deleteAbsence,
  setAbsences,
  setFilter,
} = absenceSlice.actions;
export default absenceSlice;
