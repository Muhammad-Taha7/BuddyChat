import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  MessageSquare,
  Phone,
  Video,
  UserMinus,
  UserPlus,
  ArrowLeft,
  Loader2,
  Bell,
  Sparkles,
  Check
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import Avatar from "../../components/Avatar";
import useChatStore from "../../store/useChatStore";
import useCallStore from "../../store/useCallStore";
import useSocketStore from "../../store/useSocketStore";
import { useDialog } from "../../components/DialogProvider";

const FriendsPage = () => {
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'online'
  const [unfriendingId, setUnfriendingId] = useState(null);

  const { getOrCreateConversation } = useChatStore();
  const { initiateCall } = useCallStore();
  const onlineUsers = useSocketStore((state) => state.onlineUsers);
  const { showConfirm, showSuccess, showError } = useDialog();
  const navigate = useNavigate();

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/users/friends");
      setFriends(res.data?.data?.friends || []);
    } catch {
      toast.error("Failed to load friends list");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (friendId) => {
    try {
      const conv = await getOrCreateConversation(friendId);
      if (conv) {
        navigate("/chat");
      }
    } catch {
      toast.error("Failed to open chat");
    }
  };

  const handleStartCall = (friend, type) => {
    initiateCall(friend, type);
  };

  const handleRemoveFriend = (friend) => {
    showConfirm(
      "Remove Friend",
      `Are you sure you want to remove ${friend.fullName} from your friends?`,
      async () => {
        setUnfriendingId(friend._id);
        try {
          const res = await axios.delete(`/api/users/friend/${friend._id}`);
          if (res.data.success) {
            toast.success(`${friend.fullName} removed from friends`);
            setFriends((prev) => prev.filter((f) => f._id !== friend._id));
          }
        } catch {
          toast.error("Failed to remove friend");
        } finally {
          setUnfriendingId(null);
        }
      },
      { confirmText: "Remove Friend", cancelText: "Cancel", type: "warning" }
    );
  };

  const isFriendOnline = (friendId) => {
    return onlineUsers.includes(String(friendId));
  };

  const onlineFriends = friends.filter((f) => isFriendOnline(f._id));

  const filteredFriends = (filterTab === "online" ? onlineFriends : friends).filter(
    (f) =>
      f.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 pb-20"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
              aria-label="Back to chat"
            >
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Friends</h1>
              <p className="text-xs text-gray-500 font-light mt-1">
                {friends.length} total · {onlineFriends.length} online
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/requests"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-800 transition-all active:scale-95"
            >
              <Bell size={14} />
              <span>Requests</span>
            </Link>
            <Link
              to="/search"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold bg-black hover:bg-gray-800 text-white transition-all shadow-sm active:scale-95"
            >
              <UserPlus size={14} />
              <span>Find Friends</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6">
        {/* ── SEARCH & TABS ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
          {/* Search Bar */}
          <div className="relative w-full sm:w-80">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-gray-200 focus:border-black rounded-full py-2.5 pl-10 pr-4 text-sm outline-none transition-all shadow-xs"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-full w-full sm:w-auto">
            <button
              onClick={() => setFilterTab("all")}
              className={`flex-1 sm:flex-none px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterTab === "all"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              All Friends ({friends.length})
            </button>
            <button
              onClick={() => setFilterTab("online")}
              className={`flex-1 sm:flex-none px-5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                filterTab === "online"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Online ({onlineFriends.length})
            </button>
          </div>
        </div>

        {/* ── CONTENT ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500 font-light">Loading friends...</p>
          </div>
        ) : filteredFriends.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Users size={28} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {searchQuery
                ? "No matching friends found"
                : filterTab === "online"
                ? "No friends online right now"
                : "You don't have any friends yet"}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-6">
              {searchQuery
                ? "Try searching with a different name or username."
                : "Find people you know on BuddyChat and start chatting or calling freely."}
            </p>
            <Link
              to="/search"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
            >
              <UserPlus size={14} />
              Find Friends
            </Link>
          </div>
        ) : (
          /* Friends Grid / List */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredFriends.map((friend) => {
              const online = isFriendOnline(friend._id);
              const isBusy = unfriendingId === friend._id;

              return (
                <div
                  key={friend._id}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                >
                  {/* Avatar + Info */}
                  <Link
                    to={`/profile/${friend._id}`}
                    className="flex items-center gap-3.5 flex-1 min-w-0 pr-3"
                  >
                    <div className="relative shrink-0">
                      <Avatar user={friend} size="lg" showStatus={false} />
                      <span
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          online ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                        title={online ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="truncate">
                      <h3 className="text-sm font-semibold text-gray-900 truncate leading-snug">
                        {friend.fullName}
                      </h3>
                      <p className="text-xs text-gray-400 truncate font-light">
                        @{friend.username}
                      </p>
                      {friend.bio && (
                        <p className="text-[11px] text-gray-500 truncate font-normal mt-0.5 max-w-[200px]">
                          {friend.bio}
                        </p>
                      )}
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Chat */}
                    <button
                      type="button"
                      onClick={() => handleStartChat(friend._id)}
                      title="Send Message"
                      aria-label="Send Message"
                      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-700 flex items-center justify-center transition-all active:scale-95"
                    >
                      <MessageSquare size={16} />
                    </button>

                    {/* Voice Call */}
                    <button
                      type="button"
                      onClick={() => handleStartCall(friend, "voice")}
                      title="Voice Call"
                      aria-label="Voice Call"
                      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-700 flex items-center justify-center transition-all active:scale-95"
                    >
                      <Phone size={16} />
                    </button>

                    {/* Video Call */}
                    <button
                      type="button"
                      onClick={() => handleStartCall(friend, "video")}
                      title="Video Call"
                      aria-label="Video Call"
                      className="w-9 h-9 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-700 flex items-center justify-center transition-all active:scale-95"
                    >
                      <Video size={16} />
                    </button>

                    {/* Remove Friend */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFriend(friend)}
                      disabled={isBusy}
                      title="Remove Friend"
                      aria-label="Remove Friend"
                      className="w-9 h-9 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all active:scale-95"
                    >
                      {isBusy ? <Loader2 size={14} className="animate-spin" /> : <UserMinus size={16} />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;
