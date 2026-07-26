import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, User, KeyRound } from "lucide-react";
import toast from "react-hot-toast";

const RunLoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Hardcoded raw authentication for admin portal
    setTimeout(() => {
      if (formData.username === "taha" && formData.password === "password.11") {
        localStorage.setItem("buddychat_admin_auth", "true");
        toast.success("Welcome back, Admin");
        navigate("/run/Dashboard");
      } else {
        toast.error("Invalid admin credentials");
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
        <div className="bg-[#111827] p-8 text-white text-center">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-[#111827]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">System Admin</h1>
          <p className="text-gray-400 text-sm mt-1">Authorized personnel only</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="Enter raw username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <KeyRound className="w-5 h-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all text-gray-900"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 focus:ring-4 focus:ring-gray-900/20 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-900/30"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Access Dashboard"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RunLoginPage;
