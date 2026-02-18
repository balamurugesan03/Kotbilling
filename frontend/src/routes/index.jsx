import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/permissions';
import PrivateRoute from './PrivateRoute';
import AppShell from '../components/layout/AppShell';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Tables from '../pages/Tables';
import OrderEntry from '../pages/OrderEntry';
import Billing from '../pages/Billing';
import OnlineOrders from '../pages/OnlineOrders';

// Admin Pages
import MenuManagement from '../pages/admin/MenuManagement';
import Inventory from '../pages/admin/Inventory';
import Reports from '../pages/admin/Reports';
import Settings from '../pages/admin/Settings';
import Aggregators from '../pages/admin/Aggregators';
import MenuSync from '../pages/admin/MenuSync';

const AppRoutes = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRoute(role)} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Protected Routes */}
      <Route
        element={
          <PrivateRoute>
            <AppShell />
          </PrivateRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/order-entry" element={<OrderEntry />} />
        <Route path="/order-entry/:tableId" element={<OrderEntry />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/:orderId" element={<Billing />} />
        <Route path="/online-orders" element={<OnlineOrders />} />

        {/* Admin Routes */}
        <Route path="/admin/menu" element={<MenuManagement />} />
        <Route path="/admin/inventory" element={<Inventory />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/aggregators" element={<Aggregators />} />
        <Route path="/admin/menu-sync/:platform" element={<MenuSync />} />
      </Route>

      {/* Default redirect */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRoute(role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* 404 redirect */}
      <Route
        path="*"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRoute(role)} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

export default AppRoutes;
