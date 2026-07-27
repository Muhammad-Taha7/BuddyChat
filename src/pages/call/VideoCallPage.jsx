import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  ShieldCheck,
  RotateCcw,
  Maximize,
  Minimize,
} from "lucide-react";
import useCallStore from "../../store/useCallStore";
import Avatar from "../../components/Avatar";
import { startRingtone, stopRingtone } from "../../utils/ringtone";

const VideoCallPage = () => {
  const {
    callUser,
    localStream,
    remoteStream,
    isMuted,
    isCameraOff,
    callDuration,
    callState,
    toggleMute,
    toggleCamera,
    switchCamera,
    endCall,
  } = useCallStore();

  const isConnected = callState === "connected";
  const hasRemoteVideo = remoteStream && remoteStream.getVideoTracks().length > 0;

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [pipMode, setPipMode] = useState(false);
  const controlsTimer = useRef(null);

  // Outgoing ringtone
  useEffect(() => {
    if (callState === "calling") {
      startRingtone("outgoing");
    } else {
      stopRingtone();
    }
    return () => stopRingtone();
  }, [callState]);

  // Attach local video
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach remote video/audio and force play
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (videoEl && remoteStream) {
      videoEl.srcObject = remoteStream;
      videoEl.volume = 1.0;
      videoEl.play().catch((err) => {
        console.warn("[VideoCall] Remote video autoplay blocked:", err.message);
      });
    }
  }, [remoteStream, hasRemoteVideo, isConnected]);

  // Auto-hide controls after 4s of inactivity
  useEffect(() => {
    if (callState === "connected") {
      resetControlsTimer();
    }
    return () => {
      if (controlsTimer.current) clearTimeout(controlsTimer.current);
    };
  }, [callState]);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4000);
  };

  const handleScreenTap = () => {
    if (callState === "connected") {
      resetControlsTimer();
    }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!callUser) return null;

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden bg-black text-white select-none font-sans"
      onClick={handleScreenTap}
    >
      {/* ─── BACKGROUND ─── */}
      {isConnected && hasRemoteVideo ? (
        /* Remote Video Full Screen */
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        /* Calling / Connecting Screen */
        <div className="absolute inset-0 z-0 bg-black flex flex-col items-center justify-center p-6">
          
          {/* Subtle Ambient Ring Animation */}
          <div className="relative flex items-center justify-center mb-10">
            <div className="absolute w-40 h-40 border border-white/20 animate-ping" style={{ animationDuration: "2.5s" }} />
            <div className="absolute w-56 h-56 border border-white/10 animate-ping" style={{ animationDuration: "3s", animationDelay: "0.5s" }} />
            
            <div className="relative z-10 border-2 border-white/30 p-2 bg-black">
              <Avatar user={callUser} size="2xl" showStatus={false} />
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-white text-center">
            {callUser.fullName}
          </h2>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 animate-pulse">
            {callState === "calling" ? "Calling..." : "Connecting..."}
          </p>
        </div>
      )}

      {/* ─── LOCAL VIDEO (PiP) ─── */}
      {localStream && !isCameraOff && (
        <div
          className={`absolute z-30 border border-white/30 bg-black transition-all duration-300 ${
            pipMode
              ? "top-6 right-6 w-24 h-32 sm:w-28 sm:h-36"
              : "top-6 right-6 w-32 h-44 sm:w-40 sm:h-56"
          }`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {/* PiP Toggle */}
          <button
            onClick={(e) => { e.stopPropagation(); setPipMode(!pipMode); }}
            className="absolute bottom-2 right-2 w-7 h-7 bg-black/80 border border-white/20 text-white flex items-center justify-center hover:bg-white hover:text-black transition-all"
          >
            {pipMode ? <Maximize size={14} /> : <Minimize size={14} />}
          </button>
        </div>
      )}

      {/* ─── TOP BAR (fades with controls) ─── */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${
          showControls || !isConnected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-b from-black via-black/70 to-transparent pt-6 pb-10 px-8">
          <div className="flex items-center justify-between">
            {/* Left: E2E Badge */}
            <div className="flex items-center gap-2 border border-zinc-800 bg-black/60 px-3 py-1.5">
              <ShieldCheck size={14} className="text-white" />
              <span className="text-[11px] font-semibold tracking-wider text-gray-300 uppercase">
                Encrypted
              </span>
            </div>

            {/* Center: Name + Timer */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-bold tracking-wide">
                {callUser.fullName}
              </span>
              {isConnected && (
                <span className="font-mono text-xs text-gray-400 tracking-widest mt-0.5">
                  {formatTime(callDuration)}
                </span>
              )}
            </div>

            {/* Right: Call Type Tag */}
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {callState === "connected" ? "Video Call" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ─── BOTTOM CONTROLS ─── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-300 ${
          showControls || !isConnected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-t from-black via-black/80 to-transparent pt-12 pb-8 sm:pb-12 px-6">
          <div className="flex items-center justify-center gap-4 sm:gap-6">
            
            {/* Camera Switch */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); switchCamera(); }}
              className="w-12 h-12 bg-zinc-900 border border-zinc-800 text-white flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95"
              aria-label="Switch camera"
            >
              <RotateCcw size={18} />
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleCamera(); }}
              className={`w-12 h-12 border flex items-center justify-center transition-all active:scale-95 ${
                isCameraOff
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800"
              }`}
              aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? <VideoOff size={18} /> : <Video size={18} />}
            </button>

            {/* Mic Toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className={`w-12 h-12 border flex items-center justify-center transition-all active:scale-95 ${
                isMuted
                  ? "bg-white text-black border-white"
                  : "bg-zinc-900 text-white border-zinc-800 hover:bg-zinc-800"
              }`}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* End Call */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); endCall(); }}
              className="w-14 h-14 bg-red-600 hover:bg-red-700 text-white flex items-center justify-center transition-all active:scale-95 ml-2"
              aria-label="End call"
            >
              <PhoneOff size={22} />
            </button>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;