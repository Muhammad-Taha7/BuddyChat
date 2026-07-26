import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, MessageSquare, LogOut, ShieldAlert } from "lucide-react";
import toast from "react-hot-toast";

const RunLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("buddychat_admin_auth");
    toast.success("Admin logged out");
    navigate("/run");
  };

  const navItems = [
    { name: "Dashboard", path: "/run/Dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/run/Users", icon: Users },
    { name: "Messages", path: "/run/Messages", icon: MessageSquare },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#111827] flex flex-col z-10">
        <div className="p-6 flex items-center gap-3 border-b border-gray-800">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#111827] shadow-md">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-lg">System</h1>
            <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-white text-[#111827] shadow-md"
                      : "text-gray-400 hover:bg-gray-800 hover:text-white"
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:bg-gray-800 hover:text-white rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};

export default RunLayout;
