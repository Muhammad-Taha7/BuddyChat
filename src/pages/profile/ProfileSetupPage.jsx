import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Camera, Loader2, Check, User, AlignLeft, Sparkles } from "lucide-react";
import useAuthStore from "../../store/useAuthStore";
import axios from "../../lib/axios";

const ProfileSetupPage = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    bio: user?.bio || "",
  });

  const [imagePreview, setImagePreview] = useState(user?.profileImage || null);
  const [imageFile, setImageFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.match("image.*")) {
        return toast.error("Please select an image file");
      }
      if (file.size > 5 * 1024 * 1024) {
        return toast.error("Image size must be less than 5MB");
      }

      setImageFile(file);

      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      return toast.error("Full name is required");
    }

    setIsLoading(true);
    try {
      const data = new FormData();
      data.append("fullName", formData.fullName);
      data.append("bio", formData.bio);

      if (user?.publicKey) {
        data.append("publicKey", user.publicKey);
      }

      if (imageFile) {
        data.append("profileImage", imageFile);
      }

      const res = await axios.put("/api/users/profile", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        updateUser(res.data.data.user);
        toast.success("Profile setup complete!");
        navigate("/chat");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const initialLetter = formData.fullName
    ? formData.fullName.charAt(0).toUpperCase()
    : user?.username
    ? user.username.charAt(0).toUpperCase()
    : "U";

  return (
    <div className="min-h-screen bg-white text-gray-900 flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Animated Background SVG Shapes */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" viewBox="0 0 800 600" preserveAspectRatio="none">
        <circle cx="200" cy="150" r="120" fill="none" stroke="#fc4a56" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate" from="0 200 150" to="360 200 150" dur="30s" repeatCount="indefinite" />
          <animate attributeName="r" values="120;140;120" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="600" cy="400" r="90" fill="none" stroke="#fc4a56" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate" from="360 600 400" to="0 600 400" dur="25s" repeatCount="indefinite" />
          <animate attributeName="r" values="90;110;90" dur="5s" repeatCount="indefinite" />
        </circle>
        <rect x="350" y="50" width="100" height="100" rx="20" fill="none" stroke="#fc4a56" strokeWidth="0.4">
          <animateTransform attributeName="transform" type="rotate" from="0 400 100" to="360 400 100" dur="20s" repeatCount="indefinite" />
        </rect>
        <polygon points="100,450 150,350 200,450" fill="none" stroke="#fc4a56" strokeWidth="0.5">
          <animateTransform attributeName="transform" type="rotate" from="0 150 400" to="360 150 400" dur="35s" repeatCount="indefinite" />
        </polygon>
        <path d="M500,100 Q550,50 600,100 T700,100" fill="none" stroke="#fc4a56" strokeWidth="0.5">
          <animate attributeName="d" values="M500,100 Q550,50 600,100 T700,100;M500,120 Q550,70 600,120 T700,120;M500,100 Q550,50 600,100 T700,100" dur="6s" repeatCount="indefinite" />
        </path>
        <circle cx="700" cy="150" r="4" fill="#fc4a56" opacity="0.6">
          <animate attributeName="cy" values="150;130;150" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.2;0.6" dur="3s" repeatCount="indefinite" />
        </circle>
        <circle cx="80" cy="300" r="3" fill="#fc4a56" opacity="0.4">
          <animate attributeName="cy" values="300;280;300" dur="4s" repeatCount="indefinite" />
        </circle>
        <circle cx="650" cy="500" r="5" fill="#fc4a56" opacity="0.5">
          <animate attributeName="r" values="5;8;5" dur="2.5s" repeatCount="indefinite" />
        </circle>
      </svg>

      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#fc4a56]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-64 h-64 bg-[#fc4a56]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-white/80 backdrop-blur-xl border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 animate-fadeIn">
        {/* Header with animated icon */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#fc4a56] to-[#ff7b84] flex items-center justify-center shadow-lg shadow-[#fc4a56]/20">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Almost there!
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-2">
            Let's finish setting up your profile before jumping into chats.
          </p>
        </div>

        {/* Username Chip */}
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 text-center mb-8">
          <p className="text-xs text-gray-500 font-medium">
            Your unique BuddyChat handle
          </p>
          <span className="text-base font-semibold text-[#fc4a56] mt-0.5 block tracking-wide">
            @{user?.username || "username"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-gray-300 hover:border-[#fc4a56] cursor-pointer group transition-all duration-300 shadow-xl bg-gray-100"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile preview"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100 text-2xl font-bold text-gray-700">
                  {initialLetter}
                </div>
              )}

              {/* Upload Overlay */}
              <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Camera className="w-6 h-6 text-gray-900 mb-1" />
                <span className="text-[10px] font-medium text-gray-800 uppercase tracking-wider">
                  Change
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">
              Click to upload a profile picture
            </p>
          </div>

          {/* Display Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 block">
              Display Name <span className="text-[#fc4a56]">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                <User size={18} />
              </div>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc4a56]/30 focus:border-[#fc4a56] transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Bio Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-700 block">
              Bio
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3.5 pointer-events-none text-gray-500">
                <AlignLeft size={18} />
              </div>
              <textarea
                name="bio"
                rows="3"
                value={formData.bio}
                onChange={handleChange}
                disabled={isLoading}
                maxLength={200}
                placeholder="Tell your friends something about yourself..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#fc4a56]/30 focus:border-[#fc4a56] transition-all duration-200 text-sm resize-none"
              />
            </div>
            <div className="text-right text-xs text-gray-500 font-mono">
              {formData.bio.length}/200
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-lg shadow-gray-900/25 transition-all duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Check size={18} />
                <span>Complete Setup</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProfileSetupPage;