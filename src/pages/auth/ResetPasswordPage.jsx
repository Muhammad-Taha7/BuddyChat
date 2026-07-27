import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Lock, ArrowRight, Loader2, MessageSquare, Key } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const ResetPasswordPage = () => {
  const [formData, setFormData] = useState({
    otp: "",
    newPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { resetPassword } = useAuthStore();
  
  const email = location.state?.email;

  useEffect(() => {
    if (!email) {
      toast.error("Invalid session. Please start over.");
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.otp || !formData.newPassword) {
      return toast.error("Please fill in all fields");
    }
    
    if (formData.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsLoading(true);
    try {
      const res = await resetPassword(email, formData.otp, formData.newPassword);

      if (res.success) {
        toast.success(res.message);
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-white text-gray-900 overflow-hidden selection:bg-black/30 selection:text-gray-900">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gray-100 rounded-full blur-[130px] pointer-events-none -z-10" />
      
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gray-50/60 backdrop-blur-2xl border border-gray-200/80 shadow-2xl shadow-black/50 my-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black text-white shadow-lg shadow-black/30 mb-4">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create New Password
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Enter the OTP sent to {email} and your new password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              Reset OTP
            </label>
            <div className="relative">
              <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="text"
                name="otp"
                placeholder="Enter 6-digit OTP"
                maxLength={6}
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 disabled:opacity-50"
                value={formData.otp}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                name="newPassword"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 disabled:opacity-50"
                value={formData.newPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Reset Password
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
