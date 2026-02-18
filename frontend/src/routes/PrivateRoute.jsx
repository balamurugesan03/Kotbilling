import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { canAccessRoute, getDefaultRoute } from '../utils/permissions';
import { getRouteConfig } from './routeConfig';
import { Center, Loader } from '@mantine/core';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check route permissions
  const routeConfig = getRouteConfig(location.pathname);

  if (routeConfig && routeConfig.permissions) {
    const hasAccess = canAccessRoute(role, routeConfig.permissions);

    if (!hasAccess) {
      // Redirect to role's default route if no access
      const defaultRoute = getDefaultRoute(role);
      return <Navigate to={defaultRoute} replace />;
    }
  }

  return children;
};

export default PrivateRoute;
