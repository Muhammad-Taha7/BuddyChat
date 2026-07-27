import React, { useEffect, useRef } from "react";
import { Bell, Check, Trash2, UserPlus, PhoneOff, Info, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import useNotificationStore from "../store/useNotificationStore";

const NotificationDropdown = ({ isOpen, onClose }) => {
  const dropdownRef = useRef(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getIcon = (type) => {
    switch (type) {
      case "friend_request": return <UserPlus size={16} className="text-blue-500" />;
      case "friend_accept": return <UserCheck size={16} className="text-emerald-500" />;
      case "missed_call": return <PhoneOff size={16} className="text-red-500" />;
      default: return <Info size={16} className="text-gray-500" />;
    }
  };

  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case "friend_request": return "/requests";
      case "friend_accept": return `/chat`;
      case "missed_call": return `/chat`;
      default: return "#";
    }
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-14 right-4 sm:right-auto sm:left-4 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden animate-fadeIn origin-top"
    >
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          Notifications
          {unreadCount > 0 && (
            <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </h3>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead()}
            className="text-xs text-gray-500 hover:text-black font-medium transition-colors flex items-center gap-1"
          >
            <Check size={14} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-[350px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        {notifications.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-3 text-gray-400">
              <Bell size={20} />
            </div>
            <p className="text-sm text-gray-500 font-medium">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`flex gap-3 p-4 hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/30' : ''}`}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden">
                  {notif.sender?.profileImage ? (
                    <img src={notif.sender.profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    getIcon(notif.type)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <Link
                    to={getNotificationLink(notif)}
                    onClick={() => {
                      if (!notif.isRead) markAsRead(notif._id);
                      onClose();
                    }}
                    className="block focus:outline-none"
                  >
                    <p className={`text-sm ${!notif.isRead ? 'text-gray-900 font-semibold' : 'text-gray-700 font-medium'}`}>
                      {notif.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(notif.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </Link>
                </div>
                
                {!notif.isRead && (
                  <button
                    onClick={() => markAsRead(notif._id)}
                    className="shrink-0 w-6 h-6 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-black transition-colors"
                    title="Mark as read"
                  >
                    <div className="w-2 h-2 rounded-full bg-black"></div>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
