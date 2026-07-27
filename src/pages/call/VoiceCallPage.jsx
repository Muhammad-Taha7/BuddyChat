import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  PhoneOff,
  Volume2,
  ShieldCheck,
} from "lucide-react";
import useCallStore from "../../store/useCallStore";
import Avatar from "../../components/Avatar";
import { startRingtone, stopRingtone } from "../../utils/ringtone";

const VoiceCallPage = () => {
  const {
    callUser,
    localStream,
    remoteStream,
    isMuted,
    callDuration,
    callState,
    toggleMute,
    endCall,
  } = useCallStore();

  const remoteAudioRef = useRef(null);
  const [isSpeaker, setIsSpeaker] = useState(false);

  const isConnected = callState === "connected";

  // Outgoing ringtone
  useEffect(() => {
    if (callState === "calling") {
      startRingtone("outgoing");
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [callState]);

  // Attach remote audio and force play
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (audioEl && remoteStream) {
      audioEl.srcObject = remoteStream;
      audioEl.volume = 1.0;
      // Handle browsers that block autoplay — force play()
      audioEl.play().catch((err) => {
        console.warn("[VoiceCall] Audio autoplay blocked:", err.message);
      });
    }
  }, [remoteStream, isConnected]);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!callUser) return null;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-between bg-gradient-to-b from-gray-900 via-gray-950 to-black text-white select-none">
      {/* Hidden audio element for remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={false} style={{ display: "none" }} />

      {/* ─── TOP SECTION ─── */}
      <div className="flex flex-col items-center pt-14 sm:pt-20 w-full">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span className="text-xs font-medium text-emerald-400 tracking-wide uppercase">
            End-to-End Encrypted
          </span>
        </div>
        <p className="text-sm text-gray-400">
          BuddyChat Voice Call
        </p>
      </div>

      {/* ─── CENTER: Caller Info + Audio Visualizer ─── */}
      <div className="flex flex-col items-center justify-center flex-1">
        <div className="relative flex items-center justify-center mb-8">
          {/* Animated audio wave rings (when connected) */}
          {isConnected ? (
            <>
              <div
                className="absolute w-36 h-36 rounded-full border-2 border-emerald-500/20"
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <div
                className="absolute w-44 h-44 rounded-full border border-emerald-500/10"
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  animationDelay: "0.5s",
                }}
              />
              <div
                className="absolute w-52 h-52 rounded-full border border-emerald-500/5"
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  animationDelay: "1s",
                }}
              />
            </>
          ) : (
            /* Calling ripples */
            <>
              <div className="absolute w-36 h-36 rounded-full border border-white/10 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute w-48 h-48 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.3s" }} />
              <div className="absolute w-60 h-60 rounded-full border border-white/[0.03] animate-ping" style={{ animationDuration: "3s", animationDelay: "0.6s" }} />
            </>
          )}

          {/* Avatar with colored ring */}
          <div className="relative z-10">
            <div
              className={`rounded-full p-1 shadow-2xl ${
                isConnected
                  ? "bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-emerald-500/20"
                  : "bg-gradient-to-br from-blue-400 to-blue-600 shadow-blue-500/20"
              }`}
            >
              <div className="rounded-full p-0.5 bg-gray-900">
                <Avatar user={callUser} size="2xl" showStatus={false} />
              </div>
            </div>
          </div>
        </div>

        {/* Caller Name */}
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
          {callUser.fullName}
        </h2>

        {/* Status / Timer */}
        {isConnected ? (
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-lg text-gray-200 tracking-wider">
              {formatTime(callDuration)}
            </span>
          </div>
        ) : (
          <p className="text-sm font-medium text-blue-400 animate-pulse">
            {callState === "calling" ? "Ringing..." : "Connecting..."}
          </p>
        )}
      </div>

      {/* ─── BOTTOM CONTROLS ─── */}
      <div className="pb-12 sm:pb-16 w-full max-w-md mx-auto px-8">
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          {/* Speaker Toggle */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isSpeaker
                  ? "bg-white text-gray-900"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              aria-label={isSpeaker ? "Disable speaker" : "Enable speaker"}
            >
              <Volume2 size={22} />
            </button>
            <span className="text-[10px] text-gray-500 font-medium">Speaker</span>
          </div>

          {/* Mute Toggle */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${
                isMuted
                  ? "bg-white text-gray-900"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>
            <span className="text-[10px] text-gray-500 font-medium">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </div>

          {/* End Call */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-red-500/30"
              aria-label="End call"
            >
              <PhoneOff size={26} className="text-white" />
            </button>
            <span className="text-[10px] text-gray-500 font-medium">End</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceCallPage;