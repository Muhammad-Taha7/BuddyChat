import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRight, Loader2, RefreshCw, ShieldCheck, MessageSquare, Lock, Zap } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import { generateKeyPair } from "../../lib/encryption";

const OtpVerifyPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [activeOtpIndex, setActiveOtpIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes

  const inputRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, updateUser } = useAuthStore();

  const email = location.state?.email;
  const type = location.state?.type || "login";

  // Redirect if no email state is passed
  if (!email) {
    return <Navigate to="/login" replace />;
  }

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus active input
  useEffect(() => {
    inputRef.current?.focus();
  }, [activeOtpIndex]);

  const handleOnChange = ({ target }) => {
    const { value } = target;
    const newOtp = [...otp];
    newOtp[activeOtpIndex] = value.substring(value.length - 1);

    if (!value) setActiveOtpIndex(Math.max(0, activeOtpIndex - 1));
    else setActiveOtpIndex(Math.min(5, activeOtpIndex + 1));

    setOtp(newOtp);
  };

  const handleOnKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const newOtp = [...otp];
      newOtp[index] = "";
      setOtp(newOtp);
      setActiveOtpIndex(Math.max(0, index - 1));
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      return toast.error("Please enter a 6-digit OTP");
    }

    setIsLoading(true);
    try {
      const res = await verifyOtp(email, otpValue);

      if (res.success) {
        toast.success(res.message);

        // Generate E2E encryption keys if profile is not setup yet
        if (!res.data.user.isProfileSetup) {
          try {
            const { publicKeyBase64, keyPair } = await generateKeyPair();

            const privateKeyRaw = await window.crypto.subtle.exportKey(
              "pkcs8",
              keyPair.privateKey
            );
            const privateKeyBase64 = btoa(
              String.fromCharCode(...new Uint8Array(privateKeyRaw))
            );
            localStorage.setItem("e2ee_private_key", privateKeyBase64);

            updateUser({ publicKey: publicKeyBase64 });
          } catch (keyError) {
            console.error("Failed to generate keys:", keyError);
            toast.error("Failed to generate encryption keys");
          }

          navigate("/profile-setup");
        } else {
          if (!localStorage.getItem("e2ee_private_key")) {
            console.warn("No private key found on this device");
          }
          navigate("/chat");
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      setActiveOtpIndex(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;

    try {
      await resendOtp(email, type);
      toast.success("New OTP sent to your email");
      setCountdown(300);
      setOtp(["", "", "", "", "", ""]);
      setActiveOtpIndex(0);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
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
              <ShieldCheck size={72} className="text-white" />
            </div>

            {/* Floating Info Badges */}
            <div className="absolute top-2 left-0 bg-zinc-900 border border-zinc-800 px-4 py-3 flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
              <div className="w-8 h-8 bg-white text-black flex items-center justify-center">
                <Lock size={18} />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white">2-Factor Authentication</p>
                <p className="text-[10px] text-gray-400">Extra Layer of Security</p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Verify your identity.
          </h2>
          <p className="text-sm text-gray-400 mt-3 max-w-sm">
            We prioritize your account security. Please enter the OTP code to proceed safely.
          </p>
        </div>

        {/* Bottom Feature Badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-400 font-medium z-10">
          <span className="flex items-center gap-1.5"><Zap size={14} className="text-white" /> Instant Verification</span>
          <span className="w-1.5 h-1.5 bg-gray-600" />
          <span>Secure Storage</span>
          <span className="w-1.5 h-1.5 bg-gray-600" />
          <span>E2E Protection</span>
        </div>
      </div>

      {/* RIGHT SIDE: Form Section (Full width on Mobile, Half on Desktop) */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md p-6 sm:p-10 bg-white border border-gray-200">
          
          {/* Header / Brand Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-black text-white mb-4">
              <ShieldCheck size={28} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Verify Your Email
            </h1>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              We've sent a 6-digit code to <br />
              <strong className="text-gray-900 font-semibold">{email}</strong>
            </p>
          </div>

          {/* Form Container */}
          <form onSubmit={handleVerify} className="space-y-6">
            
            {/* 6-Digit OTP Inputs */}
            <div className="flex items-center justify-between gap-1.5 sm:gap-2">
              {otp.map((_, index) => (
                <input
                  key={index}
                  ref={index === activeOtpIndex ? inputRef : null}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-bold text-xl border transition-all duration-200 focus:outline-none ${
                    otp[index]
                      ? "border-black text-black bg-gray-100"
                      : "border-gray-200 bg-gray-50 text-gray-900 hover:border-gray-300"
                  } focus:border-black focus:bg-white`}
                  value={otp[index]}
                  onChange={handleOnChange}
                  onKeyDown={(e) => handleOnKeyDown(e, index)}
                  disabled={isLoading}
                />
              ))}
            </div>

            {/* Countdown Clock Display */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs sm:text-sm text-gray-500">
                  Code expires in{" "}
                  <span className="font-mono font-bold text-black">
                    {formatTime(countdown)}
                  </span>
                </p>
              ) : (
                <p className="text-xs sm:text-sm font-semibold text-red-600">
                  Code expired. Please request a new one.
                </p>
              )}
            </div>

            {/* Submit Action Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full py-3.5 px-4 bg-black hover:bg-gray-900 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Verify & Continue
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Resend Actions Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center text-sm text-gray-500">
            Didn't receive the code?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={countdown > 0}
              className="inline-flex items-center gap-1 font-semibold text-black hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed ml-1 transition-all"
            >
              {countdown > 0 ? (
                `Wait (${formatTime(countdown)})`
              ) : (
                <>
                  <RefreshCw size={14} />
                  Resend OTP
                </>
              )}
            </button>
          </div>

        </div>
      </div>

    </div>
  );
};

export default OtpVerifyPage;