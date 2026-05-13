import { configureStore } from "@reduxjs/toolkit";
import absenceSlice from "./absenceSlice.jsx";
import stagiaireSlice from "./stagiaireSlice.jsx";
import authReducer from "./authSlice.jsx";
import profSlice from "./profSlice.jsx";
import programmeSlice from "./programmeSlice.jsx";
import sessionSlice from "./sessionSlice.jsx";
import secteurSlice from "./secteurSlice.jsx";

const store = configureStore({
  reducer: {
    stagiaires: stagiaireSlice.reducer,
    absences: absenceSlice.reducer,
    auth: authReducer,
    profs: profSlice.reducer,
    programmes: programmeSlice.reducer,
    sessions: sessionSlice.reducer,
    secteurs: secteurSlice.reducer,
  },
});

export default store;
