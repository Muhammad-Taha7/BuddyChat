import React, { useEffect, useState } from "react";
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
  UsersRound 
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useChatStore from "../../store/useChatStore";
import useSocketStore from "../../store/useSocketStore";
import useAuthStore from "../../store/useAuthStore";
import Avatar from "../../components/Avatar";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

import Dialog from "../../components/Dialog";
import useNotificationStore from "../../store/useNotificationStore";

const ChatSidebar = () => {
  const { conversations, activeConversation, setActiveConversation, fetchConversations, markMessagesRead } = useChatStore();
  const { user, logout } = useAuthStore();
  const { unreadCount, fetchNotifications, markAsRead, markAllAsRead, notifications } = useNotificationStore();
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

  useEffect(() => {
    fetchConversations();
    fetchStatuses();
    fetchNotifications();
  }, [fetchConversations, fetchNotifications]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get("/api/status");
      setStatusGroups(res.data.data.statusGroups || []);
    } catch (err) {
      // Status API might not be ready
    }
  };

  const openStatusViewer = (group) => {
    setActiveStatusGroup(group);
    setActiveStatusIndex(0);
    setShowStatusViewer(true);
  };

  const handleLikeStatus = async (statusId) => {
    if (!statusId) return;
    try {
      await axios.post(`/api/status/${statusId}/like`);
      toast.success("Liked status");
      // Optionally refresh status list
      fetchStatuses();
    } catch (err) {
      toast.error("Failed to like status");
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
      
      const socket = useSocketStore.getState().socket;
      if (socket) {
        const otherParticipant = conversation.participants.find(p => p._id !== user._id);
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
    return conversation.participants.find((p) => p._id !== user._id) || conversation.participants[0];
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
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
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
                  <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center flex flex-col items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
                          <Bell size={20} />
                        </div>
                        <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {notifications.map((notif) => (
                          <div
                            key={notif._id}
                            className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
                          >
                            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                              {notif.sender?.profileImage ? (
                                <img src={notif.sender.profileImage} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              )}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <Link
                                to={notif.type === "friend_request" ? "/requests" : notif.type === "friend_accept" ? `/chat` : notif.type === "missed_call" ? `/chat` : "#"}
                                onClick={() => {
                                  if (!notif.isRead) markAsRead(notif._id);
                                  setShowNotifications(false);
                                }}
                                className="block focus:outline-none"
                              >
                                <p className={`text-sm ${!notif.isRead ? 'text-gray-900 font-semibold' : 'text-gray-700 font-medium'}`}>
                                  {notif.content}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </Link>
                            </div>
                            
                            {!notif.isRead && (
                              <button
                                onClick={() => markAsRead(notif._id)}
                                className="shrink-0 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                                title="Mark as read"
                              >
                                <div className="w-2 h-2 rounded-full bg-black"></div>
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Dialog>
              )}
            </div>

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
            const isOwn = group.user._id === user._id;
            return (
              <button
                key={group.user._id}
                onClick={() => openStatusViewer(group)}
                className="flex flex-col items-center gap-1 shrink-0"
              >
                <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-gray-700 to-black">
                  <img
                    src={group.user.profileImage || `https://ui-avatars.com/api/?name=${group.user.username}`}
                    alt=""
                    className="w-full h-full rounded-full object-cover border-2 border-white"
                  />
                </div>
                <span className="text-[10px] text-gray-600 font-medium max-w-[60px] truncate">
                  {isOwn ? "You" : group.user.fullName?.split(' ')[0]}
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
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm sm:text-base text-gray-900 truncate mb-0.5">
                    {getConversationName(conversation)}
                  </div>
                  <p className={`text-xs sm:text-sm truncate ${
                    hasUnread ? 'text-gray-900 font-medium' : 'text-gray-500 font-normal'
                  }`}>
                    {conversation.lastMessage?.type === 'image' && '📷 Image'}
                    {conversation.lastMessage?.type === 'voice' && '🎤 Voice message'}
                    {conversation.lastMessage?.type === 'file' && '📎 File'}
                    {conversation.lastMessage?.type === 'text' && conversation.lastMessage.content}
                    {!conversation.lastMessage && 'No messages yet'}
                  </p>
                </div>
                
                {/* Date & Unread */}
                <div className="flex flex-col items-end gap-1.5 ml-3 shrink-0">
                  <span className={`text-[11px] font-medium tracking-tight ${
                    hasUnread ? 'text-black' : 'text-gray-400'
                  }`}>
                    {formatTime(conversation.updatedAt)}
                  </span>
                  {hasUnread && (
                    <span className="bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-black/30">
                      {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Dock Navbar */}
      <nav className="absolute bottom-4 left-4 right-4 h-16 rounded-full bg-gray-50/90 border border-gray-200 backdrop-blur-md flex items-center justify-around px-3 shadow-2xl z-20">
        <Link 
          to="/chat" 
          aria-label="Chats"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname === '/chat' 
              ? 'bg-black text-white shadow-md shadow-black/20' 
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
          }`}
        >
          <MessageSquare size={20} fill={location.pathname === '/chat' ? 'currentColor' : 'none'} />
        </Link>
        <Link 
          to="/search" 
          aria-label="Search Friends"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname === '/search' 
              ? 'bg-black text-white shadow-md shadow-black/20' 
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
          }`}
        >
          <Search size={20} />
        </Link>
        <Link 
          to="/requests" 
          aria-label="Friend Requests"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname === '/requests' 
              ? 'bg-black text-white shadow-md shadow-black/20' 
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
          }`}
        >
          <Users size={20} />
        </Link>
        <Link 
          to={`/profile/${user?._id}`} 
          aria-label="Settings"
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all duration-200 ${
            location.pathname.startsWith('/profile') 
              ? 'bg-black text-white shadow-md shadow-black/20' 
              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100/50'
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

      {/* Status Viewer Modal */}
      {showStatusViewer && activeStatusGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
          <button
            onClick={() => setShowStatusViewer(false)}
            className="absolute top-4 right-4 z-10 text-white/80 hover:text-white"
          >
            <X size={28} />
          </button>

          {/* Progress bars */}
          <div className="absolute top-4 left-4 right-16 flex gap-1">
            {activeStatusGroup.statuses.map((_, i) => (
              <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-300 ${
                  i <= activeStatusIndex ? 'bg-white w-full' : 'w-0'
                }`} />
              </div>
            ))}
          </div>

          {/* User info */}
          <div className="absolute top-8 left-4 flex items-center gap-3">
            <img
              src={activeStatusGroup.user.profileImage || `https://ui-avatars.com/api/?name=${activeStatusGroup.user.username}`}
              alt=""
              className="w-10 h-10 rounded-full object-cover border-2 border-white/30"
            />
            <div>
              <p className="text-white font-semibold text-sm">{activeStatusGroup.user.fullName}</p>
              <p className="text-white/60 text-xs">
                {new Date(activeStatusGroup.statuses[activeStatusIndex]?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          {/* Status Content */}
          <div className="max-w-lg w-full px-4">
            {activeStatusGroup.statuses[activeStatusIndex]?.mediaUrl && (
              <img
                src={activeStatusGroup.statuses[activeStatusIndex].mediaUrl}
                alt=""
                className="w-full max-h-[70vh] object-contain rounded-2xl"
              />
            )}
            {activeStatusGroup.statuses[activeStatusIndex]?.text && (
              <p className="text-white text-center text-lg mt-4">{activeStatusGroup.statuses[activeStatusIndex].text}</p>
            )}
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-6 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-white/70 text-xs">
              <span>👁 {activeStatusGroup.statuses[activeStatusIndex]?.views?.length || 0} views</span>
              <span>❤️ {activeStatusGroup.statuses[activeStatusIndex]?.likes?.length || 0} likes</span>
            </div>
            <button
              onClick={() => handleLikeStatus(activeStatusGroup.statuses[activeStatusIndex]?._id)}
              className="text-white/80 hover:text-red-400 transition-colors text-2xl"
            >
              ❤️
            </button>
          </div>

          {/* Navigation areas */}
          <button
            aria-label="Previous Status"
            className="absolute left-0 top-0 bottom-0 w-1/3"
            onClick={() => {
              if (activeStatusIndex > 0) setActiveStatusIndex(activeStatusIndex - 1);
              else setShowStatusViewer(false);
            }}
          />
          <button
            aria-label="Next Status"
            className="absolute right-0 top-0 bottom-0 w-1/3"
            onClick={() => {
              if (activeStatusIndex < activeStatusGroup.statuses.length - 1) {
                setActiveStatusIndex(activeStatusIndex + 1);
              } else {
                setShowStatusViewer(false);
              }
            }}
          />
        </div>
      )}
    </aside>
  );
};

export default ChatSidebar;