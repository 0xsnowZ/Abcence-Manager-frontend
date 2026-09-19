import axios from "axios";

const configuredApiUrl = "http://localhost:8000/api";
const apiBaseUrl = configuredApiUrl.replace(/\/+$/, "").endsWith("/api")
  ? configuredApiUrl
  : `${configuredApiUrl.replace(/\/+$/, "")}/api`;

// ─── Axios instance ────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  // withCredentials is NOT needed for Bearer token auth (Sanctum token in localStorage).
  // Enabling it forces the browser to send an OPTIONS preflight that requires
  // Access-Control-Allow-Credentials: true, which breaks with wildcard origins.
  withCredentials: false,
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
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;
