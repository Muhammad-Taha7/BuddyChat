import { create } from "zustand";
import useSocketStore from "./useSocketStore";

const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// High-quality audio constraints for clear voice calls
const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000,
  channelCount: 1,
};

// High-quality video constraints
const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 60 },
  facingMode: "user",
};

const useCallStore = create((set, get) => ({
  callState: null, // null | 'calling' | 'ringing' | 'connected'
  callType: null, // 'video' | 'voice'
  callUser: null,
  localStream: null,
  remoteStream: null,
  peerConnection: null,
  isMuted: false,
  isCameraOff: false,
  facingMode: "user", // 'user' = front, 'environment' = back
  callDuration: 0,
  callTimer: null,
  incomingCall: null,
  iceCandidatesQueue: [],

  // ─── Timer ───
  startTimer: () => {
    // Prevent duplicate timers
    const existing = get().callTimer;
    if (existing) clearInterval(existing);

    const timer = setInterval(() => {
      set((state) => ({ callDuration: state.callDuration + 1 }));
    }, 1000);
    set({ callTimer: timer });
  },

  // ─── Simple setters ───
  setCallState: (state) => set({ callState: state }),
  setCallType: (type) => set({ callType: type }),
  setCallUser: (user) => set({ callUser: user }),
  // When an incoming call arrives, also mark callState as 'ringing'
  setIncomingCall: (call) => set({
    incomingCall: call,
    callState: call ? "ringing" : null,
    callType: call ? call.callType : null,
    callUser: call ? call.fromUser : null,
  }),

  // ─── Initiate an outgoing call ───
  initiateCall: async (otherUser, type) => {
    set({
      callUser: otherUser,
      callType: type,
      callState: "calling",
      iceCandidatesQueue: [],
      callDuration: 0,
    });

    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: type === "video" ? VIDEO_CONSTRAINTS : false,
        audio: AUDIO_CONSTRAINTS,
      });
    } catch (error) {
      console.warn("Failed to get media:", error);
      if (type === "video") {
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: AUDIO_CONSTRAINTS });
          type = "voice";
          import("react-hot-toast").then(m => m.toast("Camera unavailable, using voice only", { icon: "⚠️" }));
        } catch (e2) {
          import("react-hot-toast").then(m => m.toast.error("Microphone unavailable. Call failed."));
          get().endCall();
          return;
        }
      } else {
        import("react-hot-toast").then(m => m.toast.error("Microphone unavailable. Call failed."));
        get().endCall();
        return;
      }
    }

    set({ localStream: stream, callType: type });

    try {
      const pc = new RTCPeerConnection(configuration);
      set({ peerConnection: pc });

      // Create the remote stream object up front
      const remoteStream = new MediaStream();
      set({ remoteStream });

      // Add local tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Receive remote tracks
      pc.ontrack = (event) => {
        console.log(`[WebRTC] Receiving ${event.track.kind} track from peer`);
        set((state) => {
          // Always create a fresh MediaStream array to force React to re-render
          const existingTracks = state.remoteStream ? state.remoteStream.getTracks() : [];
          // Avoid duplicate tracks
          if (!existingTracks.find(t => t.id === event.track.id)) {
            existingTracks.push(event.track);
          }
          return { remoteStream: new MediaStream(existingTracks) };
        });
      };

      // Send ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          socket?.emit("iceCandidate", {
            to: otherUser._id,
            candidate: event.candidate,
          });
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          console.log("WebRTC connection lost:", pc.connectionState);
          get().endCall();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = useSocketStore.getState().socket;
      socket?.emit("callUser", {
        to: otherUser._id?.toString() || otherUser._id,
        offer,
        callType: type,
      });
      console.log("[Call] Emitting callUser to:", otherUser._id?.toString(), "type:", type);
    } catch (error) {
      console.error("Error accessing media devices or WebRTC:", error);
      import("react-hot-toast").then(m => m.toast.error("Call failed to initialize."));
      get().endCall();
    }
  },

  // ─── Answer an incoming call ───
  answerCall: async (incomingCall) => {
    const { from, fromUser, offer, callType } = incomingCall;

    let stream;
    let actualCallType = callType;

    // First try to get media before changing UI state
    try {
      if (callType === "video") {
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: VIDEO_CONSTRAINTS,
            audio: AUDIO_CONSTRAINTS,
          });
        } catch (e1) {
          // fallback to voice
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: AUDIO_CONSTRAINTS });
            actualCallType = "voice";
            import("react-hot-toast").then(m => m.toast("Camera unavailable, answering with voice", { icon: "⚠️" }));
          } catch (e2) {
            import("react-hot-toast").then(m => m.toast.error("Microphone unavailable. Cannot answer."));
            get().receiveCallEnded(); // clear incoming call
            return;
          }
        }
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: AUDIO_CONSTRAINTS,
        });
      }
    } catch (error) {
      import("react-hot-toast").then(m => m.toast.error("Microphone unavailable. Call failed."));
      get().receiveCallEnded();
      return;
    }

    // Now that we have media, change the UI to connected state
    set({
      callUser: fromUser,
      callType: actualCallType,
      callState: "connected",
      incomingCall: null,
      localStream: stream,
    });

    try {
      const pc = new RTCPeerConnection(configuration);
      set({ peerConnection: pc });

      const remoteStream = new MediaStream();
      set({ remoteStream });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log(`[WebRTC] Receiving ${event.track.kind} track`);
        set((state) => {
          const existingTracks = state.remoteStream ? state.remoteStream.getTracks() : [];
          if (!existingTracks.find(t => t.id === event.track.id)) {
            existingTracks.push(event.track);
          }
          return { remoteStream: new MediaStream(existingTracks) };
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          socket?.emit("iceCandidate", {
            to: from,
            candidate: event.candidate,
          });
        }
      };

      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "disconnected" || pc.connectionState === "failed") {
          console.log("WebRTC connection lost:", pc.connectionState);
          get().receiveCallEnded();
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued ICE candidates
      const queue = get().iceCandidatesQueue;
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Failed to add queued ICE candidate:", e);
        }
      }
      set({ iceCandidatesQueue: [] });

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = useSocketStore.getState().socket;
      socket?.emit("answerCall", {
        to: from,
        answer,
      });

      get().startTimer();
    } catch (error) {
      console.error("Error answering call:", error);
      import("react-hot-toast").then(m => m.toast.error(`Error answering call: ${error.message || 'Unknown error'}`));
      get().endCall();
    }
  },


  // ─── Handle the other peer's answer ───
  handleAnswer: async (answer) => {
    const pc = get().peerConnection;
    if (pc && pc.signalingState !== "closed") {
      if (pc.signalingState !== "have-local-offer") {
        console.warn(`[WebRTC] Ignoring answer. signalingState is ${pc.signalingState}`);
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));

        // Flush queued ICE candidates
        const queue = get().iceCandidatesQueue;
        for (const candidate of queue) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (e) {
            console.warn("Failed to add queued ICE candidate:", e);
          }
        }
        set({ iceCandidatesQueue: [] });

        set({ callState: "connected" });
        get().startTimer();
      } catch (error) {
        console.error("Error setting remote description from answer:", error);
        import("react-hot-toast").then(m => m.toast.error(`Error connecting to peer: ${error.message || 'Unknown error'}`));
        get().endCall();
      }
    }
  },

  // ─── Handle ICE candidates (queue if remote desc not set yet) ───
  handleIceCandidate: async (candidate) => {
    const pc = get().peerConnection;
    if (pc) {
      if (pc.remoteDescription && pc.remoteDescription.type) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.warn("Failed to add ICE candidate:", e);
        }
      } else {
        set((state) => ({
          iceCandidatesQueue: [...state.iceCandidatesQueue, candidate],
        }));
      }
    }
  },

  // ─── Toggle microphone ───
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted; // toggle: if muted, enable; if not, disable
      });
      set({ isMuted: !isMuted });
    }
  },

  // ─── Toggle camera ───
  toggleCamera: () => {
    const { localStream, isCameraOff } = get();
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isCameraOff;
      });
      set({ isCameraOff: !isCameraOff });
    }
  },

  // ─── Switch camera (front/back) ───
  switchCamera: async () => {
    const { localStream, peerConnection, facingMode, callType } = get();
    if (!localStream || !peerConnection || callType !== "video") return;

    const newFacing = facingMode === "user" ? "environment" : "user";

    try {
      // Get new video stream with opposite camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacing } },
        audio: false,
      });

      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) return;

      // Replace video track on the peer connection
      const sender = peerConnection.getSenders().find(s => s.track?.kind === "video");
      if (sender) {
        await sender.replaceTrack(newVideoTrack);
      }

      // Stop old video track and create a new MediaStream object to trigger React re-render
      const oldVideoTrack = localStream.getVideoTracks()[0];
      if (oldVideoTrack) oldVideoTrack.stop();
      
      const newLocalStream = new MediaStream([newVideoTrack, ...localStream.getAudioTracks()]);
      set({ facingMode: newFacing, localStream: newLocalStream, isCameraOff: false });
    } catch (error) {
      // If exact facingMode fails (e.g., laptop with single camera), try without exact
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newFacing },
          audio: false,
        });

        const newVideoTrack = newStream.getVideoTracks()[0];
        if (!newVideoTrack) return;

        const sender = peerConnection.getSenders().find(s => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(newVideoTrack);
        }

        const oldVideoTrack = localStream.getVideoTracks()[0];
        if (oldVideoTrack) oldVideoTrack.stop();
        
        const newLocalStream = new MediaStream([newVideoTrack, ...localStream.getAudioTracks()]);
        set({ facingMode: newFacing, localStream: newLocalStream, isCameraOff: false });
      } catch (e2) {
        console.warn("Camera switch not available:", e2.message);
      }
    }
  },

  // ─── Reject incoming call (callee declines) ───
  rejectCall: (call) => {
    const callData = call || get().incomingCall;
    if (callData) {
      const socket = useSocketStore.getState().socket;
      socket?.emit("rejectCall", { to: callData.from });
    }
    // Reset ALL call state so UI goes back to normal
    set({
      incomingCall: null,
      callState: null,
      callType: null,
      callUser: null,
      iceCandidatesQueue: [],
    });
  },

  // ─── End the call (initiated by this user) ───
  endCall: () => {
    const { peerConnection, localStream, callTimer, callUser, callState } = get();

    if (callState && callUser) {
      const socket = useSocketStore.getState().socket;
      socket?.emit("endCall", { to: callUser._id });
    }

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }

    if (callTimer) {
      clearInterval(callTimer);
    }

    set({
      callState: null,
      callType: null,
      callUser: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isCameraOff: false,
      callDuration: 0,
      callTimer: null,
      incomingCall: null,
      iceCandidatesQueue: [],
    });
  },

  // ─── Call ended by the other peer ───
  receiveCallEnded: () => {
    const { peerConnection, localStream, callTimer } = get();

    if (peerConnection) {
      peerConnection.ontrack = null;
      peerConnection.onicecandidate = null;
      peerConnection.onconnectionstatechange = null;
      peerConnection.close();
    }
    if (localStream) localStream.getTracks().forEach((track) => track.stop());
    if (callTimer) clearInterval(callTimer);

    set({
      callState: null,
      callType: null,
      callUser: null,
      localStream: null,
      remoteStream: null,
      peerConnection: null,
      isMuted: false,
      isCameraOff: false,
      callDuration: 0,
      callTimer: null,
      incomingCall: null,
      iceCandidatesQueue: [],
    });
  },
}));

export default useCallStore;
