import React, { useEffect, useState } from "react";
import {
  Users, MessageSquare, Activity, UserCheck, TrendingUp, Calendar,
  Shield, Zap, Database, Globe, BarChart3, ArrowUpRight
} from "lucide-react";
import axiosInstance from "../../lib/axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell
} from "recharts";

const StatCard = ({ title, value, icon: Icon, subtitle, trend }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 group">
    <div className="flex items-center justify-between mb-4">
      <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center group-hover:scale-105 transition-transform">
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
          <ArrowUpRight size={12} />
          {trend}
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
      {typeof value === "number" ? value.toLocaleString() : value}
    </h3>
    <p className="text-xs font-medium text-gray-500 mt-1">{title}</p>
    {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl">
        <p className="font-semibold mb-0.5">{label}</p>
        <p className="text-gray-300">
          {payload[0].name}: <span className="text-white font-bold">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = ["#111827", "#6b7280", "#d1d5db", "#e5e7eb"];

const RunDashboard = () => {
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axiosInstance.get("/admin/stats");
        setStats(res.data.data.stats);
        setCharts(res.data.data.charts);
      } catch (error) {
        console.error("Stats fetch error", error);
        setStats({
          totalUsers: 0, verifiedUsers: 0, onlineUsers: 0,
          totalMessages: 0, messagesToday: 0, totalConversations: 0,
          newUsersThisWeek: 0,
        });
        setCharts({ usersByDay: [], messagesByDay: [] });
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const formatChartData = (data) => {
    if (!data) return [];
    return data.map((item) => ({
      date: new Date(item._id).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: item.count,
    }));
  };

  const userChartData = formatChartData(charts?.usersByDay);
  const messageChartData = formatChartData(charts?.messagesByDay);

  // Pie data for user composition
  const pieData = [
    { name: "Online", value: stats?.onlineUsers || 0 },
    { name: "Offline", value: Math.max(0, (stats?.totalUsers || 0) - (stats?.onlineUsers || 0)) },
  ];

  const verificationRate = stats?.totalUsers
    ? Math.round((stats.verifiedUsers / stats.totalUsers) * 100)
    : 0;

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time system analytics and user insights</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white px-3.5 py-2 rounded-full border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Live
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Users"
          value={stats?.totalUsers || 0}
          icon={Users}
          trend={stats?.newUsersThisWeek > 0 ? `+${stats.newUsersThisWeek} this week` : null}
        />
        <StatCard
          title="Active Now"
          value={stats?.onlineUsers || 0}
          icon={Activity}
          subtitle="Real-time connected users"
        />
        <StatCard
          title="Total Messages"
          value={stats?.totalMessages || 0}
          icon={MessageSquare}
          trend={stats?.messagesToday > 0 ? `${stats.messagesToday} today` : null}
        />
        <StatCard
          title="Verified Users"
          value={stats?.verifiedUsers || 0}
          icon={UserCheck}
          subtitle={`${verificationRate}% verification rate`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* User Signups Area Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">New Signups</h2>
              <p className="text-xs text-gray-500 mt-0.5">User registrations over the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <Calendar size={12} />
              7 days
            </div>
          </div>
          {userChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={userChartData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111827" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="count" name="Users" stroke="#111827" strokeWidth={2} fill="url(#colorUsers)" dot={{ r: 3, fill: "#111827" }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>

        {/* Messages Bar Chart */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Message Activity</h2>
              <p className="text-xs text-gray-500 mt-0.5">Messages sent in the last 7 days</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <BarChart3 size={12} />
              Daily
            </div>
          </div>
          {messageChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={messageChartData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Messages" fill="#111827" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">No data yet</div>
          )}
        </div>
      </div>

      {/* Bottom Section: User Composition + System Health + Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* User Composition Pie */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">User Status</h2>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" startAngle={90} endAngle={-270}>
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-900" />
              <span className="text-xs text-gray-600">Online ({stats?.onlineUsers || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-400" />
              <span className="text-xs text-gray-600">Offline ({Math.max(0, (stats?.totalUsers || 0) - (stats?.onlineUsers || 0))})</span>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">System Health</h2>
          <div className="space-y-3">
            {[
              { name: "API Server", icon: Globe, status: "Operational" },
              { name: "Database", icon: Database, status: "Operational" },
              { name: "WebRTC Signaling", icon: Zap, status: "Operational" },
              { name: "Auth Service", icon: Shield, status: "Operational" },
            ].map((svc) => (
              <div key={svc.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center gap-3">
                  <svc.icon size={14} className="text-gray-500" />
                  <div>
                    <p className="font-medium text-gray-900 text-xs">{svc.name}</p>
                    <p className="text-[10px] text-gray-400">{svc.status}</p>
                  </div>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40" />
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-5">Quick Stats</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Total Conversations</span>
              <span className="font-bold text-gray-900 text-sm">{stats?.totalConversations || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Messages Today</span>
              <span className="font-bold text-gray-900 text-sm">{stats?.messagesToday || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-600">New Users (Week)</span>
              <span className="font-bold text-gray-900 text-sm">{stats?.newUsersThisWeek || 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Verification Rate</span>
              <span className="font-bold text-gray-900 text-sm">{verificationRate}%</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-xs font-medium text-gray-600">Admin Portal</span>
              <span className="font-bold text-emerald-600 text-sm">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RunDashboard;
