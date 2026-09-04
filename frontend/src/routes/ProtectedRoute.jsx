import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loading from "@/components/ui/Loading";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    allowedRoles.length > 0 &&
    !allowedRoles.includes(user.role)
  ) {
    return <Navigate to={`/${user.role}/dashboard`} replace />;
  }

  return children;
};

export default ProtectedRoute;
