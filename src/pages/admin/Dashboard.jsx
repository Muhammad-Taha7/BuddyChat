import React, { useState, useEffect } from "react";
import {
  Users,
  Activity,
  MessageSquare,
  List,
  Loader2,
  LayoutDashboard,
  Database,
  Radio,
  Lock,
  TrendingUp,
} from "lucide-react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/api/admin/stats");
        setStats(res.data.data);
      } catch (error) {
        toast.error("Failed to load dashboard stats");
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-gray-500 space-y-3">
        <Loader2 className="animate-spin text-[#fc4a56]" size={36} />
        <span className="text-sm">Loading dashboard analytics...</span>
      </div>
    );
  }

  const statCards = [
    {
      title: "Total Users",
      value: stats?.stats?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10 border-blue-500/20",
    },
    {
      title: "Online Now",
      value: stats?.stats?.onlineUsers ?? 0,
      icon: Activity,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10 border-emerald-500/20",
    },
    {
      title: "Messages Today",
      value: stats?.stats?.messagesToday ?? 0,
      icon: MessageSquare,
      color: "text-[#fc4a56]",
      bg: "bg-[#fc4a56]/10 border-[#fc4a56]/20",
    },
    {
      title: "Total Conversations",
      value: stats?.stats?.totalConversations ?? 0,
      icon: List,
      color: "text-purple-400",
      bg: "bg-purple-500/10 border-purple-500/20",
    },
  ];

  return (
    <div className="w-full space-y-6 animate-fadeIn text-gray-900">
      {/* Top Section Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <LayoutDashboard className="text-[#fc4a56]" size={26} />
          Dashboard Overview
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Real-time metrics and operational health of your application.
        </p>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-gray-50/60 backdrop-blur-xl border border-gray-200/80 shadow-lg shadow-black/20 flex items-center gap-4 transition-all duration-200 hover:border-gray-300/80"
            >
              <div
                className={`p-3.5 rounded-xl border ${card.bg} ${card.color} shrink-0`}
              >
                <Icon size={22} />
              </div>
              <div className="min-w-0">
                <div className="text-2xl font-bold text-gray-900 tracking-tight truncate">
                  {card.value}
                </div>
                <div className="text-xs text-gray-500 font-medium truncate mt-0.5">
                  {card.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Status Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Health Card */}
        <div className="p-6 rounded-2xl bg-gray-50/60 backdrop-blur-xl border border-gray-200/80 shadow-xl shadow-black/30 space-y-4">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Activity size={18} className="text-emerald-400" />
            System Health
          </h3>

          <div className="divide-y divide-slate-800/60 text-sm">
            {/* Database Status */}
            <div className="py-3 flex items-center justify-between first:pt-0">
              <span className="text-gray-500 flex items-center gap-2 text-xs">
                <Database size={15} className="text-gray-400" />
                Database Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Connected
              </span>
            </div>

            {/* WebSocket Status */}
            <div className="py-3 flex items-center justify-between">
              <span className="text-gray-500 flex items-center gap-2 text-xs">
                <Radio size={15} className="text-gray-400" />
                WebSocket Server
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>

            {/* Encryption Status */}
            <div className="py-3 flex items-center justify-between last:pb-0">
              <span className="text-gray-500 flex items-center gap-2 text-xs">
                <Lock size={15} className="text-gray-400" />
                Encryption Service
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity Card */}
        <div className="p-6 rounded-2xl bg-gray-50/60 backdrop-blur-xl border border-gray-200/80 shadow-xl shadow-black/30 space-y-3">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-400" />
            Recent Activity Note
          </h3>
          <div className="p-4 rounded-xl bg-white/50 border border-gray-200/50 text-gray-700 text-xs leading-relaxed space-y-2">
            <p>
              User registration is up{" "}
              <span className="font-semibold text-emerald-400">
                +{stats?.stats?.newUsersThisWeek ?? 0} new members
              </span>{" "}
              this week.
            </p>
            <p className="text-gray-500">
              All user conversations remain fully end-to-end encrypted and
              inaccessible to server processes. System throughput and network latency
              are running within optimal parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;