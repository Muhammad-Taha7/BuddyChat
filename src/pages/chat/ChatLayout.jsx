import React, { useEffect } from "react";
import ChatSidebar from "./ChatSidebar";
import ChatHeader from "./ChatHeader";
import ChatWindow from "./ChatWindow";
import MessageInput from "./MessageInput";
import useSocketStore from "../../store/useSocketStore";
import useChatStore from "../../store/useChatStore";

const ChatLayout = () => {
  const socket = useSocketStore((state) => state.socket);
  const { addMessage, setTyping, activeConversation } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    // Listen for new incoming messages
    const handleNewMessage = ({ message, conversationId }) => {
      addMessage(message, conversationId);

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

    socket.on("newMessage", handleNewMessage);
    socket.on("messageSent", handleMessageSent);
    socket.on("userTyping", handleUserTyping);
    socket.on("messagesRead", handleMessagesRead);

    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.off("messageSent", handleMessageSent);
      socket.off("userTyping", handleUserTyping);
      socket.off("messagesRead", handleMessagesRead);
    };
  }, [socket, addMessage, setTyping]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-50 text-gray-900 selection:bg-[#fc4a56]/30 selection:text-gray-900">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#fc4a56]/5 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none -z-10" />

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
        } flex-1 flex-col h-full relative min-w-0 bg-white/70 backdrop-blur-xl border-l border-gray-200/60`}
      >
        <ChatHeader />
        <ChatWindow />
        <MessageInput />
      </main>
    </div>
  );
};

export default ChatLayout;