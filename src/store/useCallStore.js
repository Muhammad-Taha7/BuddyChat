import { create } from "zustand";
import useSocketStore from "./useSocketStore";

const configuration = {
  iceServers: [
    { urls: ["stun:stun.l.google.com:19302", "stun:stun1.l.google.com:19302"] },
    { urls: ["stun:stun2.l.google.com:19302", "stun:stun3.l.google.com:19302"] },
    { urls: "stun:global.stun.twilio.com:3478" },
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
  iceCandidatePoolSize: 10,
};

const getMediaStream = async (type) => {
  if (type === "video") {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch {
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
      } catch {
        return await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true
        });
      }
    }
  } else {
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch {
      return await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: true
      });
    }
  }
};

const flushQueuedCandidates = async (pc, queue) => {
  if (!pc || !queue || queue.length === 0) return;
  for (const candidate of queue) {
    if (candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[WebRTC] Queued candidate error:", e);
      }
    }
  }
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
  facingMode: "user",
  callDuration: 0,
  callTimer: null,
  incomingCall: null,
  iceCandidatesQueue: [],
  remoteStreamUpdate: 0,
  isScreenSharing: false,
  isRemoteScreenSharing: false,
  originalVideoTrack: null,

  // ─── Timer ───
  startTimer: () => {
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
  setIncomingCall: (call) => set({
    incomingCall: call,
    callState: call ? "ringing" : null,
    callType: call ? call.callType : null,
    callUser: call ? call.fromUser : null,
  }),

  // ─── Initiate an outgoing call (Caller) ───
  initiateCall: async (otherUser, type) => {
    set({
      callUser: otherUser,
      callType: type,
      callState: "calling",
      iceCandidatesQueue: [],
      callDuration: 0,
      isMuted: false,
      isCameraOff: false,
      isScreenSharing: false,
      isRemoteScreenSharing: false,
    });

    let stream;
    try {
      stream = await getMediaStream(type);
    } catch (error) {
      console.error("Failed to get media devices:", error);
      import("react-hot-toast").then(m => m.toast.error("Microphone/Camera access failed. Please check permissions."));
      get().endCall();
      return;
    }

    const actualType = stream.getVideoTracks().length > 0 ? "video" : "voice";
    set({ localStream: stream, callType: actualType });

    try {
      const pc = new RTCPeerConnection(configuration);
      const remoteStream = new MediaStream();
      set({ peerConnection: pc, remoteStream });

      // Add local tracks to peer connection
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Receive remote tracks
      pc.ontrack = (event) => {
        console.log(`[WebRTC Caller] ontrack: ${event.track.kind}`);
        let rStream = event.streams && event.streams[0] ? event.streams[0] : null;
        if (!rStream) {
          rStream = get().remoteStream || new MediaStream();
          if (!rStream.getTracks().some(t => t.id === event.track.id)) {
            rStream.addTrack(event.track);
          }
        }
        set((state) => ({
          remoteStream: rStream,
          remoteStreamUpdate: state.remoteStreamUpdate + 1
        }));
      };

      // Send ICE candidates to peer
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          const socket = useSocketStore.getState().socket;
          const targetId = otherUser._id?.toString() || otherUser._id;
          socket?.emit("iceCandidate", {
            to: targetId,
            candidate: event.candidate,
          });
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log("[WebRTC Caller] Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          set({ callState: "connected" });
          get().startTimer();
        }
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const socket = useSocketStore.getState().socket;
      const targetId = otherUser._id?.toString() || otherUser._id;
      socket?.emit("callUser", {
        to: targetId,
        offer: pc.localDescription || offer,
        callType: actualType,
      });
      console.log("[Call] Emitting callUser to:", targetId, "type:", actualType);
    } catch (error) {
      console.error("[WebRTC Caller] Error creating offer:", error);
      import("react-hot-toast").then(m => m.toast.error("Call failed to initialize."));
      get().endCall();
    }
  },

  // ─── Answer an incoming call (Callee) ───
  answerCall: async (incomingCall) => {
    const { from, fromUser, offer, callType } = incomingCall;

    let stream;
    try {
      stream = await getMediaStream(callType);
    } catch (error) {
      console.error("Failed to get media for answering call:", error);
      import("react-hot-toast").then(m => m.toast.error("Microphone/Camera access denied."));
      get().receiveCallEnded();
      return;
    }

    const actualType = stream.getVideoTracks().length > 0 ? "video" : "voice";

    // Set UI to connected immediately
    set({
      callUser: fromUser,
      callType: actualType,
      callState: "connected",
      incomingCall: null,
      localStream: stream,
      isMuted: false,
      isCameraOff: false,
    });

    try {
      const pc = new RTCPeerConnection(configuration);
      const remoteStream = new MediaStream();
      set({ peerConnection: pc, remoteStream });

      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      pc.ontrack = (event) => {
        console.log(`[WebRTC Callee] ontrack: ${event.track.kind}`);
        let rStream = event.streams && event.streams[0] ? event.streams[0] : null;
        if (!rStream) {
          rStream = get().remoteStream || new MediaStream();
          if (!rStream.getTracks().some(t => t.id === event.track.id)) {
            rStream.addTrack(event.track);
          }
        }
        set((state) => ({
          remoteStream: rStream,
          remoteStreamUpdate: state.remoteStreamUpdate + 1
        }));
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
        console.log("[WebRTC Callee] Connection state:", pc.connectionState);
        if (pc.connectionState === "connected") {
          get().startTimer();
        }
      };

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      // Flush queued candidates
      const queue = get().iceCandidatesQueue;
      set({ iceCandidatesQueue: [] });
      await flushQueuedCandidates(pc, queue);

      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = useSocketStore.getState().socket;
      socket?.emit("answerCall", {
        to: from,
        answer: pc.localDescription || answer,
      });

      get().startTimer();
    } catch (error) {
      console.error("[WebRTC Callee] Error answering call:", error);
      import("react-hot-toast").then(m => m.toast.error("Error answering call."));
    }
  },

  // ─── Handle other peer's answer (Caller) ───
  handleAnswer: async (answer) => {
    console.log("[WebRTC Caller] handleAnswer received:", answer);
    const pc = get().peerConnection;
    if (!pc) {
      console.warn("[WebRTC Caller] No peerConnection found in handleAnswer");
      return;
    }

    try {
      if (pc.signalingState === "have-local-offer") {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        const queue = get().iceCandidatesQueue;
        set({ iceCandidatesQueue: [] });
        await flushQueuedCandidates(pc, queue);
      }

      // Transition Caller's UI to connected!
      set({ callState: "connected" });
      get().startTimer();
    } catch (error) {
      console.error("[WebRTC Caller] Error in handleAnswer:", error);
      // Still set connected so UI doesn't freeze in calling state
      set({ callState: "connected" });
      get().startTimer();
    }
  },

  // ─── Handle ICE candidates ───
  handleIceCandidate: async (candidate) => {
    if (!candidate) return;
    const pc = get().peerConnection;
    if (pc && pc.remoteDescription && pc.remoteDescription.type) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.warn("[WebRTC] Error adding ICE candidate:", e);
      }
    } else {
      set((state) => ({
        iceCandidatesQueue: [...state.iceCandidatesQueue, candidate],
      }));
    }
  },

  // ─── Toggle microphone ───
  toggleMute: () => {
    const { localStream, isMuted } = get();
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
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
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: newFacing } },
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
    } catch {
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

  // ─── Toggle screen share ───
  toggleScreenShare: async () => {
    const { localStream, peerConnection, isScreenSharing, originalVideoTrack, callUser } = get();
    if (!localStream || !peerConnection) return;
    const socket = useSocketStore.getState().socket;

    if (isScreenSharing) {
      const senders = peerConnection.getSenders();
      const videoSender = senders.find(s => s.track?.kind === "video" || s.track === null);
      if (videoSender && originalVideoTrack) {
        try {
          await videoSender.replaceTrack(originalVideoTrack);
        } catch (e) {
          console.warn("Error replacing original video track:", e);
        }
      }

      const screenTrack = localStream.getVideoTracks()[0];
      if (screenTrack) screenTrack.stop();

      if (originalVideoTrack) {
        originalVideoTrack.enabled = !get().isCameraOff;
      }

      const newLocalStream = new MediaStream(
        originalVideoTrack 
          ? [originalVideoTrack, ...localStream.getAudioTracks()]
          : localStream.getAudioTracks()
      );
      
      socket?.emit("screenShareStatus", {
        to: callUser?._id?.toString() || callUser?._id,
        isScreenSharing: false,
      });

      set({ 
        localStream: newLocalStream, 
        isScreenSharing: false,
        originalVideoTrack: null
      });
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        if (!screenTrack) return;

        const currentVideoTrack = localStream.getVideoTracks()[0];
        
        screenTrack.onended = () => {
          if (get().isScreenSharing) {
            get().toggleScreenShare();
          }
        };

        const senders = peerConnection.getSenders();
        const videoSender = senders.find(s => s.track && s.track.kind === "video") || senders.find(s => !s.track);
        if (videoSender) {
          await videoSender.replaceTrack(screenTrack);
        } else {
          peerConnection.addTrack(screenTrack, screenStream);
        }

        const newLocalStream = new MediaStream([screenTrack, ...localStream.getAudioTracks()]);

        socket?.emit("screenShareStatus", {
          to: callUser?._id?.toString() || callUser?._id,
          isScreenSharing: true,
        });

        set({
          localStream: newLocalStream,
          isScreenSharing: true,
          originalVideoTrack: currentVideoTrack,
          isCameraOff: false
        });
      } catch (error) {
        console.warn("Screen share cancelled or failed:", error);
      }
    }
  },

  // ─── Reject incoming call ───
  rejectCall: (call) => {
    const callData = call || get().incomingCall;
    if (callData) {
      const socket = useSocketStore.getState().socket;
      socket?.emit("rejectCall", { to: callData.from });
    }
    set({
      incomingCall: null,
      callState: null,
      callType: null,
      callUser: null,
      iceCandidatesQueue: [],
    });
  },

  // ─── End the call ───
  endCall: () => {
    const { peerConnection, localStream, callTimer, callUser, callState } = get();

    if (callState && callUser) {
      const socket = useSocketStore.getState().socket;
      const targetId = callUser._id?.toString() || callUser._id;
      socket?.emit("endCall", { to: targetId });
    }

    if (peerConnection) {
      try {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.close();
      } catch {}
    }

    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    const { originalVideoTrack } = get();
    if (originalVideoTrack) {
      originalVideoTrack.stop();
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
      remoteStreamUpdate: 0,
      isScreenSharing: false,
      isRemoteScreenSharing: false,
      originalVideoTrack: null,
    });
  },

  // ─── Call ended by other peer ───
  receiveCallEnded: () => {
    const { peerConnection, localStream, callTimer } = get();

    if (peerConnection) {
      try {
        peerConnection.ontrack = null;
        peerConnection.onicecandidate = null;
        peerConnection.onconnectionstatechange = null;
        peerConnection.close();
      } catch {}
    }
    if (localStream) localStream.getTracks().forEach((track) => track.stop());
    const { originalVideoTrack } = get();
    if (originalVideoTrack) originalVideoTrack.stop();

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
      remoteStreamUpdate: 0,
      isScreenSharing: false,
      isRemoteScreenSharing: false,
      originalVideoTrack: null,
    });
  },
}));

export default useCallStore;
