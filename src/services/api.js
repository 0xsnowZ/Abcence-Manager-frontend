import axios from "axios";

// ─── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://web-production-09c0f.up.railway.app/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: true,
});

// ─── Request interceptor — attach Bearer token ─────────────────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("sanctum_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor — handle 401 globally ───────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale auth data and redirect to login
      localStorage.removeItem("sanctum_token");
      localStorage.removeItem("user");
      window.location.href = "/#/login";
    }
    return Promise.reject(error);
  }
);

export default api;
