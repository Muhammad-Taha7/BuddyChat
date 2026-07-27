import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGoogleLogin } from "@react-oauth/google";
import { toast } from "react-hot-toast";
import { Mail, Lock, ArrowRight, Loader2, MessageSquare } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return toast.error("Please fill in all fields");
    }

    setIsLoading(true);
    try {
      const res = await login(formData);

      if (res.success) {
        toast.success(res.message);

        if (res.data?.requiresVerification) {
          navigate("/verify-otp", {
            state: { email: formData.email, type: "signup" },
          });
        } else {
          navigate("/chat");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-white text-gray-900 overflow-hidden selection:bg-black/30 selection:text-gray-900">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gray-100 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 left-10 w-[350px] h-[350px] bg-gray-100 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Authentication Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gray-50/60 backdrop-blur-2xl border border-gray-200/80 shadow-2xl shadow-black/50 my-8">
        
        {/* Header / Brand Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-black text-white shadow-lg shadow-black/30 mb-4">
            <MessageSquare size={28} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            BuddyChat
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Welcome back! Let's get you chatting.
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 disabled:opacity-50"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-white/60 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-slate-500 transition-all duration-200 focus:outline-none focus:border-black focus:ring-2 focus:ring-black/20 disabled:opacity-50"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Link to="/forgot-password" className="text-xs font-semibold text-gray-600 hover:text-black transition-colors">
                Forgot Password?
              </Link>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-black hover:bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-black/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                Sign In
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="w-full border-t border-gray-200" />
          <span className="absolute bg-white px-3 text-xs uppercase text-gray-400 font-semibold tracking-wider">
            OR
          </span>
        </div>

        {/* Google Login Button */}
        <button
          type="button"
          onClick={() => googleLogin()}
          disabled={isLoading}
          className="w-full py-3 px-4 rounded-xl bg-white/80 hover:bg-gray-100/80 border border-gray-200 text-gray-800 font-medium text-sm flex items-center justify-center gap-3 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
          Sign in with Google
        </button>

        {/* Footer Link */}
        <div className="mt-8 text-center text-sm text-gray-500">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="font-semibold text-black hover:underline transition-all ml-1"
          >
            Sign Up
          </Link>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;