import React, { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Mail, Lock, ArrowRight, Loader2, MessageSquare, Zap } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading: authLoading } = useAuthStore();

  // If already authenticated, redirect to chat
  if (!authLoading && isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

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

  return (
    <div className="min-h-screen w-full flex bg-white text-gray-900 overflow-hidden selection:bg-gray-200 selection:text-gray-900">
      
      {/* LEFT SIDE: Black Background with Animated Big Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white border-r border-gray-800 flex-col justify-between p-12 relative overflow-hidden">
        
        {/* Animated Background Glow Accents */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gray-800/40 blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gray-800/40 blur-3xl pointer-events-none animate-pulse" />

        {/* Top Brand Logo */}
        <div className="flex items-center gap-3 text-white font-extrabold text-xl tracking-tight z-10">
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center rounded-lg shadow-lg hover:scale-105 transition-transform duration-300">
            <MessageSquare size={22} />
          </div>
          <span>BuddyChat</span>
        </div>

        {/* Middle Illustration Image (Bigger + Animated) */}
        <div className="my-auto z-10 flex justify-center items-center p-2 relative group">
          {/* Backlight Glow for Image */}
          <div className="absolute w-72 h-72 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all duration-500" />
          
          <img
            src="https://cdni.iconscout.com/illustration/premium/thumb/chatting-illustration-svg-download-png-4912113.png?f=webp"
            alt="Chatting Illustration"
            className="w-full max-w-lg max-h-[520px] object-contain drop-shadow-[0_20px_50px_rgba(255,255,255,0.15)] animate-bounce duration-1000 transition-all hover:scale-105"
            style={{ animation: 'float 4s ease-in-out infinite' }}
          />
        </div>

        {/* Custom CSS Animation Keyframes */}
        <style>{`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px) scale(1);
            }
            50% {
              transform: translateY(-15px) scale(1.02);
            }
          }
        `}</style>

        {/* Bottom Feature Badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400 font-medium z-10">
          <span className="flex items-center gap-1.5">
            <Zap size={14} className="text-white" /> Ultra Fast
          </span>
          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
          <span>Encrypted</span>
          <span className="w-1.5 h-1.5 bg-gray-600 rounded-full" />
          <span>Clean UI</span>
        </div>
      </div>

      {/* RIGHT SIDE: Complete Login Form Section */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md p-6 sm:p-10 bg-white border border-gray-200 rounded-2xl shadow-sm">
          
          {/* Header / Brand Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white rounded-xl mb-4 shadow-md">
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
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 rounded-xl transition-all duration-200 focus:outline-none focus:border-black focus:bg-white disabled:opacity-50"
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
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder-gray-400 rounded-xl transition-all duration-200 focus:outline-none focus:border-black focus:bg-white disabled:opacity-50"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="flex justify-end pt-1">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-gray-600 hover:text-black transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-md"
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

    </div>
  );
};

export default LoginPage;