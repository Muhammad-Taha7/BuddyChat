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

  // Attach remote video
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
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
      className="fixed inset-0 z-[90] overflow-hidden bg-black text-white select-none"
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
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-gray-900 via-gray-950 to-black flex flex-col items-center justify-center">
          {/* Animated Ripples */}
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-36 h-36 rounded-full border border-white/10 animate-ping" style={{ animationDuration: "2s" }} />
            <div className="absolute w-48 h-48 rounded-full border border-white/5 animate-ping" style={{ animationDuration: "2.5s", animationDelay: "0.4s" }} />
            <div className="absolute w-60 h-60 rounded-full border border-white/[0.03] animate-ping" style={{ animationDuration: "3s", animationDelay: "0.8s" }} />
            
            <div className="relative z-10">
              <div className="rounded-full p-1 bg-gradient-to-br from-blue-400 to-blue-600 shadow-2xl shadow-blue-500/20">
                <div className="rounded-full p-0.5 bg-gray-900">
                  <Avatar user={callUser} size="2xl" showStatus={false} />
                </div>
              </div>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            {callUser.fullName}
          </h2>
          <p className="text-sm font-medium text-blue-400 animate-pulse">
            {callState === "calling" ? "Calling..." : "Connecting..."}
          </p>
        </div>
      )}

      {/* ─── LOCAL VIDEO (PiP) ─── */}
      {localStream && !isCameraOff && (
        <div
          className={`absolute z-30 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl bg-black transition-all duration-300 ${
            pipMode
              ? "top-4 right-4 w-24 h-32 sm:w-28 sm:h-36"
              : "top-4 right-4 w-32 h-44 sm:w-40 sm:h-56"
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
            className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            {pipMode ? <Maximize size={12} /> : <Minimize size={12} />}
          </button>
        </div>
      )}

      {/* ─── TOP BAR (fades with controls) ─── */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 transition-all duration-300 ${
          showControls || !isConnected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-4 pb-8 px-6">
          <div className="flex items-center justify-between">
            {/* Left: E2E Badge */}
            <div className="flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-400" />
              <span className="text-xs font-medium text-emerald-400/80 tracking-wide">
                Encrypted
              </span>
            </div>

            {/* Center: Name + Timer */}
            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold">
                {callUser.fullName}
              </span>
              {isConnected && (
                <span className="font-mono text-xs text-gray-300 tracking-wider">
                  {formatTime(callDuration)}
                </span>
              )}
            </div>

            {/* Right: Call Type */}
            <span className="text-xs text-gray-400 capitalize">
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
        <div className="bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-12 pb-8 sm:pb-10 px-6">
          <div className="flex items-center justify-center gap-5 sm:gap-8">
            {/* Camera Flip (placeholder) */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); switchCamera(); }}
              className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-all active:scale-90"
              aria-label="Switch camera"
            >
              <RotateCcw size={20} />
            </button>

            {/* Camera Toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleCamera(); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm ${
                isCameraOff
                  ? "bg-white text-gray-900"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              aria-label={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </button>

            {/* Mic Toggle */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-90 backdrop-blur-sm ${
                isMuted
                  ? "bg-white text-gray-900"
                  : "bg-white/10 hover:bg-white/20"
              }`}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* End Call */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); endCall(); }}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-all active:scale-90 shadow-lg shadow-red-500/30"
              aria-label="End call"
            >
              <PhoneOff size={24} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;