import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import { User, Mail, Lock, Phone, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signup } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      return toast.error("Please fill in required fields");
    }

    if (formData.password.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsLoading(true);
    try {
      const res = await signup(formData);

      if (res.success) {
        toast.success(res.message);
        navigate("/verify-otp", {
          state: { email: formData.email, type: "signup" },
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: () => {
      window.location.href = `${
        import.meta.env.VITE_API_URL || "http://localhost:5000"
      }/api/auth/google`;
    },
    onError: () => toast.error("Google Login Failed"),
  });

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gray-50 text-gray-900 overflow-hidden selection:bg-[#fc4a56]/30 selection:text-gray-900">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#fc4a56]/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Glassmorphic Auth Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gray-50/60 backdrop-blur-2xl border border-gray-200/80 shadow-2xl shadow-black/50 my-8">
        
        {/* Header / Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#fc4a56] to-rose-500 text-white shadow-lg shadow-[#fc4a56]/30 mb-4">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Create Account
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Join BuddyChat and connect with friends.
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-[#fc4a56]">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 text-gray-500" size={18} />
              <input
                type="text"
                name="fullName"
                placeholder="John Doe"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 text-gray-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4a56]/50 focus:border-[#fc4a56] transition-all disabled:opacity-50"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-[#fc4a56]">*</span>
            </label>
            <div className="relative flex items-center">
              <Mail className="absolute left-3.5 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 text-gray-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4a56]/50 focus:border-[#fc4a56] transition-all disabled:opacity-50"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Phone Number <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <div className="relative flex items-center">
              <Phone className="absolute left-3.5 text-gray-500" size={18} />
              <input
                type="tel"
                name="phone"
                placeholder="+1 234 567 8900"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 text-gray-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4a56]/50 focus:border-[#fc4a56] transition-all disabled:opacity-50"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Password <span className="text-[#fc4a56]">*</span>
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 text-gray-500" size={18} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/50 border border-gray-200 text-gray-900 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#fc4a56]/50 focus:border-[#fc4a56] transition-all disabled:opacity-50"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fc4a56] to-rose-600 hover:from-[#e03e49] hover:to-rose-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#fc4a56]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Create Account
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <span className="relative px-4 text-xs uppercase font-medium bg-gray-50 text-gray-400">
            OR
          </span>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-gray-100/50 hover:bg-gray-100 border border-gray-300/60 text-gray-800 font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Sign up with Google
        </button>

        {/* Footer Navigation */}
        <p className="mt-8 text-center text-sm text-gray-500">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-semibold text-[#fc4a56] hover:underline transition-all"
          >
            Sign In
          </Link>
        </p>

      </div>
    </div>
  );
};

export default SignupPage;