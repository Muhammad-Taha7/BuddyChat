import { create } from "zustand";
import axios from "../lib/axios";

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  isLoading: true,
  isAuthenticated: false,

  // Set auth data
  setAuth: (user, token) => {
    localStorage.setItem("token", token);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  // Clear auth
  clearAuth: () => {
    localStorage.removeItem("token");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  // Check auth on app load
  checkAuth: async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      set({ isLoading: false });
      return;
    }

    try {
      const res = await axios.get("/api/auth/me");
      set({
        user: res.data.data.user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      localStorage.removeItem("token");
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  // Update user profile data
  updateUser: (userData) => {
    set((state) => ({
      user: { ...state.user, ...userData },
    }));
  },

  // Signup
  signup: async (formData) => {
    const res = await axios.post("/api/auth/signup", formData);
    return res.data;
  },

  // Login
  login: async (formData) => {
    const res = await axios.post("/api/auth/login", formData);
    return res.data;
  },

  // Verify OTP
  verifyOtp: async (email, otp) => {
    const res = await axios.post("/api/auth/verify-otp", { email, otp });
    if (res.data.success && res.data.data.token) {
      const { user, token } = res.data.data;
      get().setAuth(user, token);
    }
    return res.data;
  },

  // Resend OTP
  resendOtp: async (email, type) => {
    const res = await axios.post("/api/auth/resend-otp", { email, type });
    return res.data;
  },

  // Logout
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
