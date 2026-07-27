import React, { useState, useRef, useEffect } from "react";
import { Phone, Video, ArrowLeft, MoreVertical, Trash2 } from "lucide-react";
import Avatar from "../../components/Avatar";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import useCallStore from "../../store/useCallStore";
import useSocketStore from "../../store/useSocketStore";
import { toast } from "react-hot-toast";

const ChatHeader = () => {
  const { activeConversation, setActiveConversation, typingUsers, clearChatHistory, deleteGroup } = useChatStore();
  const { user } = useAuthStore();
  const { isUserOnline } = useSocketStore();
  const { initiateCall } = useCallStore();

  const [showMenu, setShowMenu] = useState(false);
  const [confirmationMode, setConfirmationMode] = useState(null); // 'clear' or 'delete'
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClose = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setConfirmationMode(null);
      }
    };
    if (showMenu) {
      document.addEventListener("mousedown", handleClose);
      return () => document.removeEventListener("mousedown", handleClose);
    }
  }, [showMenu]);

  if (!activeConversation) return null;

  const otherUser =
    activeConversation.participants.find((p) => p._id !== user._id) ||
    activeConversation.participants[0];

  const isTyping = typingUsers[otherUser?._id];
  const isOnline = otherUser ? isUserOnline(otherUser._id) : false;

  const startCall = (type) => {
    initiateCall(otherUser, type);
  };

  const handleClearChat = async () => {
    const success = await clearChatHistory(activeConversation._id);
    if (success) {
      toast.success("Chat cleared");
    } else {
      toast.error("Failed to clear chat");
    }
    setShowMenu(false);
    setConfirmationMode(null);
  };

  const handleDeleteGroup = async () => {
    const success = await deleteGroup(activeConversation._id);
    if (success) {
      toast.success("Group deleted successfully");
    } else {
      toast.error("Failed to delete group");
    }
    setShowMenu(false);
    setConfirmationMode(null);
  };

  return (
    <header className="px-4 sm:px-6 py-3 flex items-center justify-between bg-white border-b border-gray-200 z-10 shrink-0 font-sans">
      
      {/* Left Area */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={() => setActiveConversation(null)}
          aria-label="Back to conversations"
          className="md:hidden w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors shrink-0 active:scale-95 border border-gray-200"
        >
          <ArrowLeft size={16} />
        </button>

        <div className="relative shrink-0">
          <div className="p-0.5 border border-gray-300 bg-white">
            <Avatar user={otherUser} size="md" showStatus={false} />
          </div>
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 border border-white ${
              isOnline ? "bg-black" : "bg-gray-300"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-extrabold text-gray-900 truncate leading-tight uppercase tracking-tight">
            {activeConversation.isGroup ? activeConversation.groupName : (otherUser?.fullName || "Chat Partner")}
          </h3>
          {activeConversation.isGroup ? (
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {activeConversation.participants.length} members
            </p>
          ) : isTyping ? (
            <p className="text-[10px] font-bold text-black animate-pulse uppercase tracking-wider">
              typing...
            </p>
          ) : (
            <p className="text-[10px] font-bold uppercase tracking-wider">
              {isOnline ? (
                <span className="text-black font-extrabold">Online</span>
              ) : (
                <span className="text-gray-400">Offline</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Right Area */}
      <div className="flex items-center gap-2">
        {!activeConversation.isGroup && (
          <>
            <button
              type="button"
              onClick={() => startCall("voice")}
              aria-label="Start voice call"
              className="w-9 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-black hover:text-white hover:border-black text-gray-800 transition-all active:scale-95"
            >
              <Phone size={16} />
            </button>

            <button
              type="button"
              onClick={() => startCall("video")}
              aria-label="Start video call"
              className="w-9 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-black hover:text-white hover:border-black text-gray-800 transition-all active:scale-95"
            >
              <Video size={16} />
            </button>
          </>
        )}

        {/* More Options */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => { setShowMenu(!showMenu); setConfirmationMode(null); }}
            aria-label="More options"
            className="w-9 h-9 flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-black hover:text-white hover:border-black text-gray-800 transition-all active:scale-95"
          >
            <MoreVertical size={16} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white border border-black p-1 min-w-[180px] z-50">
              {!confirmationMode ? (
                <>
                  <button
                    onClick={() => setConfirmationMode("clear")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors text-left"
                  >
                    <Trash2 size={14} />
                    Clear Chat
                  </button>
                  {activeConversation.isGroup && activeConversation.groupAdmins?.includes(user._id) && (
                    <button
                      onClick={() => setConfirmationMode("delete")}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-red-600 hover:bg-red-50 transition-colors text-left"
                    >
                      <Trash2 size={14} />
                      Delete Group
                    </button>
                  )}
                </>
              ) : confirmationMode === "clear" ? (
                <div className="p-3">
                  <p className="text-[11px] font-medium text-gray-600 mb-3">Clear all messages? This only affects your view.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearChat}
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setConfirmationMode(null)}
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3">
                  <p className="text-[11px] font-medium text-gray-600 mb-3">Delete group? This will remove it for everyone.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDeleteGroup}
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => setConfirmationMode(null)}
                      className="flex-1 text-[10px] font-bold uppercase tracking-wider py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;