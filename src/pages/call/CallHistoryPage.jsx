import React, { useState, useEffect } from "react";
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Video,
  ArrowLeft,
  Trash2,
  Loader2,
  Clock,
  UserPlus
} from "lucide-react";
import { Link } from "react-router-dom";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import Avatar from "../../components/Avatar";
import useCallStore from "../../store/useCallStore";
import useAuthStore from "../../store/useAuthStore";
import { useDialog } from "../../components/DialogProvider";

const CallHistoryPage = () => {
  const [callLogs, setCallLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'missed'

  const { user } = useAuthStore();
  const { initiateCall } = useCallStore();
  const { showConfirm, showSuccess, showError } = useDialog();

  useEffect(() => {
    fetchCallHistory();
  }, []);

  const fetchCallHistory = async () => {
    try {
      setIsLoading(true);
      const res = await axios.get("/api/calls/history");
      setCallLogs(res.data?.data?.callLogs || []);
    } catch {
      toast.error("Failed to load call history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    showConfirm(
      "Clear Call History",
      "Are you sure you want to delete all call logs? This cannot be undone.",
      async () => {
        try {
          const res = await axios.delete("/api/calls/history");
          if (res.data.success) {
            toast.success("Call history cleared");
            setCallLogs([]);
          }
        } catch {
          toast.error("Failed to clear call history");
        }
      },
      { confirmText: "Clear All", cancelText: "Cancel", type: "warning" }
    );
  };

  const handleDeleteLog = async (logId, e) => {
    e.stopPropagation();
    try {
      const res = await axios.delete(`/api/calls/history/${logId}`);
      if (res.data.success) {
        setCallLogs((prev) => prev.filter((l) => l._id !== logId));
        toast.success("Call log removed");
      }
    } catch {
      toast.error("Failed to delete log");
    }
  };

  const handleCallBack = (otherUser, callType) => {
    if (!otherUser) return;
    initiateCall(otherUser, callType || "voice");
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "0s";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const formatCallDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday =
      new Date(Date.now() - 86400000).toDateString() === date.toDateString();

    const timeStr = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) return `Today, ${timeStr}`;
    if (isYesterday) return `Yesterday, ${timeStr}`;
    return `${date.toLocaleDateString([], {
      month: "short",
      day: "numeric",
    })}, ${timeStr}`;
  };

  const filteredLogs = callLogs.filter((log) => {
    if (filterTab === "missed") {
      return log.status === "missed";
    }
    return true;
  });

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 pb-20"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-8 py-4 shadow-xs">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/chat"
              className="w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all active:scale-95"
              aria-label="Back to chat"
            >
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-none">Call History</h1>
              <p className="text-xs text-gray-500 font-light mt-1">
                {callLogs.length} total calls recorded
              </p>
            </div>
          </div>

          {callLogs.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold text-red-600 hover:bg-red-50 transition-all active:scale-95"
            >
              <Trash2 size={14} />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-6">
        {/* ── TABS ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 p-1 bg-gray-200/70 rounded-full">
            <button
              onClick={() => setFilterTab("all")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterTab === "all"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              All Calls ({callLogs.length})
            </button>
            <button
              onClick={() => setFilterTab("missed")}
              className={`px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                filterTab === "missed"
                  ? "bg-white text-black shadow-xs"
                  : "text-gray-600 hover:text-black"
              }`}
            >
              Missed ({callLogs.filter((l) => l.status === "missed").length})
            </button>
          </div>
        </div>

        {/* ── CALL LOGS LIST ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            <p className="text-sm text-gray-500 font-light">Loading call history...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-3xl border border-gray-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 text-gray-400">
              <Phone size={28} />
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">
              {filterTab === "missed" ? "No missed calls" : "No call history yet"}
            </h3>
            <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed mb-6">
              When you make or receive voice and video calls, they will show up here.
            </p>
            <Link
              to="/friends"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-all active:scale-95 shadow-sm"
            >
              <UserPlus size={14} />
              Call a Friend
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => {
              const isCaller = log.caller?._id === user?._id;
              const otherUser = isCaller ? log.receiver : log.caller;
              const isMissed = log.status === "missed";
              const isRejected = log.status === "rejected" || log.status === "busy";
              const isVideo = log.callType === "video";

              return (
                <div
                  key={log._id}
                  className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-xs transition-all duration-200 group"
                >
                  {/* User info */}
                  <Link
                    to={`/profile/${otherUser?._id}`}
                    className="flex items-center gap-3.5 flex-1 min-w-0 pr-3"
                  >
                    <Avatar user={otherUser} size="lg" showStatus={false} />
                    <div className="truncate">
                      <h3
                        className={`text-sm font-semibold truncate leading-snug ${
                          isMissed && !isCaller ? "text-red-500" : "text-gray-900"
                        }`}
                      >
                        {otherUser?.fullName || "BuddyChat User"}
                      </h3>

                      {/* Direction & Status info */}
                      <div className="flex items-center gap-2 mt-1">
                        {isCaller ? (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                            <PhoneOutgoing size={12} />
                            Outgoing
                          </span>
                        ) : isMissed ? (
                          <span className="flex items-center gap-1 text-[11px] text-red-500 font-medium">
                            <PhoneMissed size={12} />
                            Missed
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11px] text-blue-600 font-medium">
                            <PhoneIncoming size={12} />
                            Incoming
                          </span>
                        )}

                        <span className="text-gray-300 text-[10px]">·</span>

                        <span className="text-[11px] text-gray-400 font-light">
                          {formatCallDate(log.createdAt)}
                        </span>

                        {log.duration > 0 && (
                          <>
                            <span className="text-gray-300 text-[10px]">·</span>
                            <span className="text-[11px] text-gray-500 font-mono">
                              {formatDuration(log.duration)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </Link>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Call Back Button */}
                    <button
                      type="button"
                      onClick={() => handleCallBack(otherUser, isVideo ? "video" : "voice")}
                      title={isVideo ? "Video Call Back" : "Voice Call Back"}
                      className="w-10 h-10 rounded-full bg-gray-100 hover:bg-black hover:text-white text-gray-700 flex items-center justify-center transition-all active:scale-95 shadow-xs"
                    >
                      {isVideo ? <Video size={18} /> : <Phone size={18} />}
                    </button>

                    {/* Delete item */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteLog(log._id, e)}
                      title="Delete entry"
                      className="w-8 h-8 rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={14} />
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

export default CallHistoryPage;
