import React, { useEffect, useState, useCallback } from "react";
import { 
  MessageSquare, 
  Users, 
  Settings, 
  Search, 
  Plus, 
  UserPlus, 
  X, 
  Loader2, 
  LogOut, 
  Bell, 
  UsersRound,
  CheckCheck
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useChatStore from "../../store/useChatStore";
import useSocketStore from "../../store/useSocketStore";
import useAuthStore from "../../store/useAuthStore";
import useNotificationStore from "../../store/useNotificationStore";
import Avatar from "../../components/Avatar";
import Dialog from "../../components/Dialog";
import { useDialog } from "../../components/DialogProvider";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

// --- Sub-component: Status Viewer Modal ---
const StatusViewerModal = ({ group, activeIndex, setActiveIndex, onClose, onLike }) => {
  if (!group || !group.statuses || group.statuses.length === 0) return null;

  const currentStatus = group.statuses[activeIndex];

  const handlePrev = (e) => {
    e.stopPropagation();
    if (activeIndex > 0) {
      setActiveIndex(activeIndex - 1);
    } else {
      onClose();
    }
  };

  const handleNext = (e) => {
    e.stopPropagation();
    if (activeIndex < group.statuses.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Close Button */}
      <button
        onClick={onClose}
        aria-label="Close Status Viewer"
        className="absolute top-4 right-4 z-20 text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X size={24} />
      </button>

      {/* Progress Bars */}
      <div className="absolute top-4 left-4 right-16 z-20 flex gap-1.5">
        {group.statuses.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/30 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                i <= activeIndex ? "bg-white w-full" : "w-0"
              }`}
            />
          </div>
        ))}
      </div>

      {/* User Info Header */}
      <div className="absolute top-10 left-4 z-20 flex items-center gap-3">
        <img
          src={group.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.user?.username || "User")}`}
          alt=""
          className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
        />
        <div>
          <p className="text-white font-semibold text-sm leading-tight">{group.user?.fullName}</p>
          <p className="text-white/60 text-xs mt-0.5">
            {currentStatus?.createdAt 
              ? new Date(currentStatus.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : ""}
          </p>
        </div>
      </div>

      {/* Main Status Display */}
      <div className="max-w-lg w-full px-4 flex flex-col items-center justify-center z-10">
        {currentStatus?.mediaUrl && (
          <img
            src={currentStatus.mediaUrl}
            alt=""
            className="w-full max-h-[65vh] object-contain rounded-2xl shadow-2xl"
          />
        )}
        {currentStatus?.text && (
          <p className="text-white text-center text-lg font-medium mt-4 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
            {currentStatus.text}
          </p>
        )}
      </div>

      {/* Footer / Reactions */}
      <div className="absolute bottom-6 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-4 text-white/80 text-xs font-medium bg-black/40 px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-auto">
          <span>👁 {currentStatus?.views?.length || 0} views</span>
          <span>❤️ {currentStatus?.likes?.length || 0} likes</span>
        </div>
        <button
          onClick={() => onLike(currentStatus?._id)}
          aria-label="Like Status"
          className="text-white/90 hover:text-red-500 hover:scale-110 active:scale-95 transition-all text-2xl p-2 bg-black/40 rounded-full backdrop-blur-md pointer-events-auto"
        >
          ❤️
        </button>
      </div>

      {/* Left/Right Navigation Touch Areas */}
      <button
        aria-label="Previous Status"
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10 focus:outline-none"
        onClick={handlePrev}
      />
      <button
        aria-label="Next Status"
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10 focus:outline-none"
        onClick={handleNext}
      />
    </div>
  );
};

// --- Sub-component: Notification Item ---
const NotificationItem = ({ notif, onMarkRead, onClose }) => {
  const isUnread = !notif.isRead;

  const getTargetRoute = () => {
    switch (notif.type) {
      case "friend_request":
        return "/requests";
      case "friend_accept":
      case "missed_call":
        return "/chat";
      default:
        return "#";
    }
  };

  return (
    <div className={`flex items-start gap-3 p-3.5 hover:bg-gray-50 transition-colors ${isUnread ? "bg-blue-50/40" : ""}`}>
      <div className="shrink-0 w-9 h-9 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden mt-0.5">
        {notif.sender?.profileImage ? (
          <img src={notif.sender.profileImage} alt="" className="w-full h-full object-cover" />
        ) : (
          <Bell size={16} className="text-gray-400" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={getTargetRoute()}
          onClick={() => {
            if (isUnread) onMarkRead(notif._id);
            onClose();
          }}
          className="block focus:outline-none group"
        >
          <p className={`text-xs sm:text-sm leading-snug ${isUnread ? "text-gray-900 font-semibold" : "text-gray-600 font-normal"}`}>
            {notif.content}
          </p>
          <p className="text-[10px] text-gray-400 mt-1 font-medium">
            {new Date(notif.createdAt).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
        </Link>
      </div>

      {isUnread && (
        <button
          onClick={() => onMarkRead(notif._id)}
          className="shrink-0 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
          title="Mark as read"
        >
          <div className="w-2 h-2 rounded-full bg-black"></div>
        </button>
      )}
    </div>
  );
};

// --- Main Chat Sidebar Component ---
const ChatSidebar = () => {
  const { conversations, activeConversation, setActiveConversation, fetchConversations, markMessagesRead } = useChatStore();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications, markAsRead, markAllAsRead, notifications } = useNotificationStore();
  const socket = useSocketStore((state) => state.socket);
  const { showSuccess, showError } = useDialog();

  const location = useLocation();
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Status state
  const [statusGroups, setStatusGroups] = useState([]);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [activeStatusGroup, setActiveStatusGroup] = useState(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);

  const fetchStatuses = useCallback(async () => {
    try {
      const res = await axios.get("/api/status");
      setStatusGroups(res.data?.data?.statusGroups || []);
    } catch {
      // Gracefully handle missing or pending status feature endpoints
      setStatusGroups([]);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    fetchStatuses();
    fetchNotifications();
  }, [fetchConversations, fetchStatuses, fetchNotifications]);

  const openStatusViewer = (group) => {
    setActiveStatusGroup(group);
    setActiveStatusIndex(0);
    setShowStatusViewer(true);
  };

  const handleLikeStatus = async (statusId) => {
    if (!statusId) return;
    try {
      await axios.post(`/api/status/${statusId}/like`);
      showSuccess("Liked!", "You liked this status.");
      fetchStatuses();
    } catch {
      showError("Failed", "Failed to like status.");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleConversationClick = (conversation) => {
    setActiveConversation(conversation);
    if (conversation.unreadCount > 0) {
      markMessagesRead(conversation._id);
      
      if (socket) {
        const otherParticipant = conversation.participants?.find((p) => p._id !== user?._id);
        if (otherParticipant) {
          socket.emit("messageRead", { 
            conversationId: conversation._id,
            senderId: otherParticipant._id 
          });
        }
      }
    }
  };

  const getOtherParticipant = (conversation) => {
    if (conversation.isGroup) return null;
    return conversation.participants?.find((p) => p._id !== user?._id) || conversation.participants?.[0];
  };

  const getConversationName = (conversation) => {
    if (conversation.isGroup) return conversation.groupName || "Group Chat";
    const other = getOtherParticipant(conversation);
    return other?.fullName || "User";
  };

  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }
    
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const filteredConversations = conversations.filter((conversation) => {
    const name = getConversationName(conversation);
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <aside className="w-full md:w-[380px] flex flex-col border-r border-gray-200/80 bg-white/95 relative h-full shrink-0 select-none">
      {/* Header Section */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex justify-between items-center mb-5 relative">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="lg" showStatus={false} />
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Chats</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Button */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                aria-label="Notifications"
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all duration-200 active:scale-95 relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full ring-2 ring-white"></span>
                )}
              </button>

              {/* Notification Dialog */}
              {showNotifications && (
                <Dialog isOpen={showNotifications} onClose={() => setShowNotifications(false)} title="Notifications">
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-xs text-gray-500 font-medium">{unreadCount} unread</span>
                    {unreadCount > 0 && (
                      <button 
                        onClick={markAllAsRead} 
                        className="text-xs font-semibold text-black hover:underline flex items-center gap-1"
                      >
                        <CheckCheck size={14} /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
                          <Bell size={20} />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <NotificationItem
                          key={notif._id}
                          notif={notif}
                          onMarkRead={markAsRead}
                          onClose={() => setShowNotifications(false)}
                        />
                      ))
                    )}
                  </div>
                </Dialog>
              )}
            </div>

            {/* Find Friends Button */}
            <Link
              to="/search"
              aria-label="Find new friends"
              className="w-10 h-10 rounded-full bg-black hover:bg-gray-800 text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-md shadow-black/20"
            >
              <Plus size={22} />
            </Link>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      {statusGroups.length > 0 && (
        <div className="flex gap-3 overflow-x-auto pb-3 mb-3 px-5 scrollbar-none">
          {statusGroups.map((group) => {
            const isOwn = group.user?._id === user?._id;
            return (
              <button
                key={group.user?._id}
                onClick={() => openStatusViewer(group)}
                className="flex flex-col items-center gap-1 shrink-0 group focus:outline-none"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-gray-700 to-black group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={group.user?.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(group.user?.username || "User")}`}
                    alt=""
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
                <span className="text-[10px] text-gray-600 font-medium max-w-[60px] truncate">
                  {isOwn ? "You" : group.user?.fullName?.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      )}
      
      {/* Search Bar */}
      <div className="mx-5 mb-4 relative h-11 rounded-full flex items-center px-4 bg-gray-50/80 border border-gray-200 focus-within:border-black transition-all duration-200 shadow-inner">
        <Search size={18} className="text-gray-500 shrink-0" />
        <input 
          type="text" 
          placeholder="Search conversations..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent border-none text-gray-900 w-full h-full pl-3 outline-none text-sm placeholder-slate-500" 
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-3 pb-[90px] space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-3">
              <UserPlus size={20} />
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              {searchQuery ? "No matching conversations found." : "No conversations yet."}
            </p>
            <Link 
              to="/search" 
              className="mt-2 text-sm font-semibold text-black hover:underline"
            >
              Find friends to start chatting
            </Link>
          </div>
        ) : (
          filteredConversations.map((conversation) => {
            const isGroup = conversation.isGroup;
            const otherUser = isGroup ? null : getOtherParticipant(conversation);
            const isActive = activeConversation?._id === conversation._id;
            const hasUnread = conversation.unreadCount > 0 && !isActive;

            return (
              <div
                key={conversation._id}
                onClick={() => handleConversationClick(conversation)}
                className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all duration-200 group ${
                  isActive 
                    ? "bg-gray-100/80 border border-gray-300/60 shadow-md" 
                    : "hover:bg-gray-50/60 border border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative shrink-0 mr-3.5">
                  {isGroup ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white shadow-md">
                      <UsersRound size={20} />
                    </div>
                  ) : (
                    <div className="rounded-full p-0.5 bg-gray-100/50 ring-1 ring-slate-700/50">
                      <Avatar user={otherUser} size="lg" showStatus={false} />
                    </div>
                  )}
                </div>
                
                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 truncate mb-0.5">
                    {getConversationName(conversation)}
                  </div>
                  <p className={`text-xs sm:text-sm truncate ${
                    hasUnread ? "text-gray-900 font-medium" : "text-gray-500 font-normal"
                  }`}>
                    {conversation.lastMessage?.type === "image" && "📷 Image"}
                    {conversation.lastMessage?.type === "voice" && "🎤 Voice message"}
                    {conversation.lastMessage?.type === "file" && "📎 File"}
                    {conversation.lastMessage?.type === "text" && conversation.lastMessage.content}
                    {!conversation.lastMessage && "No messages yet"}
                  </p>
                </div>
                
                {/* Date & Unread Counter */}
                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                  <span className={`text-[11px] font-medium tracking-tight ${
                    hasUnread ? "text-black" : "text-gray-400"
                  }`}>
                    {formatTime(conversation.updatedAt)}
                  </span>
                  {hasUnread && (
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-black/30">
                      {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Bottom Dock Navbar */}
      <nav className="absolute bottom-4 left-4 right-4 h-16 rounded-full bg-gray-50/90 border border-gray-200 backdrop-blur-md flex items-center justify-around px-3 shadow-2xl z-20 mb-safe">
        <Link 
          to="/chat" 
          aria-label="Chats"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname === "/chat" 
              ? "bg-black text-white shadow-md shadow-black/20" 
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
          }`}
        >
          <MessageSquare size={20} fill={location.pathname === "/chat" ? "currentColor" : "none"} />
        </Link>
        <Link 
          to="/search" 
          aria-label="Search Friends"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname === "/search" 
              ? "bg-black text-white shadow-md shadow-black/20" 
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
          }`}
        >
          <Search size={20} />
        </Link>
        <Link 
          to="/requests" 
          aria-label="Friend Requests"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname === "/requests" 
              ? "bg-black text-white shadow-md shadow-black/20" 
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
          }`}
        >
          <Users size={20} />
        </Link>
        <Link 
          to={`/profile/${user?._id}`} 
          aria-label="Settings"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname.startsWith("/profile") 
              ? "bg-black text-white shadow-md shadow-black/20" 
              : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
          }`}
        >
          <Settings size={20} />
        </Link>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Logout"
          title="Logout"
          className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 text-gray-500 hover:text-red-500 hover:bg-red-50 disabled:opacity-50 active:scale-95"
        >
          {isLoggingOut ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <LogOut size={20} />
          )}
        </button>
      </nav>

      {/* Rendered Status Viewer Modal */}
      {showStatusViewer && (
        <StatusViewerModal
          group={activeStatusGroup}
          activeIndex={activeStatusIndex}
          setActiveIndex={setActiveStatusIndex}
          onClose={() => setShowStatusViewer(false)}
          onLike={handleLikeStatus}
        />
      )}
    </aside>
  );
};

export default ChatSidebar;