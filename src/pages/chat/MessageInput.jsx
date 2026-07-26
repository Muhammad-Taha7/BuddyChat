import React, { useState, useRef, useEffect } from "react";
import { Paperclip, Camera, Smile, Mic, Send, X, Loader2 } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import useSocketStore from "../../store/useSocketStore";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

const MessageInput = () => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const isCancelledRef = useRef(false);

  const { activeConversation } = useChatStore();
  const { user } = useAuthStore();
  const socket = useSocketStore((state) => state.socket);

  const otherUser =
    activeConversation?.participants?.find((p) => p._id !== user?._id) ||
    activeConversation?.participants?.[0];

  useEffect(() => {
    return () => {
      clearTimeout(typingTimeoutRef.current);
      clearInterval(timerIntervalRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const onEmojiClick = (emojiObject) => {
    setMessage((prev) => prev + emojiObject.emoji);
  };

  const handleTyping = (e) => {
    setMessage(e.target.value);

    if (!isTyping && socket && otherUser) {
      setIsTyping(true);
      socket.emit("typing", { receiverId: otherUser._id, isTyping: true });
    }

    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (socket && otherUser) {
        socket.emit("typing", { receiverId: otherUser._id, isTyping: false });
      }
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || !activeConversation || !otherUser || !socket) return;

    try {
      const payload = {
        receiverId: otherUser._id,
        content: message,
        type: "text",
        iv: "placeholder_iv",
        encryptedKey: "placeholder_key",
      };

      socket.emit("sendMessage", payload);
      setMessage("");
      setShowEmojiPicker(false);

      setIsTyping(false);
      socket.emit("typing", { receiverId: otherUser._id, isTyping: false });
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !activeConversation || !otherUser || !socket) return;

    if (file.size > 25 * 1024 * 1024) {
      return toast.error("File size must be less than 25MB");
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("chatFile", file);

      const res = await axios.post("/api/chat/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        const { fileUrl, fileName, fileSize, mimeType } = res.data.data;
        const type = mimeType?.startsWith("image/") ? "image" : "file";

        socket.emit("sendMessage", {
          receiverId: otherUser._id,
          content: "Sent a file",
          type,
          fileUrl,
          fileName,
          fileSize,
        });
      }
    } catch (error) {
      console.error("File upload error:", error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const openFilePicker = (acceptType = "") => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptType;
      fileInputRef.current.click();
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());

        if (isCancelledRef.current) return;

        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });

        setIsUploading(true);
        try {
          const formData = new FormData();
          formData.append("voiceMessage", audioBlob, "voice-message.webm");

          const res = await axios.post("/api/chat/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          if (res.data.success) {
            socket.emit("sendMessage", {
              receiverId: otherUser._id,
              content: "Voice Message",
              type: "voice",
              fileUrl: res.data.data.fileUrl,
              fileSize: audioBlob.size,
            });
          }
        } catch (error) {
          toast.error("Failed to send voice message");
        } finally {
          setIsUploading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied:", err);
      toast.error("Microphone access denied");
    }
  };

  const cancelRecording = () => {
    isCancelledRef.current = true;
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    clearInterval(timerIntervalRef.current);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerIntervalRef.current);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  if (!activeConversation) return null;

  return (
    <div className="p-4 sm:p-6 bg-white/95 backdrop-blur-md border-t border-gray-200/80">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileUpload}
      />

      {isRecording ? (
        /* Recording UI Bar */
        <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50 border border-[#fc4a56]/50 rounded-full shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-sm font-medium text-gray-800 font-mono tracking-wide">
              Recording... {formatTime(recordingTime)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              aria-label="Cancel recording"
              className="p-2 text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-full transition-colors duration-200"
            >
              <X size={20} />
            </button>
            <button
              type="button"
              onClick={stopRecording}
              aria-label="Send recording"
              className="p-2.5 bg-[#fc4a56] text-white hover:bg-[#e03e49] rounded-full transition-all duration-200 shadow-md shadow-[#fc4a56]/20 active:scale-95"
            >
              <Send size={18} className="translate-x-[1px]" />
            </button>
          </div>
        </div>
      ) : (
        /* Standard Message Input Bar */
        <form
          onSubmit={handleSendMessage}
          className="flex items-center gap-3 max-w-5xl mx-auto"
        >
          <div className="flex-1 flex items-center gap-1 sm:gap-2 px-4 py-2 bg-gray-50/80 border border-gray-200 focus-within:border-[#fc4a56] rounded-full transition-all duration-200 shadow-inner">
            {/* Emoji Button */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setShowEmojiPicker((prev) => !prev)}
                aria-label="Emoji picker"
                className="p-1.5 text-gray-500 hover:text-[#fc4a56] hover:bg-gray-100 rounded-full transition-colors duration-200 shrink-0"
              >
                <Smile size={20} />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-12 left-0 z-50 shadow-xl rounded-lg">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
                </div>
              )}
            </div>

            {/* Text Input */}
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={handleTyping}
              disabled={isUploading}
              className="flex-1 bg-transparent border-none text-gray-900 placeholder-slate-500 text-sm sm:text-base outline-none px-2 py-1 disabled:opacity-50"
            />

            {/* Attachment Actions */}
            <button
              type="button"
              onClick={() => openFilePicker("")}
              disabled={isUploading}
              aria-label="Attach file"
              className="p-1.5 text-gray-500 hover:text-[#fc4a56] hover:bg-gray-100 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50"
            >
              <Paperclip size={20} />
            </button>

            <button
              type="button"
              onClick={() => openFilePicker("image/*")}
              disabled={isUploading}
              aria-label="Attach photo"
              className="p-1.5 text-gray-500 hover:text-[#fc4a56] hover:bg-gray-100 rounded-full transition-colors duration-200 shrink-0 disabled:opacity-50"
            >
              <Camera size={20} />
            </button>
          </div>

          {/* Action Button: Send or Mic */}
          <button
            type={message.trim() ? "submit" : "button"}
            onClick={!message.trim() ? startRecording : undefined}
            disabled={isUploading}
            aria-label={message.trim() ? "Send message" : "Record voice message"}
            className="w-12 h-12 rounded-full bg-[#fc4a56] hover:bg-[#e03e49] text-gray-900 flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95 shadow-md shadow-[#fc4a56]/25 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : message.trim() ? (
              <Send size={19} className="-translate-x-[1px]" />
            ) : (
              <Mic size={20} />
            )}
          </button>
        </form>
      )}
    </div>
  );
};

export default MessageInput;