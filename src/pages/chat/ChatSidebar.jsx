import React, { useEffect, useState } from "react";
import { MessageSquare, Users, Settings, Search, Plus, UserPlus, UsersRound, X, Loader2, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useChatStore from "../../store/useChatStore";
import useSocketStore from "../../store/useSocketStore";
import useAuthStore from "../../store/useAuthStore";
import Avatar from "../../components/Avatar";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

const ChatSidebar = () => {
  const { conversations, activeConversation, setActiveConversation, fetchConversations, markMessagesRead } = useChatStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupFriends, setGroupFriends] = useState([]);
  const [selectedGroupMembers, setSelectedGroupMembers] = useState([]);
  const [creatingGroup, setCreatingGroup] = useState(false);

  // Status state
  const [statusGroups, setStatusGroups] = useState([]);
  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [activeStatusGroup, setActiveStatusGroup] = useState(null);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);

  useEffect(() => {
    fetchConversations();
    fetchStatuses();
  }, [fetchConversations]);

  const fetchStatuses = async () => {
    try {
      const res = await axios.get("/api/status");
      setStatusGroups(res.data.data.statusGroups || []);
    } catch (err) {
      // Status API might not be ready
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

  const getConversationAvatar = (conversation) => {
    if (conversation.isGroup) return null;
    return getOtherParticipant(conversation);
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

  // Group creation
  const openGroupModal = async () => {
    setShowGroupModal(true);
    try {
      const res = await axios.get("/api/users/friends");
      setGroupFriends(res.data.data.friends || []);
    } catch (err) {
      toast.error("Failed to load friends");
    }
  };

  const toggleMember = (id) => {
    setSelectedGroupMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return toast.error("Enter a group name");
    if (selectedGroupMembers.length === 0) return toast.error("Select at least one member");

    setCreatingGroup(true);
    try {
      const res = await axios.post("/api/chat/group", {
        name: groupName,
        participants: selectedGroupMembers,
      });
      toast.success("Group created!");
      fetchConversations();
      setShowGroupModal(false);
      setGroupName("");
      setSelectedGroupMembers([]);
    } catch (err) {
      toast.error("Failed to create group");
    } finally {
      setCreatingGroup(false);
    }
  };

  // Status viewer
  const openStatusViewer = async (group) => {
    setActiveStatusGroup(group);
    setActiveStatusIndex(0);
    setShowStatusViewer(true);
    // Mark as viewed
    try {
      await axios.put(`/api/status/${group.statuses[0]._id}/view`);
    } catch (e) {}
  };

  const handleLikeStatus = async (statusId) => {
    try {
      await axios.put(`/api/status/${statusId}/like`);
      fetchStatuses();
    } catch (e) {}
  };

  const handleStatusUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("profileImage", file);
    try {
      const uploadRes = await axios.put("/api/users/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Now create status with that URL
      const mediaUrl = uploadRes.data.data.user.profileImage;
      // Use a separate upload for status
    } catch (err) {
      // Simplified: directly upload for status via the profile endpoint
    }
  };

  return (
    <aside className="w-full md:w-[380px] flex flex-col border-r border-gray-200/80 bg-white/95 relative h-full shrink-0 select-none">
      {/* Header Section */}
      <div className="p-5 sm:p-6 pb-4">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-3">
            <Avatar user={user} size="lg" showStatus={false} />
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Chats</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={openGroupModal}
              aria-label="Create group"
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-all duration-200 active:scale-95"
            >
              <UsersRound size={20} />
            </button>
            <Link
              to="/search"
              aria-label="Find new friends"
              className="w-10 h-10 rounded-full bg-[#fc4a56] hover:bg-[#e03e49] text-white flex items-center justify-center transition-all duration-200 active:scale-95 shadow-md shadow-[#fc4a56]/20"
            >
              <Plus size={22} />
            </Link>
          </div>
        </div>

        {/* Status Bar */}
        {statusGroups.length > 0 && (
          <div className="flex gap-3 overflow-x-auto pb-3 mb-3 scrollbar-none">
            {statusGroups.map((group) => {
              const isOwn = group.user._id === user._id;
              return (
                <button
                  key={group.user._id}
                  onClick={() => openStatusViewer(group)}
                  className="flex flex-col items-center gap-1 shrink-0"
                >
                  <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-br from-[#fc4a56] to-[#ff7b84]">
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
        <div className="relative h-11 rounded-full flex items-center px-4 bg-gray-50/80 border border-gray-200 focus-within:border-[#fc4a56] transition-all duration-200 shadow-inner">
          <Search size={18} className="text-gray-500 shrink-0" />
          <input 
            type="text" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-gray-900 w-full h-full pl-3 outline-none text-sm placeholder-slate-500" 
          />
        </div>
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
              className="mt-2 text-sm font-semibold text-[#fc4a56] hover:underline"
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
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fc4a56] to-[#ff7b84] flex items-center justify-center text-white shadow-md">
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
                    hasUnread ? 'text-[#fc4a56]' : 'text-gray-400'
                  }`}>
                    {formatTime(conversation.updatedAt)}
                  </span>
                  {hasUnread && (
                    <span className="bg-[#fc4a56] text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[18px] text-center shadow-sm shadow-[#fc4a56]/30">
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
              ? 'bg-[#fc4a56]/15 text-[#fc4a56]' 
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
              ? 'bg-[#fc4a56]/15 text-[#fc4a56]' 
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
              ? 'bg-[#fc4a56]/15 text-[#fc4a56]' 
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
              ? 'bg-[#fc4a56]/15 text-[#fc4a56]' 
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

      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-lg">Create Group</h3>
              <button onClick={() => setShowGroupModal(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <input
                type="text"
                placeholder="Group name..."
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#fc4a56]/20 focus:border-[#fc4a56] outline-none"
              />

              <div>
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Add members</p>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {groupFriends.map(friend => (
                    <button
                      key={friend._id}
                      onClick={() => toggleMember(friend._id)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                        selectedGroupMembers.includes(friend._id)
                          ? 'bg-[#fc4a56]/10 border border-[#fc4a56]/30'
                          : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <img
                        src={friend.profileImage || `https://ui-avatars.com/api/?name=${friend.username}`}
                        alt="" className="w-9 h-9 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{friend.fullName}</p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>
                      {selectedGroupMembers.includes(friend._id) && (
                        <div className="w-5 h-5 rounded-full bg-[#fc4a56] flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  ))}
                  {groupFriends.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No friends yet. Add friends first!</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleCreateGroup}
                disabled={creatingGroup}
                className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {creatingGroup ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Group"}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  i < activeStatusIndex ? 'bg-white w-full' : i === activeStatusIndex ? 'bg-white w-full' : 'w-0'
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
            className="absolute left-0 top-0 bottom-0 w-1/3"
            onClick={() => {
              if (activeStatusIndex > 0) setActiveStatusIndex(activeStatusIndex - 1);
              else setShowStatusViewer(false);
            }}
          />
          <button
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