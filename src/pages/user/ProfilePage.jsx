import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Check,
  MessageSquare,
  Clock,
  Loader2,
  Edit3,
  Key,
  X,
} from "lucide-react";
import axios from "../../lib/axios";
import { toast } from "react-hot-toast";
import Avatar from "../../components/Avatar";
import useAuthStore from "../../store/useAuthStore";
import useChatStore from "../../store/useChatStore";
import { useDialog } from "../../components/DialogProvider";

const ProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const { getOrCreateConversation } = useChatStore();
  const { showConfirm, showSuccess, showError } = useDialog();

  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get(`/api/users/${id}`);
        setProfileData(res.data.data);
      } catch (error) {
        toast.error("Failed to load profile");
        navigate("/chat");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [id, navigate]);

  const handleSendRequest = async () => {
    setIsSendingRequest(true);
    try {
      const res = await axios.post(`/api/users/friend-request/${id}`);
      if (res.data.success) {
        toast.success("Friend request sent!");
        setProfileData((prev) => ({ ...prev, requestSent: true }));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleMessage = async () => {
    const conversation = await getOrCreateConversation(id);
    if (conversation) {
      navigate("/chat");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    
    if (passwordForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    setIsChangingPassword(true);
    try {
      const res = await axios.put("/api/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      if (res.data.success) {
        showSuccess("Password Updated", "Your password has been changed successfully.");
        setShowPasswordModal(false);
        setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#fc4a56] animate-spin" />
      </div>
    );
  }

  if (!profileData) return null;

  const { user, isFriend, hasPendingRequest, requestSent } = profileData;

  return (
    <div className="min-h-screen bg-white text-gray-900 px-4 py-6 sm:px-8 max-w-2xl mx-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          to="/chat"
          className="p-2.5 rounded-full text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-colors duration-200"
          aria-label="Back to chat"
        >
          <ArrowLeft size={22} />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profile</h1>
      </div>

      {/* Main Profile Card */}
      <div className="bg-gray-50/60 border border-gray-200 rounded-3xl p-8 flex flex-col items-center text-center backdrop-blur-sm shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#fc4a56]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Avatar */}
        <div className="relative mb-5 transform hover:scale-105 transition-transform duration-200">
          <Avatar user={user} size="2xl" showStatus={true} />
        </div>

        {/* User Info */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
          {user.fullName}
        </h2>

        <p className="text-[#fc4a56] font-semibold text-base mb-4">
          @{user.username}
        </p>

        {user.bio && (
          <p className="text-gray-700 text-sm sm:text-base max-w-md mx-auto mb-6 leading-relaxed bg-gray-100/40 px-4 py-3 rounded-2xl border border-gray-200/60">
            {user.bio}
          </p>
        )}

        <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm mb-8 bg-gray-100/30 px-3 py-1.5 rounded-full border border-gray-200">
          <Clock size={14} className="text-gray-500" />
          <span>
            Joined{" "}
            {new Date(user.createdAt).toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col items-center gap-3 w-full max-w-xs">
          {!isOwnProfile && (
            <>
              {isFriend || currentUser?.isAdmin ? (
                <button
                  onClick={handleMessage}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-gray-900 bg-[#fc4a56] hover:bg-[#e03e49] active:scale-95 transition-all shadow-lg shadow-[#fc4a56]/20"
                >
                  <MessageSquare size={18} />
                  <span>Message</span>
                </button>
              ) : requestSent ? (
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-gray-700 bg-gray-100 border border-gray-300/60 cursor-not-allowed"
                >
                  <Check size={18} className="text-emerald-400" />
                  <span>Request Sent</span>
                </button>
              ) : hasPendingRequest ? (
                <Link
                  to="/requests"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-gray-900 bg-[#fc4a56] hover:bg-[#e03e49] active:scale-95 transition-all shadow-lg shadow-[#fc4a56]/20"
                >
                  <span>Review Request</span>
                </Link>
              ) : (
                <button
                  onClick={handleSendRequest}
                  disabled={isSendingRequest}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-gray-900 bg-[#fc4a56] hover:bg-[#e03e49] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#fc4a56]/20"
                >
                  {isSendingRequest ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Add Friend</span>
                    </>
                  )}
                </button>
              )}

              {/* Secondary Actions (Block / Unfriend) */}
              <div className="flex w-full gap-2 mt-2">
                {isFriend && (
                  <button
                    onClick={() => {
                      showConfirm(
                        "Unfriend",
                        "Are you sure you want to remove this friend?",
                        async () => {
                          try {
                            await axios.delete(`/api/users/friend/${id}`);
                            showSuccess("Unfriended", "Friend removed successfully.");
                            setProfileData(prev => ({ ...prev, isFriend: false }));
                          } catch(e) {
                            showError("Failed", "Failed to remove friend.");
                          }
                        },
                        { confirmText: "Unfriend" }
                      );
                    }}
                    className="flex-1 py-2.5 rounded-xl font-medium text-xs text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
                  >
                    Unfriend
                  </button>
                )}
                <button
                  onClick={() => {
                    const isBlocked = currentUser?.blockedUsers?.includes(id);
                    showConfirm(
                      isBlocked ? "Unblock User" : "Block User",
                      isBlocked 
                        ? "Are you sure you want to unblock this user? They will be able to message you again."
                        : "Are you sure you want to block this user? They will no longer be able to message you.",
                      async () => {
                        try {
                          const res = await axios.put(`/api/users/block/${id}`);
                          showSuccess("Success", res.data.message);
                          // Update local state if needed (usually handled by auth store refetch or similar)
                        } catch(e) {
                          showError("Failed", "Failed to block/unblock user.");
                        }
                      },
                      { confirmText: isBlocked ? "Unblock" : "Block", type: isBlocked ? "info" : "confirm-danger" }
                    );
                  }}
                  className={`flex-1 py-2.5 rounded-xl font-medium text-xs transition-colors ${
                    currentUser?.blockedUsers?.includes(id)
                      ? "text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                      : "text-gray-700 bg-gray-100 border border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {currentUser?.blockedUsers?.includes(id) ? "Unblock User" : "Block User"}
                </button>
              </div>
            </>
          )}

          {isOwnProfile && (
            <div className="w-full flex flex-col gap-3">
              <Link
                to="/profile-setup"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 active:scale-95 transition-all"
              >
                <Edit3 size={18} />
                <span>Edit Profile</span>
              </Link>
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium text-sm text-gray-800 bg-gray-100 hover:bg-gray-200 border border-gray-300 active:scale-95 transition-all"
              >
                <Key size={18} />
                <span>Change Password</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Change Password</h3>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fc4a56]/20 focus:border-[#fc4a56] outline-none"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fc4a56]/20 focus:border-[#fc4a56] outline-none"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#fc4a56]/20 focus:border-[#fc4a56] outline-none"
                  placeholder="Confirm new password"
                />
              </div>

              <button
                type="submit"
                disabled={isChangingPassword}
                className="w-full mt-6 py-3 bg-[#fc4a56] text-white rounded-xl font-medium hover:bg-[#e03e49] focus:ring-4 focus:ring-[#fc4a56]/20 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-[#fc4a56]/20"
              >
                {isChangingPassword ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;