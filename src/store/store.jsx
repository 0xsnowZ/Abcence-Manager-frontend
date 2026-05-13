import { configureStore } from "@reduxjs/toolkit";
import absenceSlice from "./absenceSlice.jsx";
import stagiaireSlice from "./stagiaireSlice.jsx";
import authReducer from "./authSlice.jsx";
import profReducer from "./profSlice.jsx";
import programmeSlice from "./programmeSlice.jsx";
import sessionSlice from "./sessionSlice.jsx";

const store = configureStore({
  reducer: {
    stagiaires: stagiaireSlice.reducer,
    absences: absenceSlice.reducer,
    auth: authReducer,
    profs: profReducer,
    programmes: programmeSlice.reducer,
    sessions: sessionSlice.reducer,
  },
});

export default store;
