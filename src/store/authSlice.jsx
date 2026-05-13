import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../services/api.js";

// ─── Thunks ────────────────────────────────────────────────────────────────────

/** POST /api/login */
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await api.post("/login", credentials);
      const { token, user } = response.data;
      localStorage.setItem("sanctum_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      return user;
    } catch (err) {
      const message =
        err.response?.data?.errors?.email?.[0] ||
        err.response?.data?.message ||
        "Email ou mot de passe incorrect";
      return rejectWithValue(message);
    }
  }
);

/** DELETE /api/logout */
export const logoutUser = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await api.delete("/logout");
    } catch (_err) {
      // Ignore errors on logout — clear locally regardless
    } finally {
      localStorage.removeItem("sanctum_token");
      localStorage.removeItem("user");
    }
  }
);

// ─── Initial state ─────────────────────────────────────────────────────────────
const storedUser = localStorage.getItem("user");

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!localStorage.getItem("sanctum_token"),
  loading: false,
  error: null,
};

// ─── Slice ─────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /** Synchronous logout (used by 401 interceptor redirect) */
    clearAuth: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.error = null;
      localStorage.removeItem("sanctum_token");
      localStorage.removeItem("user");
    },
  },
  extraReducers: (builder) => {
    // loginUser
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      });

    // logoutUser
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        // Still clear auth even if API call failed
        state.loading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearAuth } = authSlice.actions;
export default authSlice.reducer;
