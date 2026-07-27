import { Navigate, Outlet } from "react-router-dom";

const RunAdminRoute = () => {
  const isAdminAuthenticated = localStorage.getItem("buddychat_admin_auth") === "true";
  const hasAdminToken = !!localStorage.getItem("buddychat_admin_token");

  if (!isAdminAuthenticated || !hasAdminToken) {
    return <Navigate to="/run" replace />;
  }

  return <Outlet />;
};

export default RunAdminRoute;
