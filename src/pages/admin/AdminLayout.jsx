import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Activity,
  MessageSquare,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import useAuthStore from "../../store/useAuthStore";

const AdminLayout = () => {
  const location = useLocation();
  const { logout } = useAuthStore();

  const navItems = [
    {
      path: "/admin/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={20} />,
    },
    {
      path: "/admin/users",
      label: "User Management",
      icon: <Users size={20} />,
    },
    {
      path: "/admin/messages",
      label: "Message Monitor",
      icon: <Activity size={20} />,
    },
  ];

  return (
    <div className="min-h-screen w-full bg-white text-gray-900 flex overflow-hidden font-sans">
      {/* Sidebar Navigation Panel */}
      <aside className="w-64 shrink-0 flex flex-col justify-between bg-gray-50/60 backdrop-blur-2xl border-r border-gray-200/80 p-5 z-20">
        <div className="space-y-6">
          {/* Logo Header */}
          <div className="flex items-center gap-3 px-2 pt-1">
            <div className="p-2 rounded-xl bg-[#fc4a56]/10 border border-[#fc4a56]/20 text-[#fc4a56]">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                BuddyChat
              </h2>
              <span className="text-[10px] font-semibold tracking-wider text-gray-500 uppercase">
                Control Panel
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#fc4a56]/10 text-[#fc4a56] font-semibold border-r-2 border-[#fc4a56] shadow-sm shadow-[#fc4a56]/10"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100/50"
                  }`}
                >
                  <span
                    className={`${
                      isActive ? "text-[#fc4a56]" : "text-gray-500"
                    }`}
                  >
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="space-y-2 pt-4 border-t border-gray-200/60">
          <Link
            to="/chat"
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100/60 transition-all duration-200"
          >
            <MessageSquare size={18} className="text-gray-500" />
            <span>Go to App</span>
          </Link>

          <button
            onClick={logout}
            className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all duration-200 text-left"
          >
            <LogOut size={18} className="text-rose-400" />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Scrollable View Area */}
      <main className="flex-1 overflow-y-auto p-8 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;