import React, { useState } from "react";
import useSocketStore from "../store/useSocketStore";

const Avatar = ({ user, size = "md", showStatus = true }) => {
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const [imgError, setImgError] = useState(false);

  if (!user) return null;

  const isOnline = onlineUsers.includes(String(user._id));

  // Size mapping configuration
  const sizeMap = {
    xs: { container: "w-6 h-6 text-[10px]", status: "w-2 h-2 bottom-0 right-0 border" },
    sm: { container: "w-8 h-8 text-xs", status: "w-2.5 h-2.5 bottom-0 right-0 border-2" },
    md: { container: "w-10 h-10 text-sm", status: "w-3 h-3 bottom-0 right-0 border-2" },
    lg: { container: "w-12 h-12 text-base", status: "w-3.5 h-3.5 bottom-0.5 right-0.5 border-2" },
    xl: { container: "w-16 h-16 text-xl", status: "w-4 h-4 bottom-1 right-1 border-2" },
    "2xl": { container: "w-20 h-20 text-2xl", status: "w-5 h-5 bottom-1 right-1 border-2" },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Status color configuration
  const getStatusBg = () => {
    if (isOnline) return "bg-emerald-500 shadow-emerald-500/50";
    if (user.status === "away") return "bg-amber-500 shadow-amber-500/50";
    return "bg-slate-500 shadow-slate-500/50";
  };

  // Get two initials
  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : user.username?.substring(0, 2).toUpperCase() || "??";

  // Construct image source URL safely
  const imageSrc =
    user.profileImage &&
    (user.profileImage.startsWith("http")
      ? user.profileImage
      : `${import.meta.env.VITE_API_URL || "http://localhost:5000"}${user.profileImage}`);

  return (
    <div className="relative inline-block shrink-0">
      {imageSrc && !imgError ? (
        <img
          src={imageSrc}
          alt={user.fullName || "User Avatar"}
          onError={() => setImgError(true)}
          className={`${currentSize.container} rounded-full object-cover border border-gray-300/60 shadow-md`}
        />
      ) : (
        <div
          className={`${currentSize.container} rounded-full bg-gradient-to-br from-slate-800 to-slate-900 border border-gray-300/80 text-gray-800 font-bold flex items-center justify-center shadow-md select-none`}
        >
          {initials}
        </div>
      )}

      {showStatus && (
        <span
          className={`absolute rounded-full border-slate-950 ${currentSize.status} ${getStatusBg()} shadow-sm`}
        />
      )}
    </div>
  );
};

export default Avatar;