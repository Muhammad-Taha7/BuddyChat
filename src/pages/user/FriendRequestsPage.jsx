import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, X, UserCheck, Users, Loader2 } from "lucide-react";
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const res = await axios.get("/api/users/friend-requests");
      setRequests(res.data.data.requests);
    } catch (error) {
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
    } catch (error) {
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
        toast.success("Request rejected");
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
      }
    } catch (error) {
      toast.error("Failed to reject request");
    } finally {
      setRejectingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-6 sm:px-8 max-w-3xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/chat"
          className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200"
          aria-label="Back to chat"
        >
          <ArrowLeft size={22} />
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Friend Requests
          </h1>
          {requests.length > 0 && (
            <span className="bg-[#fc4a56]/20 text-[#fc4a56] border border-[#fc4a56]/30 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {requests.length}
            </span>
          )}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 text-[#fc4a56] animate-spin" />
        </div>
      ) : requests.length === 0 ? (
        /* Empty State */
        <div className="text-center py-16 px-6 bg-gray-50/40 border border-gray-200/80 rounded-3xl backdrop-blur-sm">
          <div className="w-16 h-16 bg-gray-100/80 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-300/50">
            <Users size={32} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            No Pending Requests
          </h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            When someone sends you a friend request, it will show up here.
          </p>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-3">
          {requests.map((request) => {
            const isAccepting = acceptingId === request._id;
            const isRejecting = rejectingId === request._id;
            const isBusy = isAccepting || isRejecting;

            return (
              <div
                key={request._id}
                className="flex items-center justify-between p-4 bg-gray-50/60 hover:bg-gray-100/60 border border-gray-200 hover:border-gray-300/80 rounded-2xl transition-all duration-200 backdrop-blur-sm group"
              >
                {/* User Info Link */}
                <Link
                  to={`/profile/${request.from._id}`}
                  className="flex items-center gap-4 flex-1 min-w-0 pr-3"
                >
                  <div className="shrink-0 transition-transform duration-200 group-hover:scale-105">
                    <Avatar user={request.from} size="lg" showStatus={false} />
                  </div>
                  <div className="truncate">
                    <h3 className="text-base font-semibold text-gray-900 truncate leading-snug">
                      {request.from.fullName}
                    </h3>
                    <p className="text-sm text-gray-500 truncate font-medium">
                      @{request.from.username}
                    </p>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Reject Button */}
                  <button
                    type="button"
                    onClick={() => handleReject(request._id)}
                    disabled={isBusy}
                    aria-label="Reject request"
                    className="p-2.5 rounded-full text-gray-500 hover:text-rose-400 hover:bg-rose-500/10 active:scale-95 disabled:opacity-50 transition-all duration-200 border border-transparent hover:border-rose-500/20"
                  >
                    {isRejecting ? (
                      <Loader2 size={18} className="animate-spin text-rose-400" />
                    ) : (
                      <X size={20} />
                    )}
                  </button>

                  {/* Accept Button */}
                  <button
                    type="button"
                    onClick={() => handleAccept(request._id)}
                    disabled={isBusy}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm text-gray-900 bg-[#fc4a56] hover:bg-[#e03e49] active:scale-95 disabled:opacity-50 transition-all duration-200 shadow-md shadow-[#fc4a56]/20"
                  >
                    {isAccepting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Accept</span>
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
  );
};

export default FriendRequestsPage;