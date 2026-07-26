import React, { useState, useEffect } from "react";
import { Search, UserPlus, ArrowLeft, Loader2, Check, UserCheck } from "lucide-react";
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
        const res = await axios.get(`/api/users/search?q=${query}`);
        setResults(res.data.data.users);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchUsers, 500);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSendRequest = async (userId) => {
    try {
      const res = await axios.post(`/api/users/friend-request/${userId}`);
      if (res.data.success) {
        toast.success(res.data.message);
        setSentRequests((prev) => ({ ...prev, [userId]: true }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-6 sm:px-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/chat"
          className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200"
          aria-label="Back to chat"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Find Friends</h1>
      </div>

      {/* Search Input Bar */}
      <div className="relative mb-8">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
        />
        <input
          type="text"
          placeholder="Search by username or full name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-gray-100/60 border border-gray-300/80 focus:border-[#fc4a56] focus:ring-2 focus:ring-[#fc4a56]/20 text-gray-900 placeholder-slate-400 text-base rounded-2xl py-3.5 pl-12 pr-12 outline-none transition-all duration-200 shadow-inner"
          autoFocus
        />
        {isLoading && (
          <Loader2
            className="animate-spin absolute right-4 top-1/2 -translate-y-1/2 text-[#fc4a56]"
            size={20}
          />
        )}
      </div>

      {/* Search Results List */}
      <div className="space-y-3">
        {/* Initial Prompt State */}
        {query.trim().length < 2 && !isLoading && (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 text-gray-500">
            <Search className="mx-auto mb-3 text-gray-400 opacity-60" size={32} />
            <p className="text-sm font-medium">Type at least 2 characters to search for people</p>
          </div>
        )}

        {/* Empty State */}
        {query.trim().length >= 2 && !isLoading && results.length === 0 && (
          <div className="text-center py-12 px-4 rounded-2xl bg-gray-100/30 border border-gray-200 text-gray-500">
            <p className="text-base">
              No users found matching "<span className="text-gray-900 font-medium">{query}</span>"
            </p>
          </div>
        )}

        {/* Results List */}
        {results.map((user) => {
          const isSent = sentRequests[user._id];

          return (
            <div
              key={user._id}
              className="flex items-center justify-between p-4 bg-gray-100/40 hover:bg-gray-100/80 border border-gray-200/80 hover:border-gray-300/80 rounded-2xl transition-all duration-200 backdrop-blur-sm group"
            >
              <Link
                to={`/profile/${user._id}`}
                className="flex items-center gap-4 flex-1 min-w-0 pr-4"
              >
                <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                  <Avatar user={user} size="lg" showStatus={false} />
                </div>
                <div className="truncate">
                  <h3 className="text-base font-semibold text-gray-900 truncate leading-snug">
                    {user.fullName}
                  </h3>
                  <p className="text-sm text-gray-500 truncate font-medium">
                    @{user.username}
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() => handleSendRequest(user._id)}
                disabled={isSent}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 shrink-0 ${
                  isSent
                    ? "bg-slate-700/60 text-gray-700 cursor-not-allowed border border-slate-600/50"
                    : "bg-[#fc4a56] hover:bg-[#e03e49] text-gray-900 shadow-lg shadow-[#fc4a56]/20 active:scale-95"
                }`}
              >
                {isSent ? (
                  <>
                    <Check size={16} className="text-emerald-400" />
                    <span>Sent</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={16} />
                    <span>Add</span>
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchPage;