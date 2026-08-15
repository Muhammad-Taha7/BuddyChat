import React, { useEffect, useRef, useState } from "react";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, ShieldCheck, Signal } from "lucide-react";
import useCallStore from "../../store/useCallStore";
import Avatar from "../../components/Avatar";
import { startRingtone, stopRingtone } from "../../utils/ringtone";

const VoiceCallPage = () => {
  const {
    callUser, localStream, remoteStream, isMuted,
    callDuration, callState, toggleMute, endCall,
  } = useCallStore();

  const remoteAudioRef = useRef(null);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const isConnected = callState === "connected";

  // Outgoing ringtone
  useEffect(() => {
    if (callState === "calling") startRingtone("outgoing");
    else stopRingtone();
    return () => stopRingtone();
  }, [callState]);

  // Attach remote audio
  useEffect(() => {
    const el = remoteAudioRef.current;
    if (el && remoteStream) {
      el.srcObject = remoteStream;
      el.volume = 1.0;
      el.play().catch((e) => console.warn("[VoiceCall] Autoplay blocked:", e.message));
    }
  }, [remoteStream, isConnected]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  if (!callUser) return null;

  const ControlBtn = ({ onClick, active, danger, children, label, sublabel }) => (
    <div className="flex flex-col items-center gap-2.5">
      <button type="button" onClick={onClick} aria-label={label}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-xl ${
          danger
            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/30"
            : active
            ? "bg-white text-gray-900"
            : "bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm"
        }`}>
        {children}
      </button>
      {sublabel && (
        <span className={`text-[11px] font-medium tracking-wide ${danger ? "text-red-400" : "text-gray-400"}`}>
          {sublabel}
        </span>
      )}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[90] flex flex-col items-center justify-between text-white select-none"
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: "radial-gradient(ellipse at 50% 30%, #1a1a3e 0%, #0d0d1f 50%, #000 100%)",
      }}
    >
      {/* Hidden audio */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={false} style={{ display: "none" }} />

      {/* ── TOP ── */}
      <div className="flex flex-col items-center pt-14 sm:pt-20 w-full">
        <div className="flex items-center gap-2 bg-white/8 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 mb-3">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span className="text-[11px] font-medium text-emerald-300 tracking-wide uppercase">End-to-End Encrypted</span>
        </div>
        <p className="text-xs uppercase tracking-[0.2em] text-gray-500 font-medium">BuddyChat Voice</p>
      </div>

      {/* ── CENTER ── */}
      <div className="flex flex-col items-center justify-center flex-1">
        {/* Avatar with animated rings */}
        <div className="relative flex items-center justify-center mb-8">
          {isConnected ? (
            // Connected — subtle breathing rings
            [96, 130, 164].map((size, i) => (
              <div key={i} className="absolute border border-white/10 rounded-full"
                style={{ width: size, height: size, animation: `pulse 2.5s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
            ))
          ) : (
            // Ringing — ping ripples
            [96, 130, 164].map((size, i) => (
              <div key={i} className="absolute border border-white/15 rounded-full animate-ping"
                style={{ width: size, height: size, animationDuration: `${2 + i * 0.5}s`, animationDelay: `${i * 0.3}s` }} />
            ))
          )}
          <div className="relative z-10 rounded-full shadow-2xl"
            style={{ padding: "3px", background: "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))" }}>
            <div className="rounded-full overflow-hidden">
              <Avatar user={callUser} size="2xl" showStatus={false} />
            </div>
          </div>
        </div>

        <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-3 text-white">{callUser.fullName}</h2>

        {isConnected ? (
          <div className="flex items-center gap-2.5 bg-white/8 px-5 py-2 rounded-full border border-white/10">
            <Signal size={13} className="text-emerald-400" />
            <span className="font-mono text-sm text-gray-200 tracking-widest">{formatTime(callDuration)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((d, i) => (
                <div key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${d}s` }} />
              ))}
            </div>
            <p className="text-sm font-light text-gray-400 tracking-wider">
              {callState === "calling" ? "Ringing" : "Connecting"}
            </p>
          </div>
        )}
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div className="pb-14 sm:pb-20 w-full max-w-xs mx-auto px-8">
        <div className="flex items-center justify-between">

          <ControlBtn onClick={() => setIsSpeaker(!isSpeaker)} active={isSpeaker}
            label="Speaker" sublabel="Speaker">
            {isSpeaker ? <Volume2 size={21} /> : <VolumeX size={21} />}
          </ControlBtn>

          <ControlBtn onClick={toggleMute} active={isMuted} label={isMuted ? "Unmute" : "Mute"}
            sublabel={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? <MicOff size={21} /> : <Mic size={21} />}
          </ControlBtn>

          <ControlBtn onClick={endCall} danger label="End call" sublabel="End">
            <PhoneOff size={23} />
          </ControlBtn>

        </div>
      </div>
    </div>
  );
};

export default VoiceCallPage;