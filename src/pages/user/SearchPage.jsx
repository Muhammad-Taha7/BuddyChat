import React, { useState, useEffect } from "react";
import { Search, UserPlus, ArrowLeft, Loader2, Check } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import Avatar from "../../components/Avatar";

const SearchPage = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sentRequests, setSentRequests] = useState({});

  useEffect(() => {
    const searchUsers = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const res = await axios.get(`/api/users/search?q=${encodeURIComponent(query)}`);
        setResults(res.data?.data?.users || []);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 400);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSendRequest = async (userId) => {
    try {
      const res = await axios.post(`/api/users/friend-request/${userId}`);
      if (res.data.success) {
        toast.success(res.data.message || "Friend request sent!");
        setSentRequests((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 pb-20"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            to="/chat"
            className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
            aria-label="Back to chat"
          >
            <ArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-none">Find Friends</h1>
            <p className="text-xs text-gray-500 font-light mt-1">
              Search by full name or username
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
        {/* Search Input Bar */}
        <div className="relative mb-6">
          <Search
            size={19}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Type name or @username..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-gray-200 focus:border-black focus:ring-2 focus:ring-black/10 text-gray-900 placeholder-gray-400 text-sm rounded-full py-3 pl-11 pr-11 outline-none transition-all shadow-xs"
            autoFocus
          />
          {isLoading && (
            <Loader2
              className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
          )}
        </div>

        {/* Results */}
        <div className="space-y-2.5">
          {/* Initial Prompt State */}
          {query.trim().length < 2 && !isLoading && (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-400 shadow-xs">
              <Search className="mx-auto mb-3 text-gray-300" size={32} />
              <p className="text-sm font-medium text-gray-600">Discover people on BuddyChat</p>
              <p className="text-xs text-gray-400 font-light mt-1">
                Type at least 2 characters to find your friends
              </p>
            </div>
          )}

          {/* Empty State */}
          {query.trim().length >= 2 && !isLoading && results.length === 0 && (
            <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center text-gray-500 shadow-xs">
              <p className="text-sm font-medium">
                No users found matching "<span className="text-gray-900">{query}</span>"
              </p>
              <p className="text-xs text-gray-400 font-light mt-1">
                Double check the spelling or try another name
              </p>
            </div>
          )}

          {/* Results List */}
          {results.map((user) => {
            const isSent = sentRequests[user._id];

            return (
              <div
                key={user._id}
                className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all duration-200"
              >
                <Link
                  to={`/profile/${user._id}`}
                  className="flex items-center gap-3.5 flex-1 min-w-0 pr-4"
                >
                  <Avatar user={user} size="lg" showStatus={false} />
                  <div className="truncate">
                    <h3 className="text-sm font-semibold text-gray-900 truncate leading-snug">
                      {user.fullName}
                    </h3>
                    <p className="text-xs text-gray-400 truncate font-light">
                      @{user.username}
                    </p>
                    {user.bio && (
                      <p className="text-[11px] text-gray-500 truncate font-normal mt-0.5 max-w-[240px]">
                        {user.bio}
                      </p>
                    )}
                  </div>
                </Link>

                <button
                  type="button"
                  onClick={() => handleSendRequest(user._id)}
                  disabled={isSent}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-xs transition-all shrink-0 active:scale-95 ${
                    isSent
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-200"
                      : "bg-black hover:bg-gray-800 text-white shadow-xs"
                  }`}
                >
                  {isSent ? (
                    <>
                      <Check size={14} className="text-emerald-500" />
                      <span>Sent</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={14} />
                      <span>Add Friend</span>
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;