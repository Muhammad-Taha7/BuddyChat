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
      return () => {
        clearInterval(timer);
        stopRingtone();
      };
    } else {
      stopRingtone();
    }
  }, [incomingCall]);

  const { fromUser, callType } = incomingCall || {};

  const handleAccept = () => {
    stopRingtone();
    if (incomingCall) answerCall(incomingCall);
  };

  const handleReject = () => {
    stopRingtone();
    if (incomingCall) rejectCall(incomingCall);
  };

  if (!incomingCall) return null;

  // Use portal to render at document.body level — bypasses all z-index stacking contexts
  return ReactDOM.createPortal(
    <div
      className="fixed inset-0 flex flex-col items-center justify-between text-white select-none"
      style={{
        zIndex: 2147483647, // max possible z-index
        background: "linear-gradient(to bottom, #111827, #030712, #000000)",
      }}
    >
      {/* Top Section */}
      <div className="flex flex-col items-center pt-16 sm:pt-20">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">
            End-to-End Encrypted
          </span>
        </div>
        <p className="text-sm text-gray-400">
          Incoming {callType === "video" ? "Video" : "Voice"} Call
        </p>
      </div>

      {/* Center - Caller Info */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative flex items-center justify-center mb-8">
          {/* Animated ripple rings */}
          <div
            className="absolute w-40 h-40 rounded-full border border-white/10 animate-ping"
            style={{ animationDuration: "2s" }}
          />
          <div
            className="absolute w-52 h-52 rounded-full border border-white/5 animate-ping"
            style={{ animationDuration: "2.5s", animationDelay: "0.3s" }}
          />
          <div
            className="absolute w-64 h-64 rounded-full border border-white/[0.03] animate-ping"
            style={{ animationDuration: "3s", animationDelay: "0.6s" }}
          />

          {/* Avatar */}
          <div className="relative z-10">
            <div className="rounded-full p-1 bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/20">
              <div className="rounded-full p-0.5 bg-gray-900">
                <Avatar user={fromUser} size="2xl" showStatus={false} />
              </div>
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          {fromUser?.fullName || "Unknown"}
        </h2>
        <p className="text-gray-400 text-sm animate-pulse">
          BuddyChat {callType === "video" ? "Video" : "Voice"} Call
          {elapsed > 0 && ` · ${elapsed}s`}
        </p>
      </div>

      {/* Bottom - Action Buttons */}
      <div className="pb-12 sm:pb-16 w-full max-w-sm mx-auto px-8">
        <div className="flex items-center justify-between">
          {/* Decline */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleReject}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg shadow-red-500/30"
            >
              <PhoneOff size={28} className="text-white" />
            </button>
            <span className="text-xs text-gray-400 font-medium">Decline</span>
          </div>

          {/* Accept */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={handleAccept}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg shadow-emerald-500/30 animate-pulse"
            >
              {callType === "video" ? (
                <Video size={28} className="text-white" />
              ) : (
                <Phone size={28} className="text-white" />
              )}
            </button>
            <span className="text-xs text-gray-400 font-medium">Accept</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default IncomingCallModal;