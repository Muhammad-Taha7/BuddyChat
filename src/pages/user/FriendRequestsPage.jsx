import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, X, Users, Loader2, UserPlus, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import Avatar from "../../components/Avatar";
import useChatStore from "../../store/useChatStore";

const FriendRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const { fetchConversations } = useChatStore();

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/api/users/friend-requests");
      setRequests(res.data.data.requests);
    } catch {
      toast.error("Failed to load friend requests");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    setAcceptingId(requestId);
    try {
      const res = await axios.put(`/api/users/friend-request/${requestId}/accept`);
      if (res.data.success) {
        toast.success("Friend request accepted!");
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        fetchConversations();
      }
    } catch {
      toast.error("Failed to accept request");
    } finally {
      setAcceptingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setRejectingId(requestId);
    try {
      const res = await axios.put(`/api/users/friend-request/${requestId}/reject`);
      if (res.data.success) {
        toast.success("Request declined");
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
      }
    } catch {
      toast.error("Failed to decline request");
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/chat"
            className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            aria-label="Back to chat">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-center gap-3 flex-1">
            <div>
              <h1 className="text-lg font-semibold text-gray-900 leading-none">Friend Requests</h1>
              <p className="text-xs text-gray-400 font-light mt-0.5">
                {requests.length > 0 ? `${requests.length} pending` : "No pending requests"}
              </p>
            </div>
          </div>
          {requests.length > 0 && (
            <span className="text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-gray-300 animate-spin" />
            <p className="text-sm text-gray-400 font-light">Loading requests...</p>
          </div>

        ) : requests.length === 0 ? (
          /* ── Empty State ── */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-full bg-white border border-gray-200 flex items-center justify-center mb-5 shadow-sm">
              <Users size={32} className="text-gray-300" />
            </div>
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Pending Requests</h3>
            <p className="text-sm text-gray-400 max-w-xs font-light leading-relaxed">
              When someone sends you a friend request, it will appear here.
            </p>
            <Link to="/search"
              className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-all shadow-sm">
              <UserPlus size={15} />
              Find Friends
            </Link>
          </div>

        ) : (
          /* ── Requests List ── */
          <div className="space-y-2">
            {requests.map((request) => {
              const isAccepting = acceptingId === request._id;
              const isRejecting = rejectingId === request._id;
              const isBusy = isAccepting || isRejecting;

              // Format relative time
              const timeAgo = (() => {
                const diff = Date.now() - new Date(request.createdAt || Date.now()).getTime();
                const mins = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                if (days > 0) return `${days}d ago`;
                if (hours > 0) return `${hours}h ago`;
                if (mins > 0) return `${mins}m ago`;
                return "Just now";
              })();

              return (
                <div key={request._id}
                  className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group">

                  {/* Avatar */}
                  <Link to={`/profile/${request.from._id}`} className="shrink-0 transition-transform duration-200 group-hover:scale-[1.03]">
                    <Avatar user={request.from} size="lg" showStatus={false} />
                  </Link>

                  {/* Info */}
                  <Link to={`/profile/${request.from._id}`} className="flex-1 min-w-0">
                    <h3 className="text-[14px] font-semibold text-gray-900 truncate leading-snug">
                      {request.from.fullName}
                    </h3>
                    <p className="text-[12px] text-gray-400 truncate font-light mt-0.5">
                      @{request.from.username}
                    </p>
                    <div className="flex items-center gap-1 mt-1.5">
                      <Clock size={10} className="text-gray-300" />
                      <span className="text-[11px] text-gray-300 font-light">{timeAgo}</span>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Decline */}
                    <button type="button" onClick={() => handleReject(request._id)} disabled={isBusy}
                      aria-label="Decline"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 transition-all active:scale-95 disabled:opacity-40">
                      {isRejecting ? <Loader2 size={15} className="animate-spin" /> : <X size={16} />}
                    </button>

                    {/* Accept */}
                    <button type="button" onClick={() => handleAccept(request._id)} disabled={isBusy}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium bg-gray-900 text-white hover:bg-gray-700 active:scale-95 disabled:opacity-40 transition-all shadow-sm">
                      {isAccepting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <>
                          <Check size={14} />
                          Accept
                        </>
                      )}
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

export default FriendRequestsPage;