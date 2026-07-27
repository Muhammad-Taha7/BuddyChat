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
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-between bg-black text-white select-none font-sans">
      {/* Hidden audio element for remote voice */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={false} style={{ display: "none" }} />

      {/* ─── TOP SECTION ─── */}
      <div className="flex flex-col items-center pt-12 sm:pt-16 w-full">
        <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-950 px-3 py-1.5 mb-2">
          <ShieldCheck size={14} className="text-white" />
          <span className="text-[10px] font-bold tracking-widest text-gray-300 uppercase">
            End-to-End Encrypted
          </span>
        </div>
        <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">
          BuddyChat Voice Call
        </p>
      </div>

      {/* ─── CENTER: Caller Info + Audio Visualizer ─── */}
      <div className="flex flex-col items-center justify-center flex-1 my-auto">
        <div className="relative flex items-center justify-center mb-8">
          {/* Audio wave rings */}
          {isConnected ? (
            <>
              <div
                className="absolute w-36 h-36 border border-white/20"
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                }}
              />
              <div
                className="absolute w-48 h-48 border border-white/10"
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  animationDelay: "0.5s",
                }}
              />
              <div
                className="absolute w-60 h-60 border border-white/5"
                style={{
                  animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                  animationDelay: "1s",
                }}
              />
            </>
          ) : (
            /* Calling ripples */
            <>
              <div className="absolute w-36 h-36 border border-white/20 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="absolute w-48 h-48 border border-white/10 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.3s" }} />
              <div className="absolute w-60 h-60 border border-white/5 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.6s" }} />
            </>
          )}

          {/* Sharp Avatar Container */}
          <div className="relative z-10 border-2 border-white/30 p-2 bg-black">
            <Avatar user={callUser} size="2xl" showStatus={false} />
          </div>
        </div>

        {/* Caller Name */}
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white">
          {callUser.fullName}
        </h2>

        {/* Status / Timer */}
        {isConnected ? (
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 bg-white animate-pulse" />
            <span className="font-mono text-base text-gray-300 tracking-widest">
              {formatTime(callDuration)}
            </span>
          </div>
        ) : (
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 animate-pulse">
            {callState === "calling" ? "Ringing..." : "Connecting..."}
          </p>
        )}
      </div>

      {/* ─── BOTTOM CONTROLS ─── */}
      <div className="pb-12 sm:pb-16 w-full max-w-md mx-auto px-8">
        <div className="flex items-center justify-center gap-6 sm:gap-8">
          
          {/* Speaker Toggle */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSpeaker(!isSpeaker)}
              className={`w-14 h-14 border flex items-center justify-center transition-all active:scale-95 ${
                isSpeaker
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800"
              }`}
              aria-label={isSpeaker ? "Disable speaker" : "Enable speaker"}
            >
              <Volume2 size={20} />
            </button>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Speaker</span>
          </div>

          {/* Mute Toggle */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className={`w-14 h-14 border flex items-center justify-center transition-all active:scale-95 ${
                isMuted
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800"
              }`}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
              {isMuted ? "Unmute" : "Mute"}
            </span>
          </div>

          {/* End Call */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={endCall}
              className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all active:scale-95"
              aria-label="End call"
            >
              <PhoneOff size={22} />
            </button>
            <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">End</span>
          </div>

        </div>
      </div>
    </div>
  );
};

export default VoiceCallPage;