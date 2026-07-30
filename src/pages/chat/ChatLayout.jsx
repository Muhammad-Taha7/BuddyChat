import React, { useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import useSocketStore from "../../store/useSocketStore";
import useChatStore from "../../store/useChatStore";
import useAuthStore from "../../store/useAuthStore";
import { playNotificationTone } from "../../utils/ringtone";

const ChatLayout = () => {
  const socket = useSocketStore((state) => state.socket);
  const { user } = useAuthStore();
  const { addMessage, setTyping, activeConversation, updateMessage } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    // Listen for new incoming messages
    const handleNewMessage = ({ message, conversationId }) => {
      addMessage(message, conversationId);

      // Play sound for incoming message if it's from someone else
      if (message.sender?._id !== user?._id && message.sender !== user?._id) {
        playNotificationTone();
      }

      // If actively viewing this conversation, acknowledge read status
      const state = useChatStore.getState();
      if (state.activeConversation?._id === conversationId) {
        socket.emit("messageRead", {
          conversationId,
          senderId: message.sender._id,
        });
      }
    };

    // Listen for own messages sent successfully
    const handleMessageSent = ({ message, conversationId }) => {
      addMessage(message, conversationId);
    };

    // Listen for real-time typing indicators
    const handleUserTyping = ({ userId, isTyping }) => {
      setTyping(userId, isTyping);
    };

    // Listen for read receipts
    const handleMessagesRead = ({ conversationId }) => {
      const state = useChatStore.getState();
      if (state.activeConversation?._id === conversationId) {
        useChatStore.getState().markMessagesRead(conversationId);
      }
    };

    // Listen for deleted messages
    const handleMessageDeleted = ({ messageId, conversationId, content, isDeletedForUsers }) => {
      updateMessage(messageId, conversationId, { content, isDeletedForUsers });
    };

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("userTyping", handleUserTyping);
    socket.on("messagesRead", handleMessagesRead);
    socket.on("messageDeleted", handleMessageDeleted);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("userTyping", handleUserTyping);
      socket.off("messagesRead", handleMessagesRead);
      socket.off("messageDeleted", handleMessageDeleted);
    };
  }, [socket, addMessage, setTyping, updateMessage]);

  return (
    <div
      className="flex w-screen overflow-hidden bg-white text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans"
      style={{ height: "100dvh" }} // dvh: dynamic viewport height — critical for mobile browsers
    >
      {/* Sidebar Panel (Hidden on mobile when conversation is active) */}
      <div
        className={`${
          activeConversation ? "hidden md:flex" : "flex"
        } w-full md:w-auto h-full shrink-0 z-10`}
      >
        <ChatSidebar />
      </div>

      {/* Main Chat Area (Hidden on mobile when no active conversation) */}
      <main
        className={`${
          !activeConversation ? "hidden md:flex" : "flex"
        } flex-1 flex-col h-full relative min-w-0 bg-white border-l border-zinc-200`}
      >
        <ChatHeader />
        <ChatWindow />
        <MessageInput />
      </main>
    </div>
  );
};

export default ChatLayout;