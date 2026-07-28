import { create } from "zustand";
import axios from "../lib/axios";

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoadingConversations: false,
  isLoadingMessages: false,
  typingUsers: {}, // { conversationId: boolean }

  // Fetch all conversations
  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await axios.get("/api/chat/conversations");
      set({
        conversations: res.data.data.conversations,
        isLoadingConversations: false,
      });
    } catch (error) {
      console.error("Error fetching conversations:", error);
      set({ isLoadingConversations: false });
    }
  },

  // Set active conversation
  setActiveConversation: (conversation) => {
    set({ activeConversation: conversation, messages: [] });
  },

  // Fetch messages for a conversation
  fetchMessages: async (conversationId) => {
    set({ isLoadingMessages: true });
    try {
      const res = await axios.get(`/api/chat/messages/${conversationId}`);
      set({
        messages: res.data.data.messages,
        isLoadingMessages: false,
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      set({ isLoadingMessages: false });
    }
  },

  // Get or create conversation with a user
  getOrCreateConversation: async (userId) => {
    try {
      const res = await axios.get(`/api/chat/conversation/${userId}`);
      const conversation = res.data.data.conversation;

      // Add to conversations list if not already there
      set((state) => {
        const exists = state.conversations.find(
          (c) => c._id === conversation._id
        );
        if (!exists) {
          return {
            conversations: [conversation, ...state.conversations],
            activeConversation: conversation,
          };
        }
        return { activeConversation: conversation };
      });

      return conversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      return null;
    }
  },

  // Add new message (from socket)
  addMessage: (message, conversationId) => {
    const state = get();

    // Add to messages if this is the active conversation
    if (
      state.activeConversation &&
      state.activeConversation._id === conversationId
    ) {
      set((state) => ({
        messages: [...state.messages, message],
      }));
    }

    // Update conversation's last message and unread count
    set((state) => ({
      conversations: state.conversations
        .map((conv) => {
          if (conv._id === conversationId) {
            return {
              ...conv,
              lastMessage: message,
              updatedAt: new Date().toISOString(),
              unreadCount:
                state.activeConversation?._id === conversationId
                  ? 0
                  : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        })
        .sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
        ),
    }));
  },

  // Update an existing message (e.g., when deleted)
  updateMessage: (messageId, conversationId, updates) => {
    set((state) => {
      let newMessages = state.messages;
      if (state.activeConversation?._id === conversationId) {
        newMessages = state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, ...updates } : msg
        );
      }

      const newConversations = state.conversations.map((conv) => {
        if (conv._id === conversationId && conv.lastMessage?._id === messageId) {
          return {
            ...conv,
            lastMessage: { ...conv.lastMessage, ...updates }
          };
        }
        return conv;
      });

      return {
        messages: newMessages,
        conversations: newConversations
      };
    });
  },

  // Set typing status
  setTyping: (userId, isTyping) => {
    set((state) => ({
      typingUsers: {
        ...state.typingUsers,
        [userId]: isTyping,
      },
    }));
  },

  // Update messages as read
  markMessagesRead: (conversationId) => {
    set((state) => ({
      messages: state.messages.map((msg) => ({
        ...msg,
        isRead: true,
      })),
      conversations: state.conversations.map((conv) => {
        if (conv._id === conversationId) {
          return { ...conv, unreadCount: 0 };
        }
        return conv;
      }),
    }));
  },

  // Clear chat state
  clearChat: () => {
    set({
      conversations: [],
      activeConversation: null,
      messages: [],
      typingUsers: {},
    });
  },

  // Clear specific conversation history
  clearChatHistory: async (conversationId) => {
    try {
      const res = await axios.delete(`/api/chat/conversation/${conversationId}/clear`);
      if (res.data.success) {
        set({ messages: [] }); // Immediately wipe messages from UI
        return true;
      }
    } catch (error) {
      console.error("Error clearing chat:", error);
      return false;
    }
  },

  // Delete a group conversation
  deleteGroup: async (groupId) => {
    try {
      const res = await axios.delete(`/api/chat/group/${groupId}`);
      if (res.data.success) {
        set((state) => ({
          conversations: state.conversations.filter((c) => c._id !== groupId),
          activeConversation: state.activeConversation?._id === groupId ? null : state.activeConversation,
          messages: state.activeConversation?._id === groupId ? [] : state.messages,
        }));
        return true;
      }
    } catch (error) {
      console.error("Error deleting group:", error);
      return false;
    }
  },
}));

export default useChatStore;
