import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Loader2 } from "lucide-react";
import useAuthStore from "../store/useAuthStore";

const ProtectedRoute = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center space-y-4 p-4 text-gray-900">
        <div className="relative flex items-center justify-center">
          {/* Subtle Outer Glow */}
          <div className="absolute h-16 w-16 rounded-full bg-[#fc4a56]/20 blur-xl animate-pulse" />
          <Loader2 className="animate-spin text-[#fc4a56] relative z-10" size={40} />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-medium text-gray-800 tracking-wide">
            Loading your BuddyChat experience...
          </p>
          <p className="text-xs text-gray-400">Authenticating secure session</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If user hasn't set up profile, force them to profile setup page
  // unless they are already on the profile setup page
  if (
    user &&
    !user.isProfileSetup &&
    window.location.pathname !== "/profile-setup"
  ) {
    return <Navigate to="/profile-setup" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;