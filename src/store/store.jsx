import { configureStore } from "@reduxjs/toolkit";
import absenceSlice from "./absenceSlice.jsx";
import stagiaireSlice from "./stagiaireSlice.jsx";
import authReducer from "./authSlice.jsx";
import profReducer from "./profSlice.jsx";

// Redux Store Configuration
const store = configureStore({
  reducer: {
    stagiaires: stagiaireSlice.reducer,
    absences: absenceSlice.reducer,
    auth: authReducer,
    profs: profReducer,
  },
});

export default store;

