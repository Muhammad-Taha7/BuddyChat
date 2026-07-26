import React, { useState, useRef, useEffect } from "react";
import { Phone, Video, ArrowLeft, MoreVertical, Trash2, Shield } from "lucide-react";
import Avatar from "../../components/Avatar";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import useCallStore from "../../store/useCallStore";
import useSocketStore from "../../store/useSocketStore";
import { toast } from "react-hot-toast";

const ChatHeader = () => {
  const { activeConversation, setActiveConversation, typingUsers, clearChatHistory } = useChatStore();
  const { user } = useAuthStore();
  const { isUserOnline } = useSocketStore();
  const { initiateCall } = useCallStore();

  const [showMenu, setShowMenu] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const menuRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    const handleClose = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setConfirmClear(false);
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
    setConfirmClear(false);
  };

  return (
    <header className="px-4 sm:px-6 py-3.5 flex items-center justify-between bg-white border-b border-gray-200 z-10 shrink-0">
      {/* Left Area */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button
          type="button"
          onClick={() => setActiveConversation(null)}
          aria-label="Back to conversations"
          className="md:hidden w-9 h-9 rounded-full flex items-center justify-center text-gray-600 hover:text-black hover:bg-gray-100 transition-colors shrink-0 active:scale-95"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="relative shrink-0">
          <div className="rounded-full ring-2 ring-gray-200">
            <Avatar user={otherUser} size="md" showStatus={false} />
          </div>
          <span
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full ring-2 ring-white ${
              isOnline ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 truncate leading-snug">
            {otherUser?.fullName || "Chat Partner"}
          </h3>
          {isTyping ? (
            <p className="text-xs font-medium text-black animate-pulse">
              typing...
            </p>
          ) : (
            <p className="text-xs text-gray-500">
              {isOnline ? (
                <span className="text-emerald-600 font-medium">Online</span>
              ) : (
                "Offline"
              )}
            </p>
          )}
        </div>
      </div>

      {/* Right Area */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => startCall("voice")}
          aria-label="Start voice call"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-black hover:text-white hover:border-black text-gray-700 transition-all duration-200 active:scale-95"
        >
          <Phone size={17} />
        </button>

        <button
          type="button"
          onClick={() => startCall("video")}
          aria-label="Start video call"
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-gray-50 border border-gray-200 hover:bg-black hover:text-white hover:border-black text-gray-700 transition-all duration-200 active:scale-95"
        >
          <Video size={18} />
        </button>

        {/* More Options */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => { setShowMenu(!showMenu); setConfirmClear(false); }}
            aria-label="More options"
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-100 transition-colors active:scale-95"
          >
            <MoreVertical size={18} />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 min-w-[180px] z-50 animate-fadeIn">
              {!confirmClear ? (
                <button
                  onClick={() => setConfirmClear(true)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={15} />
                  Clear Chat
                </button>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-600 mb-3">Clear all messages? This only affects your view.</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleClearChat}
                      className="flex-1 text-xs font-medium py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="flex-1 text-xs font-medium py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
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