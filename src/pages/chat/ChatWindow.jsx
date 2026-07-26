import React, { useEffect, useRef, useState } from "react";
import { Download, FileText, Play, Pause, Loader2, MessageSquare, Trash2 } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import useChatStore from "../../store/useChatStore";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

const ChatWindow = () => {
  const { user } = useAuthStore();
  const { activeConversation, messages, isLoadingMessages, fetchMessages, markMessagesRead } = useChatStore();
  const messagesEndRef = useRef(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null); // { messageId, x, y }

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      
      if (activeConversation.unreadCount > 0) {
        markMessagesRead(activeConversation._id);
      }
    }
  }, [activeConversation?._id, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close context menu on click outside
  useEffect(() => {
    const handleClose = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener("click", handleClose);
      return () => document.removeEventListener("click", handleClose);
    }
  }, [contextMenu]);

  const handlePlayVoice = (messageId, audioUrl) => {
    if (playingAudioId === messageId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const newAudio = new Audio(audioUrl);
    audioRef.current = newAudio;
    setPlayingAudioId(messageId);

    newAudio.play();
    newAudio.onended = () => setPlayingAudioId(null);
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    const isMine = message.sender?._id === user?._id || message.sender === user?._id;
    if (!isMine) return;

    // Check 2-minute window
    const timeDiff = Date.now() - new Date(message.createdAt).getTime();
    const twoMinutes = 2 * 60 * 1000;
    if (timeDiff > twoMinutes) return;

    setContextMenu({
      messageId: message._id,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await axios.delete(`/api/chat/messages/${messageId}`);
      if (res.data.success) {
        toast.success("Message deleted");
        // Re-fetch messages to reflect deletion
        fetchMessages(activeConversation._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete");
    }
    setContextMenu(null);
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white animate-fadeIn">
        <div className="w-20 h-20 rounded-3xl bg-gray-50/80 border border-gray-200 flex items-center justify-center text-[#fc4a56] mb-5 shadow-xl">
          <MessageSquare size={36} />
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Welcome to BuddyChat
        </h3>
        <p className="text-gray-500 text-sm max-w-sm leading-relaxed">
          Select a conversation from the sidebar or search for a friend to start chatting.
        </p>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="w-10 h-10 text-[#fc4a56] animate-spin" />
      </div>
    );
  }

  // Group messages by date
  const groupedMessages = messages.reduce((acc, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(message);
    return acc;
  }, {});

  const renderMessageContent = (message, isMine) => {
    const content = message.content;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    switch (message.type) {
      case "text":
        return <p className="text-sm sm:text-base leading-relaxed break-words">{content}</p>;

      case "image": {
        const imgUrl = message.fileUrl?.startsWith("http")
          ? message.fileUrl
          : `${baseUrl}${message.fileUrl}`;
        return (
          <div className="space-y-2">
            {content && content !== "Sent a file" && (
              <p className="text-sm leading-relaxed break-words">{content}</p>
            )}
            <div className="overflow-hidden rounded-xl border border-black/10 max-w-xs sm:max-w-md">
              <img
                src={imgUrl}
                alt="Shared attachment"
                className="w-full max-h-80 object-cover hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        );
      }

      case "file": {
        const fileUrl = message.fileUrl?.startsWith("http")
          ? message.fileUrl
          : `${baseUrl}${message.fileUrl}`;

        const formatBytes = (bytes) => {
          if (!bytes || bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
        };

        return (
          <div className="space-y-2">
            {content && content !== "Sent a file" && (
              <p className="text-sm leading-relaxed break-words">{content}</p>
            )}
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${
                isMine
                  ? "bg-black/15 hover:bg-black/25 border-white/20 text-gray-900"
                  : "bg-gray-100/80 hover:bg-gray-100 border-gray-300 text-gray-900"
              }`}
            >
              <div
                className={`p-2.5 rounded-lg shrink-0 ${
                  isMine ? "bg-white/20 text-gray-900" : "bg-[#fc4a56]/20 text-[#fc4a56]"
                }`}
              >
                <FileText size={22} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {message.fileName || "Download File"}
                </p>
                <p className={`text-xs ${isMine ? "text-gray-900/80" : "text-gray-500"}`}>
                  {formatBytes(message.fileSize)}
                </p>
              </div>
              <Download size={18} className="opacity-80 shrink-0 ml-1" />
            </a>
          </div>
        );
      }

      case "voice": {
        const audioUrl = message.fileUrl?.startsWith("http")
          ? message.fileUrl
          : `${baseUrl}${message.fileUrl}`;
        const isPlaying = playingAudioId === message._id;

        return (
          <div className="flex items-center gap-3 py-1 px-1 min-w-[180px] sm:min-w-[220px]">
            <button
              type="button"
              onClick={() => handlePlayVoice(message._id, audioUrl)}
              aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-md ${
                isMine
                  ? "bg-white text-[#fc4a56]"
                  : "bg-[#fc4a56] text-white hover:bg-[#e03e49]"
              }`}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-[1px]" />}
            </button>

            {/* Waveform Visualization */}
            <div className="flex items-center gap-1 flex-1 h-7">
              {[40, 70, 30, 85, 60, 100, 45, 90, 65, 30, 80, 50, 95, 60, 40].map((h, i) => (
                <span
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlaying ? "animate-pulse" : ""
                  } ${isMine ? "bg-white/80" : "bg-slate-400"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        );
      }

      default:
        return <p className="text-sm sm:text-base leading-relaxed break-words">{content}</p>;
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-4 bg-white scrollbar-thin scrollbar-thumb-slate-800 relative">
      {Object.keys(groupedMessages).map((date) => (
        <React.Fragment key={date}>
          {/* Date Header Badge */}
          <div className="flex items-center justify-center my-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-gray-100/60 border border-gray-300/50 text-gray-500 backdrop-blur-sm shadow-sm">
              {new Date(date).toDateString() === new Date().toDateString()
                ? "Today"
                : new Date(date).toDateString() ===
                  new Date(Date.now() - 86400000).toDateString()
                ? "Yesterday"
                : new Date(date).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
            </span>
          </div>

          {/* Messages */}
          {groupedMessages[date].map((message) => {
            const isMine = message.sender?._id === user?._id || message.sender === user?._id;
            const canDelete = isMine && (Date.now() - new Date(message.createdAt).getTime()) < 2 * 60 * 1000;

            return (
              <div
                key={message._id}
                onContextMenu={(e) => handleContextMenu(e, message)}
                className={`max-w-[82%] sm:max-w-[70%] px-4 py-3 relative flex flex-col shadow-md transition-all duration-200 group/msg ${
                  isMine
                    ? "self-end rounded-2xl rounded-br-xs bg-[#fc4a56] text-white"
                    : "self-start rounded-2xl rounded-bl-xs bg-gray-50/80 text-gray-900 border border-gray-200"
                }`}
              >
                {renderMessageContent(message, isMine)}

                {/* Message Timestamp + Delete hint */}
                <div className={`flex items-center gap-2 mt-1.5 self-end`}>
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteMessage(message._id)}
                      className={`opacity-0 group-hover/msg:opacity-100 transition-opacity ${
                        isMine ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-red-500'
                      }`}
                      title="Delete (within 2 min)"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                  <span
                    className={`text-[10px] font-medium tracking-wider ${
                      isMine ? "text-gray-900/80" : "text-gray-500"
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString(undefined, {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </span>
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 min-w-[140px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => handleDeleteMessage(contextMenu.messageId)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;