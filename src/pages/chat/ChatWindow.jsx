import React, { useEffect, useRef, useState } from "react";
import { Download, FileText, Play, Pause, Loader2, MessageSquare, Trash2 } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import useChatStore from "../../store/useChatStore";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

// ─── WhatsApp-style message tick icons ───────────────────────────────────────
// single tick = sent, double gray = delivered, double blue = read
const SingleTick = () => (
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" className="inline-block">
    <path d="M1 5L4.5 8.5L10.5 1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const DoubleTick = ({ blue = false }) => (
  <svg width="18" height="10" viewBox="0 0 18 10" fill="none" className="inline-block">
    <path d="M1 5L4.5 8.5L10.5 1" stroke={blue ? "#34B7F1" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 5L8.5 8.5L14.5 1" stroke={blue ? "#34B7F1" : "currentColor"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const MessageTick = ({ message, isMine }) => {
  if (!isMine) return null;

  if (message.isRead) {
    return (
      <span title="Read" className="opacity-100 text-[#34B7F1]">
        <DoubleTick blue={true} />
      </span>
    );
  }

  if (message.isDelivered) {
    return (
      <span title="Delivered" className="opacity-60">
        <DoubleTick blue={false} />
      </span>
    );
  }

  // Recipient is offline -> Single tick only
  return (
    <span title="Sent (User offline)" className="opacity-60">
      <SingleTick />
    </span>
  );
};

const ChatWindow = () => {
  const { user } = useAuthStore();
  const { activeConversation, messages, isLoadingMessages, fetchMessages, markMessagesRead } = useChatStore();
  const messagesEndRef = useRef(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    if (activeConversation) {
      fetchMessages(activeConversation._id);
      if (activeConversation.unreadCount > 0) {
        markMessagesRead(activeConversation._id);
      }
    }
  }, [activeConversation?._id, fetchMessages, markMessagesRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (audioRef.current) audioRef.current.pause();
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
    const timeDiff = Date.now() - new Date(message.createdAt).getTime();
    if (timeDiff > 2 * 60 * 1000) return;
    setContextMenu({ messageId: message._id, x: e.clientX, y: e.clientY });
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      const res = await axios.delete(`/api/chat/messages/${messageId}`);
      if (res.data.success) {
        toast.success("Message deleted");
        fetchMessages(activeConversation._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete message");
    }
    setContextMenu(null);
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white animate-fadeIn">
        <div className="w-20 h-20 rounded-full bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-400 mb-5 shadow-sm">
          <MessageSquare size={34} />
        </div>
        <h3 className="text-xl font-semibold text-gray-800 mb-1.5 tracking-tight">Welcome to BuddyChat</h3>
        <p className="text-gray-400 text-sm max-w-xs leading-relaxed font-light">
          Select a conversation or search for a friend to start chatting.
        </p>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <Loader2 className="w-7 h-7 text-gray-400 animate-spin" />
      </div>
    );
  }

  const groupedMessages = messages.reduce((acc, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {});

  const renderMessageContent = (message, isMine) => {
    const content = message.content;
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    switch (message.type) {
      case "text":
        return <p className="text-[13.5px] leading-relaxed break-words font-normal">{content}</p>;

      case "image": {
        const imgUrl = message.fileUrl?.startsWith("http") ? message.fileUrl : `${baseUrl}${message.fileUrl}`;
        return (
          <div className="space-y-1.5">
            {content && content !== "Sent a file" && (
              <p className="text-[13.5px] leading-relaxed break-words">{content}</p>
            )}
            <div className="overflow-hidden rounded-xl border border-black/10 max-w-xs sm:max-w-sm">
              <img src={imgUrl} alt="Shared attachment" className="w-full max-h-72 object-cover hover:scale-[1.02] transition-transform duration-300" />
            </div>
          </div>
        );
      }

      case "file": {
        const fileUrl = message.fileUrl?.startsWith("http") ? message.fileUrl : `${baseUrl}${message.fileUrl}`;
        const formatBytes = (bytes) => {
          if (!bytes || bytes === 0) return "0 B";
          const k = 1024;
          const sizes = ["B", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
        };
        return (
          <div className="space-y-1.5">
            {content && content !== "Sent a file" && <p className="text-[13.5px] leading-relaxed break-words">{content}</p>}
            <a href={fileUrl} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 p-2.5 rounded-xl transition-colors border ${
                isMine ? "bg-white/10 hover:bg-white/20 border-white/20 text-white" : "bg-gray-100 hover:bg-gray-200/70 border-gray-200 text-gray-900"
              }`}>
              <div className={`p-2 rounded-lg shrink-0 ${isMine ? "bg-white/20" : "bg-black/8"}`}>
                <FileText size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium truncate">{message.fileName || "Download File"}</p>
                <p className={`text-[11px] mt-0.5 ${isMine ? "text-white/60" : "text-gray-400"}`}>{formatBytes(message.fileSize)}</p>
              </div>
              <Download size={16} className="opacity-60 shrink-0" />
            </a>
          </div>
        );
      }

      case "voice": {
        const audioUrl = message.fileUrl?.startsWith("http") ? message.fileUrl : `${baseUrl}${message.fileUrl}`;
        const isPlaying = playingAudioId === message._id;
        return (
          <div className="flex items-center gap-3 py-0.5 min-w-[180px] sm:min-w-[220px]">
            <button type="button" onClick={() => handlePlayVoice(message._id, audioUrl)}
              aria-label={isPlaying ? "Pause" : "Play"}
              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all active:scale-95 shadow-sm ${
                isMine ? "bg-white/20 hover:bg-white/30 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-700"
              }`}>
              {isPlaying ? <Pause size={16} /> : <Play size={16} className="translate-x-[1px]" />}
            </button>
            <div className="flex items-end gap-[2px] flex-1 h-6">
              {[30, 55, 40, 80, 60, 100, 45, 85, 65, 35, 75, 50, 90, 55, 40].map((h, i) => (
                <span key={i}
                  className={`w-[3px] rounded-full transition-all duration-150 ${isPlaying ? "animate-pulse" : ""} ${isMine ? "bg-white/70" : "bg-gray-400"}`}
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        );
      }

      default:
        return <p className="text-[13.5px] leading-relaxed break-words">{content}</p>;
    }
  };

  const formatDateHeader = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(Date.now() - 86400000);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 flex flex-col gap-1 bg-white relative scrollbar-thin">
      {Object.keys(groupedMessages).map((date) => (
        <React.Fragment key={date}>
          {/* Date separator */}
          <div className="flex items-center justify-center my-3">
            <span className="text-[11px] font-medium px-3 py-0.5 rounded-full bg-gray-100 text-gray-500 tracking-wide">
              {formatDateHeader(date)}
            </span>
          </div>

          {groupedMessages[date].map((message) => {
            const isMine = message.sender?._id === user?._id || message.sender === user?._id;
            const canDelete = isMine && (Date.now() - new Date(message.createdAt).getTime()) < 2 * 60 * 1000;

            return (
              <div key={message._id}
                onContextMenu={(e) => handleContextMenu(e, message)}
                className={`flex flex-col mb-1 ${isMine ? "items-end" : "items-start"}`}>
                
                {/* Sender name in groups */}
                {!isMine && activeConversation?.isGroup && (
                  <span className="text-[11px] font-semibold text-gray-400 ml-3 mb-0.5">
                    {message.sender?.fullName || "User"}
                  </span>
                )}

                <div className={`relative max-w-[78%] sm:max-w-[65%] px-3.5 py-2.5 shadow-sm group/msg transition-all duration-150 ${
                  isMine
                    ? "bg-[#1a1a2e] text-white rounded-2xl rounded-br-sm"
                    : "bg-gray-50 text-gray-900 border border-gray-200 rounded-2xl rounded-bl-sm"
                }`}>
                  {renderMessageContent(message, isMine)}

                  {/* Timestamp + tick row */}
                  <div className={`flex items-center gap-1.5 mt-1 ${isMine ? "justify-end" : "justify-end"}`}>
                    {/* Delete btn (hover) */}
                    {canDelete && (
                      <button onClick={() => handleDeleteMessage(message._id)}
                        className={`opacity-0 group-hover/msg:opacity-100 transition-opacity mr-0.5 ${
                          isMine ? "text-white/40 hover:text-white/80" : "text-gray-300 hover:text-red-400"
                        }`} title="Delete">
                        <Trash2 size={11} />
                      </button>
                    )}
                    <span className={`text-[10px] font-light tracking-wide ${isMine ? "text-white/50" : "text-gray-400"}`}>
                      {new Date(message.createdAt).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true })}
                    </span>
                    {/* Tick */}
                    {isMine && (
                      <span className={isMine ? "text-white/60" : "text-gray-400"}>
                        <MessageTick message={message} isMine={isMine} />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </React.Fragment>
      ))}
      <div ref={messagesEndRef} />

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed z-50 bg-white rounded-xl shadow-2xl border border-gray-100 py-1 min-w-[150px] animate-fadeIn"
          style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button onClick={() => handleDeleteMessage(contextMenu.messageId)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-medium text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 size={14} />
            Delete Message
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatWindow;