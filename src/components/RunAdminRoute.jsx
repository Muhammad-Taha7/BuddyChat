import { Navigate, Outlet } from "react-router-dom";

const RunAdminRoute = () => {
  const isAdminAuthenticated = localStorage.getItem("buddychat_admin_auth") === "true";

  if (!isAdminAuthenticated) {
    return <Navigate to="/run" replace />;
  }

  return <Outlet />;
};

export default RunAdminRoute;
