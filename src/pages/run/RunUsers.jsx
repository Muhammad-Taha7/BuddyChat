import React, { useEffect, useState } from "react";
import axiosInstance from "../../lib/axios";
import { format } from "date-fns";
import {
  Eye, ShieldBan, ShieldCheck, Search, X, MessageSquare,
  Users as UsersIcon, Mail, Calendar, Loader2
} from "lucide-react";
import toast from "react-hot-toast";

const RunUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // User detail modal
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axiosInstance.get("/admin/users");
      setUsers(res.data.data.users);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async (userId) => {
    try {
      const res = await axiosInstance.put(`/admin/users/${userId}/ban`);
      toast.success(res.data.message);
      setUsers(users.map(u =>
        u._id === userId ? { ...u, isBanned: res.data.data.isBanned } : u
      ));
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to block user");
    }
  };

  const handleViewUser = async (userId) => {
    setSelectedUser(userId);
    setDetailsLoading(true);
    try {
      const res = await axiosInstance.get(`/admin/users/${userId}/details`);
      setUserDetails(res.data.data);
    } catch (error) {
      toast.error("Failed to load user details");
      setSelectedUser(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const filteredUsers = users.filter(u =>
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto bg-gray-50 min-h-full">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage and monitor {users.length} registered users</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent outline-none transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">User</th>
                <th className="p-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">Status</th>
                <th className="p-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">Joined</th>
                <th className="p-4 font-semibold text-gray-900 text-xs uppercase tracking-wider text-center">Messages</th>
                <th className="p-4 font-semibold text-gray-900 text-xs uppercase tracking-wider">Role</th>
                <th className="p-4 font-semibold text-gray-900 text-xs uppercase tracking-wider text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user._id} className={`border-b border-gray-100 hover:bg-gray-50/80 transition-colors ${user.isBanned ? 'bg-red-50/20' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={user.profileImage || `https://ui-avatars.com/api/?name=${user.username}&background=f3f4f6&color=111827`}
                        alt={user.username}
                        className="w-10 h-10 rounded-full object-cover bg-gray-100 border border-gray-200"
                      />
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{user.fullName}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                        user.isBanned
                          ? "bg-red-50 text-red-700 border-red-200"
                          : user.status === "online"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-gray-50 text-gray-600 border-gray-200"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        user.isBanned ? 'bg-red-500' : user.status === "online" ? "bg-emerald-500" : "bg-gray-400"
                      }`} />
                      {user.isBanned ? "Blocked" : user.status}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600 font-medium">
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </td>
                  <td className="p-4 text-sm text-gray-900 font-bold text-center">
                    {user.messageCount || 0}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wide border ${
                        user.isAdmin
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-600 border-gray-200"
                      }`}
                    >
                      {user.isAdmin ? "Admin" : "User"}
                    </span>
                  </td>
                  <td className="p-4 pr-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewUser(user._id)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-600 hover:text-white hover:bg-gray-900 border border-transparent hover:border-gray-800 transition-all"
                        title="View details"
                      >
                        <Eye size={15} />
                      </button>
                      {!user.isAdmin && (
                        <button
                          onClick={() => handleBanUser(user._id)}
                          className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all ${
                            user.isBanned
                              ? "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                              : "text-red-600 border-red-200 hover:bg-red-50"
                          }`}
                          title={user.isBanned ? "Unblock user" : "Block user"}
                        >
                          {user.isBanned ? <ShieldCheck size={15} /> : <ShieldBan size={15} />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 text-sm">
                    No users found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col border border-gray-200">
            {detailsLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
              </div>
            ) : userDetails ? (
              <>
                {/* Modal Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between shrink-0 bg-gray-50">
                  <div className="flex items-center gap-4">
                    <img
                      src={userDetails.user.profileImage || `https://ui-avatars.com/api/?name=${userDetails.user.username}&background=111827&color=fff`}
                      alt=""
                      className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg">{userDetails.user.fullName}</h3>
                      <p className="text-sm text-gray-500 font-medium">@{userDetails.user.username}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setSelectedUser(null); setUserDetails(null); }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 hover:text-gray-900 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* User Info Grid */}
                <div className="p-6 border-b border-gray-100 shrink-0">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <Mail size={12} /> Email
                      </span>
                      <span className="text-sm font-medium text-gray-900 truncate">{userDetails.user.email}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <Calendar size={12} /> Joined
                      </span>
                      <span className="text-sm font-medium text-gray-900">{format(new Date(userDetails.user.createdAt), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <UsersIcon size={12} /> Friends
                      </span>
                      <span className="text-sm font-medium text-gray-900">{userDetails.user.friends?.length || 0}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <MessageSquare size={12} /> Messages
                      </span>
                      <span className="text-sm font-medium text-gray-900">{userDetails.messages?.length || 0}</span>
                    </div>
                  </div>
                  {userDetails.user.bio && (
                    <div className="mt-5 p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Bio</p>
                      <p className="text-sm text-gray-700">{userDetails.user.bio}</p>
                    </div>
                  )}
                </div>

                {/* Recent Messages */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                  <h4 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-gray-400" />
                    Recent Messages
                  </h4>
                  {userDetails.messages?.length > 0 ? (
                    <div className="space-y-3">
                      {userDetails.messages.slice(0, 50).map(msg => (
                        <div key={msg._id} className="flex items-start gap-3 p-3.5 bg-white rounded-xl border border-gray-200 shadow-sm text-sm">
                          <div className="shrink-0 mt-0.5">
                            <img
                              src={msg.sender?.profileImage || `https://ui-avatars.com/api/?name=${msg.sender?.username}&size=24&background=f3f4f6&color=111827`}
                              alt="" className="w-7 h-7 rounded-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-gray-900 text-xs">{msg.sender?.fullName}</span>
                              <span className="text-[10px] font-medium text-gray-400">{format(new Date(msg.createdAt), "MMM d, HH:mm")}</span>
                              {msg.isDeletedForUsers && (
                                <span className="text-[9px] uppercase tracking-wider bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100 font-bold">Deleted</span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm truncate">
                              {msg.type === 'text' ? msg.content : msg.type === 'image' ? '📷 Image attached' : msg.type === 'voice' ? '🎤 Voice note' : '📎 File attached'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-white rounded-xl border border-gray-200 border-dashed">
                      <p className="text-gray-500 text-sm font-medium">No messages found</p>
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default RunUsers;
