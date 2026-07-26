import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { ArrowRight, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
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
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gray-50 text-gray-900 overflow-hidden selection:bg-[#fc4a56]/30 selection:text-gray-900">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#fc4a56]/10 rounded-full blur-[130px] pointer-events-none -z-10" />
      <div className="absolute bottom-10 right-10 w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

      {/* Main Verification Card */}
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-gray-50/60 backdrop-blur-2xl border border-gray-200/80 shadow-2xl shadow-black/50 my-8">
        
        {/* Header / Brand Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#fc4a56] to-rose-500 text-white shadow-lg shadow-[#fc4a56]/30 mb-4">
            <ShieldCheck size={28} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Verify Your Email
          </h2>
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
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center font-bold text-xl rounded-xl border bg-white/60 transition-all duration-200 focus:outline-none ${
                  otp[index]
                    ? "border-[#fc4a56] text-[#fc4a56] shadow-sm shadow-[#fc4a56]/20 bg-gray-50/80"
                    : "border-gray-200 text-gray-900 hover:border-gray-300"
                } focus:ring-2 focus:ring-[#fc4a56]/50 focus:border-[#fc4a56]`}
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
                <span className="font-mono font-bold text-[#fc4a56]">
                  {formatTime(countdown)}
                </span>
              </p>
            ) : (
              <p className="text-xs sm:text-sm font-semibold text-rose-500">
                Code expired. Please request a new one.
              </p>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading || otp.join("").length !== 6}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fc4a56] to-rose-600 hover:from-[#e03e49] hover:to-rose-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#fc4a56]/25 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="mt-8 pt-6 border-t border-gray-200/80 text-center text-sm text-gray-500">
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={countdown > 0}
            className="inline-flex items-center gap-1 font-semibold text-[#fc4a56] hover:underline disabled:text-slate-600 disabled:no-underline disabled:cursor-not-allowed ml-1 transition-all"
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
  );
};

export default OtpVerifyPage;