import axios from "axios";

// Create an Axios instance with base URL and credentials
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Request interceptor to add token from localStorage if available
axiosInstance.interceptors.request.use(
  (config) => {
    const isAdminPortal = window.location.pathname.startsWith("/run");
    const token = isAdminPortal 
      ? (localStorage.getItem("buddychat_admin_token") || localStorage.getItem("token"))
      : (localStorage.getItem("token") || localStorage.getItem("buddychat_admin_token"));
      
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
