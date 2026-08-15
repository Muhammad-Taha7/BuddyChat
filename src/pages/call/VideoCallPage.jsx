import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff,
  ShieldCheck, RotateCcw, Maximize2, Minimize2,
  MonitorUp, MonitorOff, Signal, Monitor, Volume2
} from "lucide-react";
import useCallStore from "../../store/useCallStore";
import Avatar from "../../components/Avatar";
import { startRingtone, stopRingtone } from "../../utils/ringtone";

const VideoCallPage = () => {
  const {
    callUser, localStream, remoteStream, isMuted, isCameraOff,
    callDuration, callState, callType,
    toggleMute, toggleCamera, switchCamera, endCall,
    remoteStreamUpdate, isScreenSharing, isRemoteScreenSharing, toggleScreenShare,
  } = useCallStore();

  const isConnected = callState === "connected";
  const remoteVideoTracks = remoteStream ? remoteStream.getVideoTracks() : [];
  const hasRemoteVideo = isConnected && remoteVideoTracks.length > 0 && remoteVideoTracks.some(t => t.readyState === "live" && t.enabled);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [showControls, setShowControls] = useState(true);
  const [pipMinimized, setPipMinimized] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const controlsTimer = useRef(null);

  // Outgoing ringtone
  useEffect(() => {
    if (callState === "calling") startRingtone("outgoing");
    else stopRingtone();
    return () => stopRingtone();
  }, [callState]);

  // Attach local video stream
  useEffect(() => {
    const el = localVideoRef.current;
    if (el && localStream) {
      if (el.srcObject !== localStream) {
        el.srcObject = localStream;
      }
      el.play().catch(() => {});
    }
  }, [localStream]);

  // Attach remote video & audio stream
  const attachRemoteStream = useCallback(() => {
    if (remoteVideoRef.current && remoteStream) {
      if (remoteVideoRef.current.srcObject !== remoteStream) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      remoteVideoRef.current.play().catch((err) => {
        console.warn("[VideoCall] Remote video play error:", err.message);
        setAutoplayBlocked(true);
      });
    }

    if (remoteAudioRef.current && remoteStream) {
      if (remoteAudioRef.current.srcObject !== remoteStream) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
      remoteAudioRef.current.volume = 1.0;
      remoteAudioRef.current.play().catch((err) => {
        console.warn("[VideoCall] Remote audio play error:", err.message);
        setAutoplayBlocked(true);
      });
    }
  }, [remoteStream]);

  useEffect(() => {
    attachRemoteStream();
  }, [remoteStream, isConnected, remoteStreamUpdate, attachRemoteStream]);

  // Auto-hide controls
  useEffect(() => {
    if (isConnected) resetControlsTimer();
    return () => { if (controlsTimer.current) clearTimeout(controlsTimer.current); };
  }, [isConnected]);

  const resetControlsTimer = () => {
    setShowControls(true);
    if (controlsTimer.current) clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => setShowControls(false), 4500);
  };

  const handleScreenClick = () => {
    if (autoplayBlocked) {
      remoteVideoRef.current?.play().catch(() => {});
      remoteAudioRef.current?.play().catch(() => {});
      setAutoplayBlocked(false);
    }
    if (isConnected) {
      resetControlsTimer();
    }
  };

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
    return `${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
  };

  if (!callUser) return null;

  const ControlBtn = ({ onClick, active, danger, children, label }) => (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={`w-13 h-13 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90 shadow-lg ${
          danger
            ? "bg-red-500 hover:bg-red-600 text-white shadow-red-500/40"
            : active
            ? "bg-white text-gray-900 shadow-white/20"
            : "bg-white/10 hover:bg-white/20 text-white border border-white/10 backdrop-blur-sm"
        }`}
      >
        {children}
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[90] overflow-hidden bg-black text-white select-none"
      style={{ fontFamily: "'Poppins', sans-serif" }}
      onClick={handleScreenClick}
    >
      {/* Hidden dedicated audio for crystal clear audio playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline muted={false} style={{ display: "none" }} />

      {/* ── REMOTE VIDEO (ALWAYS MOUNTED FOR STABLE WEBRTC BINDING) ── */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-black">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full ${
            isRemoteScreenSharing ? "object-contain bg-black" : "object-cover"
          } transition-opacity duration-300 ${
            isConnected && hasRemoteVideo ? "opacity-100" : "opacity-0"
          }`}
        />

        {/* Remote Screen Share Badge */}
        {isRemoteScreenSharing && isConnected && (
          <div className="absolute top-20 left-6 z-20 flex items-center gap-2 bg-blue-600/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-blue-400/30 text-xs font-medium text-white shadow-lg animate-fadeIn">
            <Monitor size={14} className="animate-pulse" />
            <span>{callUser.fullName} is sharing screen</span>
          </div>
        )}
      </div>

      {/* ── OVERLAY WHEN NOT CONNECTED OR CAMERA OFF ── */}
      {(!isConnected || !hasRemoteVideo) && (
        <div
          className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 40%, #1a1a3e 0%, #0a0a1a 60%, #000 100%)" }}
        >
          {/* Animated rings */}
          <div className="relative flex items-center justify-center mb-10 pointer-events-auto">
            {[120, 160, 200].map((size, i) => (
              <div
                key={i}
                className="absolute border border-white/10 rounded-full animate-ping"
                style={{ width: size, height: size, animationDuration: `${2 + i * 0.5}s`, animationDelay: `${i * 0.3}s` }}
              />
            ))}
            <div
              className="relative z-10 rounded-full p-1.5 shadow-2xl"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))", backdropFilter: "blur(10px)" }}
            >
              <Avatar user={callUser} size="2xl" showStatus={false} />
            </div>
          </div>

          <h2 className="text-3xl font-semibold tracking-tight mb-2 text-white text-center px-4">
            {callUser.fullName}
          </h2>

          <div className="flex items-center gap-2">
            <Signal size={12} className="text-emerald-400 animate-pulse" />
            <p className="text-sm font-light text-gray-400 animate-pulse tracking-wide">
              {callState === "calling"
                ? "Calling..."
                : isConnected
                ? "Connected · Remote camera off"
                : "Connecting..."}
            </p>
          </div>
        </div>
      )}

      {/* ── AUTOPLAY BLOCKED BANNER ── */}
      {autoplayBlocked && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2 shadow-2xl cursor-pointer animate-bounce">
          <Volume2 size={16} />
          <span>Click anywhere to enable audio</span>
        </div>
      )}

      {/* ── LOCAL VIDEO PIP ── */}
      {localStream && !isCameraOff && (
        <div
          className={`absolute z-30 transition-all duration-300 ${
            pipMinimized
              ? "bottom-28 right-4 w-20 h-28"
              : "bottom-28 right-4 w-32 h-44 sm:w-36 sm:h-52"
          } rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-gray-900`}
        >
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full ${
              isScreenSharing ? "object-contain bg-black" : "object-cover scale-x-[-1]"
            }`}
          />
          {/* Screen share badge on local PIP */}
          {isScreenSharing && (
            <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] font-medium text-emerald-300 flex items-center gap-1">
              <Monitor size={10} />
              <span>Sharing</span>
            </div>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPipMinimized(!pipMinimized); }}
            className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-sm rounded-full text-white flex items-center justify-center hover:bg-black/80 transition"
          >
            {pipMinimized ? <Maximize2 size={11} /> : <Minimize2 size={11} />}
          </button>
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div
        className={`absolute top-0 left-0 right-0 z-20 transition-all duration-400 ${
          showControls || !isConnected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-10 pb-14 px-6">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
              <ShieldCheck size={13} className="text-emerald-400" />
              <span className="text-[11px] font-medium text-emerald-300 tracking-wide">Encrypted</span>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-sm font-semibold tracking-wide">{callUser.fullName}</span>
              {isConnected && (
                <span className="text-xs font-mono text-gray-300 mt-0.5 tracking-widest">
                  {formatTime(callDuration)}
                </span>
              )}
            </div>

            <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">
              {isConnected ? (isScreenSharing ? "Screen Share" : "Video") : ""}
            </span>
          </div>
        </div>
      </div>

      {/* ── BOTTOM CONTROLS ── */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 transition-all duration-400 ${
          showControls || !isConnected ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-14 pb-10 sm:pb-12 px-6">
          <div className="flex items-center justify-center gap-3 sm:gap-6 max-w-md mx-auto">

            {/* Camera Switch */}
            <ControlBtn onClick={(e) => { e.stopPropagation(); switchCamera(); }} label="Switch camera">
              <RotateCcw size={20} />
            </ControlBtn>

            {/* Camera Toggle */}
            <ControlBtn
              onClick={(e) => { e.stopPropagation(); toggleCamera(); }}
              active={isCameraOff}
              label={isCameraOff ? "Turn on camera" : "Turn off camera"}
            >
              {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
            </ControlBtn>

            {/* Screen Share */}
            {callType === "video" && (
              <ControlBtn
                onClick={(e) => { e.stopPropagation(); toggleScreenShare(); }}
                active={isScreenSharing}
                label={isScreenSharing ? "Stop sharing" : "Share screen"}
              >
                {isScreenSharing ? <MonitorOff size={20} className="text-blue-400" /> : <MonitorUp size={20} />}
              </ControlBtn>
            )}

            {/* Mute Mic */}
            <ControlBtn
              onClick={(e) => { e.stopPropagation(); toggleMute(); }}
              active={isMuted}
              label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </ControlBtn>

            {/* End Call */}
            <ControlBtn onClick={(e) => { e.stopPropagation(); endCall(); }} danger label="End call">
              <PhoneOff size={22} />
            </ControlBtn>

          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallPage;