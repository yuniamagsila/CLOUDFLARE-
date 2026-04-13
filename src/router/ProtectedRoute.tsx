import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import LoadingSpinner from '../components/common/LoadingSpinner';
import type { Role } from '../types';

interface ProtectedRouteProps {
  allowedRoles: Role[];
}

const ROLE_DEFAULT_PATH: Record<Role, string> = {
  admin: '/admin/dashboard',
  komandan: '/komandan/dashboard',
  prajurit: '/prajurit/dashboard',
};

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isInitialized, user } = useAuthStore();

  if (!isInitialized) {
    return <LoadingSpinner fullScreen />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DEFAULT_PATH[user.role]} replace />;
  }

  return <Outlet />;
}
