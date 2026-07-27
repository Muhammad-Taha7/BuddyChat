import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { toast } from "react-hot-toast";
import { User, Mail, Lock, Phone, ArrowRight, Loader2, MessageSquare, ShieldCheck, Zap, UserPlus } from "lucide-react";
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



  return (
    <div className="min-h-screen w-full flex bg-white text-gray-900 overflow-hidden selection:bg-gray-200 selection:text-gray-900">
      
      {/* LEFT SIDE: Black Background with White Text & Animated Graphics (Hidden on Mobile, Visible on Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-black text-white border-r border-gray-800 flex-col justify-between p-12 relative overflow-hidden">
        
        {/* Dark glow accent */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gray-800/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-gray-800/30 blur-3xl pointer-events-none" />

        {/* Top Brand Tag */}
        <div className="flex items-center gap-3 text-white font-extrabold text-xl tracking-tight z-10">
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center">
            <MessageSquare size={22} />
          </div>
          <span>BuddyChat</span>
        </div>

        {/* Middle Animated Graphic Component */}
        <div className="my-auto z-10 flex flex-col items-center text-center">
          <div className="relative w-72 h-72 mb-8 flex items-center justify-center">
            
            {/* Animated SVG Graphic Elements */}
            <svg className="absolute inset-0 w-full h-full animate-spin-slow" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="100" cy="100" r="90" stroke="#374151" strokeWidth="2" strokeDasharray="8 8" />
            </svg>

            <div className="absolute w-56 h-56 bg-zinc-900 border border-zinc-800 flex items-center justify-center animate-pulse">
              <UserPlus size={72} className="text-white" />
            </div>

            {/* Floating Info Badges */}
            <div className="absolute top-2 left-0 bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-8 h-8 bg-white text-black flex items-center justify-center">
                <ShieldCheck size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">Join the Network</p>
                <p className="text-[10px] text-gray-400">Instant Access Anywhere</p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Start your journey.
          </h2>
          <p className="text-sm text-gray-400 mt-3 max-w-sm">
            Connect with your network using end-to-end encrypted messaging designed for real-time collaboration.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400 font-medium z-10">
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-white" /> Instant Setup</span>
          <span className="w-1.5 h-1.5 bg-gray-600" />
          <span>E2E Encryption</span>
          <span className="w-1.5 h-1.5 bg-gray-600" />
          <span>Zero Logs</span>
        </div>
      </div>

      {/* RIGHT SIDE: Form Section (Full width on Mobile, Half on Desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
        <div className="w-full max-w-md p-6 sm:p-10 bg-white border border-gray-200 my-auto">
          
          {/* Header / Brand Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white mb-4">
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
                Full Name <span className="text-black">*</span>
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 text-gray-400" size={18} />
                <input
                  type="text"
                  name="fullName"
                  placeholder="John Doe"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-black focus:bg-white disabled:opacity-50"
                  value={formData.fullName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address <span className="text-black">*</span>
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 text-gray-400" size={18} />
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-black focus:bg-white disabled:opacity-50"
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
                <Phone className="absolute left-3.5 text-gray-400" size={18} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+1 234 567 8900"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-black focus:bg-white disabled:opacity-50"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Password <span className="text-black">*</span>
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 text-gray-400" size={18} />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 text-gray-900 text-sm placeholder-gray-400 transition-all duration-200 focus:outline-none focus:border-black focus:bg-white disabled:opacity-50"
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
              className="w-full mt-2 py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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



          {/* Footer Navigation */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-black hover:underline transition-all"
            >
              Sign In
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default SignupPage;