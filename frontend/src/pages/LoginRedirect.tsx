import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const LoginRedirect = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on user role
  switch (user.role) {
    case "super_admin":
      return <Navigate to="/admin-dashboard" replace />;
    case "store_manager":
      return <Navigate to="/manager-dashboard" replace />;
    case "field_coach":
      return <Navigate to="/field-coach-dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
};

export default LoginRedirect;
