import { createSlice } from "@reduxjs/toolkit";

// Initial state — only admin is hardcoded; profs are managed in profSlice
const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedUser,
  error: null,
};

// Only the admin account is hardcoded
const mockAdmins = [
  {
    id: "admin-1",
    email: "admin@school.ma",
    password: "password",
    name: "Administrateur",
    role: "admin",
  },
];

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginStart: (state) => {
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.error = null;
      localStorage.setItem("user", JSON.stringify(action.payload));
    },
    loginFailure: (state, action) => {
      state.error = action.payload;
      state.isAuthenticated = false;
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      localStorage.removeItem("user");
    },
  },
});

export const { loginStart, loginSuccess, loginFailure, logout } =
  authSlice.actions;

// Thunk — checks admins first, then dynamic profs from profSlice
export const loginUser = (credentials) => async (dispatch, getState) => {
  dispatch(loginStart());

  return new Promise((resolve) => {
    setTimeout(() => {
      // 1. Check hardcoded admins
      const admin = mockAdmins.find(
        (u) =>
          u.email === credentials.email && u.password === credentials.password
      );
      if (admin) {
        const { password, ...safe } = admin;
        dispatch(loginSuccess(safe));
        resolve();
        return;
      }

      // 2. Check dynamic profs from Redux store
      const profs = getState().profs.items;
      const prof = profs.find(
        (p) =>
          p.email === credentials.email && p.password === credentials.password
      );
      if (prof) {
        const { password, ...safe } = prof;
        dispatch(loginSuccess({ ...safe, role: "prof" }));
        resolve();
        return;
      }

      dispatch(loginFailure("Email ou mot de passe incorrect"));
      resolve();
    }, 800);
  });
};

export default authSlice.reducer;
