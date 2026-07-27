import React, { useState, useEffect } from "react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import { Search, Trash2, ShieldAlert, Loader2, Users } from "lucide-react";
import Avatar from "../../components/Avatar";
import { useDialog } from "../../components/DialogProvider";

const UserManagement = () => {
  const { showConfirm, showSuccess, showError } = useDialog();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });

  const fetchUsers = async (page = 1, searchQuery = "") => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `/api/admin/users?page=${page}&search=${searchQuery}`
      );
      setUsers(res.data.data.users);
      setPagination(res.data.data.pagination);
    } catch (error) {
      toast.error("Failed to fetch users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search input
    const timeoutId = setTimeout(() => {
      fetchUsers(1, search);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  const handleDeleteUser = async (userId, username) => {
    showConfirm(
      "Delete User",
      `Are you sure you want to permanently delete @${username}? This action cannot be undone.`,
      async () => {
        try {
          await axios.delete(`/api/admin/users/${userId}`);
          showSuccess("User Deleted", `@${username} has been deleted successfully.`);
          fetchUsers(pagination.page, search);
        } catch (error) {
          showError("Failed", error.response?.data?.message || "Failed to delete user.");
        }
      }
    );
  };

  return (
    <div className="w-full space-y-6 animate-fadeIn text-gray-900">
      {/* Top Header & Search Control */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
            <Users className="text-[#fc4a56]" size={26} />
            User Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Monitor registered members, roles, and platform activity.
          </p>
        </div>

        {/* Search Bar Input */}
        <div className="relative w-full sm:w-72">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50/80 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-slate-500 focus:outline-none focus:border-[#fc4a56] focus:ring-2 focus:ring-[#fc4a56]/20 transition-all duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Admin User Table Container */}
      <div className="w-full overflow-hidden rounded-2xl bg-gray-50/60 backdrop-blur-xl border border-gray-200/80 shadow-xl shadow-black/30">
        {isLoading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-gray-500 space-y-3">
            <Loader2 className="animate-spin text-[#fc4a56]" size={32} />
            <span className="text-sm">Fetching users...</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-700">
              {/* Table Head */}
              <thead className="bg-white/70 text-gray-500 text-xs uppercase font-semibold tracking-wider border-b border-gray-200/80">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    User
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Messages
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* Table Body */}
              <tbody className="divide-y divide-slate-800/60">
                {users.map((user) => (
                  <tr
                    key={user._id}
                    className="hover:bg-gray-100/40 transition-colors duration-150"
                  >
                    {/* User Identity */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar user={user} size="sm" showStatus={false} />
                        <div>
                          <div className="font-semibold text-gray-900 flex items-center gap-2">
                            {user.fullName}
                            {user.isAdmin && (
                              <span className="inline-block px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            @{user.username} • {user.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Online Status */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-2 text-xs font-medium capitalize">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            user.status === "online"
                              ? "bg-emerald-500 shadow-sm shadow-emerald-500/50"
                              : "bg-slate-600"
                          }`}
                        />
                        <span
                          className={
                            user.status === "online"
                              ? "text-emerald-400"
                              : "text-gray-500"
                          }
                        >
                          {user.status}
                        </span>
                      </span>
                    </td>

                    {/* Messages Count */}
                    <td className="px-6 py-4 font-mono text-gray-700">
                      {user.messageCount}
                    </td>

                    {/* Joined Date */}
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Action Controls */}
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleDeleteUser(user._id, user.username)
                        }
                        disabled={user.isAdmin}
                        title={
                          user.isAdmin ? "Cannot delete admin" : "Delete user"
                        }
                        className={`p-2 rounded-lg transition-all duration-200 ${
                          user.isAdmin
                            ? "text-slate-600 cursor-not-allowed"
                            : "text-rose-400 hover:text-gray-900 hover:bg-rose-500/20 active:scale-95"
                        }`}
                      >
                        {user.isAdmin ? (
                          <ShieldAlert size={18} />
                        ) : (
                          <Trash2 size={18} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Empty State */}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      No users found matching "
                      <span className="text-gray-800">{search}</span>"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            disabled={pagination.page === 1}
            onClick={() => fetchUsers(pagination.page - 1, search)}
            className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="text-xs text-gray-500 px-2 font-mono">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            disabled={pagination.page === pagination.pages}
            onClick={() => fetchUsers(pagination.page + 1, search)}
            className="px-4 py-2 rounded-xl bg-gray-50 border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserManagement;