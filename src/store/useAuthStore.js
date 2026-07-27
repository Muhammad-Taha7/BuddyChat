import { create } from "zustand";
import axios from "../lib/axios";

// ─── Decode JWT expiry WITHOUT a library (base64 decode) ──
const getTokenExpiry = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? payload.exp * 1000 : null; // convert to ms
  } catch {
    return null;
  }
};

let _logoutTimer = null;

const scheduleAutoLogout = (token, logoutFn) => {
  if (_logoutTimer) clearTimeout(_logoutTimer);

  const expiry = getTokenExpiry(token);
  if (!expiry) return;

  const msUntilExpiry = expiry - Date.now();
  if (msUntilExpiry <= 0) {
    // Already expired
    logoutFn();
    return;
  }

  console.log(`[Auth] Token expires in ${Math.round(msUntilExpiry / 60000)} min — auto-logout scheduled.`);
  _logoutTimer = setTimeout(() => {
    console.log("[Auth] Token expired — auto-logging out.");
    logoutFn();
  }, msUntilExpiry);
};

const clearAutoLogoutTimer = () => {
  if (_logoutTimer) {
    clearTimeout(_logoutTimer);
    _logoutTimer = null;
  }
};

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isLoading: true,
  isAuthenticated: false,

  // ─── Set auth data + schedule auto-logout ───
  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token, isAuthenticated: true, isLoading: false });

    // Schedule auto-logout when token expires
    scheduleAutoLogout(token, () => {
      get().clearAuth();
      // Redirect to login — use window.location for simplicity
      window.location.href = "/login";
    });
  },

  // ─── Clear auth ──────────────────────────────
  clearAuth: () => {
    clearAutoLogoutTimer();
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  // ─── Check auth on app load ──────────────────
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    // Check if already expired before hitting the server
    const expiry = getTokenExpiry(token);
    if (expiry && expiry <= Date.now()) {
      console.log("[Auth] Stored token is already expired — clearing.");
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await axios.get("/api/auth/me");
      const user = res.data.data.user;
      set({ user, token, isAuthenticated: true, isLoading: false });

      // Re-schedule auto-logout using existing token
      scheduleAutoLogout(token, () => {
        get().clearAuth();
        window.location.href = "/login";
      });
    } catch (error) {
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  // ─── Update user profile data ────────────────
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },

  // ─── Signup ──────────────────────────────────
  signup: async (formData) => {
    const res = await axios.post("/api/auth/signup", formData);
    return res.data;
  },

  // ─── Login ───────────────────────────────────
  login: async (formData) => {
    const res = await axios.post("/api/auth/login", formData);
    if (res.data.success && res.data.data?.token) {
      const { user, token } = res.data.data;
      get().setAuth(user, token);
    }
    return res.data;
  },

  // ─── Verify OTP ──────────────────────────────
  verifyOtp: async (email, otp) => {
    const res = await axios.post("/api/auth/verify-otp", { email, otp });
    if (res.data.success && res.data.data.token) {
      const { user, token } = res.data.data;
      get().setAuth(user, token); // ← uses setAuth which schedules auto-logout
    }
    return res.data;
  },

  // ─── Resend OTP ──────────────────────────────
  resendOtp: async (email, type) => {
    const res = await axios.post("/api/auth/resend-otp", { email, type });
    return res.data;
  },

  // ─── Forgot Password ─────────────────────────
  forgotPassword: async (email) => {
    const res = await axios.post("/api/auth/forgot-password", { email });
    return res.data;
  },

  // ─── Reset Password ──────────────────────────
  resetPassword: async (email, otp, newPassword) => {
    const res = await axios.post("/api/auth/reset-password", { email, otp, newPassword });
    return res.data;
  },

  // ─── Logout ──────────────────────────────────
  logout: async () => {
    try {
      await axios.post("/api/auth/logout");
    } catch {
      // Ignore errors
    }
    get().clearAuth();
  },
}));

export default useAuthStore;
