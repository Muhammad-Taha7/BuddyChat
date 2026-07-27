import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster, toast } from "react-hot-toast";
import { GoogleOAuthProvider } from "@react-oauth/google";

// State
import useAuthStore from "./store/useAuthStore";
import useSocketStore from "./store/useSocketStore";
import useCallStore from "./store/useCallStore";

// Components
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import IncomingCallModal from "./components/IncomingCallModal";

// Pages
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import OtpVerifyPage from "./pages/auth/OtpVerifyPage";
import ProfileSetupPage from "./pages/profile/ProfileSetupPage";

// Call Pages
import VideoCallPage from "./pages/call/VideoCallPage";
import VoiceCallPage from "./pages/call/VoiceCallPage";

import ChatLayout from "./pages/chat/ChatLayout";
import SearchPage from "./pages/user/SearchPage";
import FriendRequestsPage from "./pages/user/FriendRequestsPage";
import ProfilePage from "./pages/user/ProfilePage";

import AdminLayout from "./pages/admin/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import UserManagement from "./pages/admin/UserManagement";
import MessageMonitor from "./pages/admin/MessageMonitor";

// Run Portal (Standalone Admin)
import RunLoginPage from "./pages/run/RunLoginPage";
import RunAdminRoute from "./components/RunAdminRoute";
import RunLayout from "./pages/run/RunLayout";
import RunDashboard from "./pages/run/RunDashboard";
import RunUsers from "./pages/run/RunUsers";
import RunMessages from "./pages/run/RunMessages";

export const App = () => {
  const { user, token, checkAuth } = useAuthStore();
  const { connect, disconnect, socket } = useSocketStore();
  const { callState, callType } = useCallStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (user && token) {
      connect(token);
    } else {
      disconnect();
    }
  }, [user, token, connect, disconnect]);

  // WebRTC socket listeners
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (call) => {
      console.log("[Socket] incomingCall received:", call);
      useCallStore.getState().setIncomingCall(call);
    };

    const handleCallAnswered = ({ answer }) => {
      useCallStore.getState().handleAnswer(answer);
    };

    const handleIceCandidate = ({ candidate }) => {
      useCallStore.getState().handleIceCandidate(candidate);
    };

    const handleCallEnded = () => {
      useCallStore.getState().receiveCallEnded();
      toast("Call ended", { icon: "📞" });
    };

    const handleCallRejected = () => {
      useCallStore.getState().receiveCallEnded();
      toast.error("Call declined");
    };

    const handleCallFailed = ({ message }) => {
      useCallStore.getState().receiveCallEnded();
      toast.error(message || "User is offline or unavailable");
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAnswered", handleCallAnswered);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callEnded", handleCallEnded);
    socket.on("callRejected", handleCallRejected);
    socket.on("callFailed", handleCallFailed);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAnswered", handleCallAnswered);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callEnded", handleCallEnded);
      socket.off("callRejected", handleCallRejected);
      socket.off("callFailed", handleCallFailed);
    };
  }, [socket]);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "placeholder-client-id";

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#1A1A2E",
              color: "#FFFFFF",
              border: "1px solid rgba(255,255,255,0.1)",
            },
            success: {
              iconTheme: {
                primary: "#22C55E",
                secondary: "#fff",
              },
            },
            error: {
              iconTheme: {
                primary: "#EF4444",
                secondary: "#fff",
              },
            },
          }}
        />

        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/verify-otp" element={<OtpVerifyPage />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile-setup" element={<ProfileSetupPage />} />
            
            <Route path="/chat" element={<ChatLayout />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/requests" element={<FriendRequestsPage />} />
            <Route path="/profile/:id" element={<ProfilePage />} />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/chat" replace />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="messages" element={<MessageMonitor />} />
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
            </Route>
          </Route>

          {/* Run (Standalone Admin) Routes */}
          <Route path="/run" element={<RunLoginPage />} />
          <Route path="/run" element={<RunAdminRoute />}>
            <Route element={<RunLayout />}>
              <Route path="Dashboard" element={<RunDashboard />} />
              <Route path="Users" element={<RunUsers />} />
              <Route path="Messages" element={<RunMessages />} />
            </Route>
          </Route>

          {/* Catch All */}
          <Route path="*" element={<Navigate to="/chat" replace />} />
        </Routes>

        {/* Incoming call overlay — shown when someone calls you */}
        <IncomingCallModal />

        {/* Active call pages — only when you are the caller or call is connected */}
        {(callState === "calling" || callState === "connected") && (
          callType === "video" ? <VideoCallPage /> : <VoiceCallPage />
        )}

      </BrowserRouter>
    </GoogleOAuthProvider>
  );
};
