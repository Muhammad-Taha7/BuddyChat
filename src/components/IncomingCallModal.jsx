import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { Phone, PhoneOff, Video, ShieldCheck } from "lucide-react";
import useCallStore from "../store/useCallStore";
import Avatar from "./Avatar";
import { startRingtone, stopRingtone } from "../utils/ringtone";

const IncomingCallModal = () => {
  const incomingCall = useCallStore((state) => state.incomingCall);
  const answerCall = useCallStore((state) => state.answerCall);
  const rejectCall = useCallStore((state) => state.rejectCall);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (incomingCall) {
      startRingtone("incoming");
      setElapsed(0);
      const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
      return () => { clearInterval(timer); stopRingtone(); };
    } else {
      stopRingtone();
    }
  }, [incomingCall]);

  const { fromUser, callType } = incomingCall || {};

  const handleAccept = () => { stopRingtone(); if (incomingCall) answerCall(incomingCall); };
  const handleReject = () => { stopRingtone(); if (incomingCall) rejectCall(incomingCall); };

  if (!incomingCall) return null;

  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-between text-white select-none"
      style={{
        zIndex: 2147483647,
        fontFamily: "'Poppins', sans-serif",
        background: "radial-gradient(ellipse at 50% 25%, #1a2a4a 0%, #0a0f1e 55%, #000 100%)",
      }}
    >
      {/* ── SUBTLE ANIMATED NOISE OVERLAY ── */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "150px" }}
      />

      {/* ── TOP ── */}
      <div className="relative flex flex-col items-center pt-16 sm:pt-20 z-10">
        <div className="flex items-center gap-2 bg-white/8 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-4">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-300 tracking-wide uppercase">End-to-End Encrypted</span>
        </div>
        <p className="text-sm font-light text-gray-400 tracking-wide">
          Incoming {callType === "video" ? "Video" : "Voice"} Call
        </p>
      </div>

      {/* ── CENTER ── */}
      <div className="relative flex flex-col items-center justify-center flex-1 z-10">
        {/* Animated ripple rings */}
        <div className="relative flex items-center justify-center mb-8">
          {[100, 140, 180, 220].map((size, i) => (
            <div key={i}
              className="absolute rounded-full border border-white/10 animate-ping"
              style={{ width: size, height: size, animationDuration: `${2 + i * 0.4}s`, animationDelay: `${i * 0.25}s` }}
            />
          ))}

          {/* Avatar */}
          <div className="relative z-10"
            style={{ padding: "3px", borderRadius: "9999px", background: "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)" }}>
            <div className="rounded-full bg-gray-900 p-0.5">
              <Avatar user={fromUser} size="2xl" showStatus={false} />
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-2">
          {fromUser?.fullName || "Unknown"}
        </h2>
        <div className="flex items-center gap-2">
          {elapsed > 0 && (
            <span className="text-xs text-gray-500 font-mono tracking-wider">{elapsed}s</span>
          )}
          <p className="text-sm font-light text-gray-400 animate-pulse">
            BuddyChat {callType === "video" ? "Video" : "Voice"}
          </p>
        </div>
      </div>

      {/* ── BOTTOM BUTTONS ── */}
      <div className="pb-16 sm:pb-20 w-full max-w-xs mx-auto px-8 z-10">
        <div className="flex items-center justify-between">

          {/* Decline */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-xl shadow-red-500/25 border border-red-400/20">
              <PhoneOff size={26} className="text-white" />
            </button>
            <span className="text-xs text-gray-400 font-medium tracking-wide">Decline</span>
          </div>

          {/* Animated call type icon in center */}
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              {callType === "video" ? (
                <Video size={18} className="text-gray-400" />
              ) : (
                <Phone size={18} className="text-gray-400" />
              )}
            </div>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-3">
            <button onClick={handleAccept}
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-xl shadow-emerald-500/30 border border-emerald-400/20"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", animation: "pulse 2s ease-in-out infinite" }}>
              {callType === "video" ? (
                <Video size={26} className="text-white" />
              ) : (
                <Phone size={26} className="text-white" />
              )}
            </button>
            <span className="text-xs text-gray-400 font-medium tracking-wide">Accept</span>
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallModal;