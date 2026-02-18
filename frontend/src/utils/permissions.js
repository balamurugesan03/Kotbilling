import { ROLES } from './constants';

// Define permissions
export const PERMISSIONS = {
  VIEW_DASHBOARD: 'view_dashboard',
  VIEW_TABLES: 'view_tables',
  MANAGE_TABLES: 'manage_tables',
  CREATE_ORDER: 'create_order',
  EDIT_ORDER: 'edit_order',
  CANCEL_ORDER: 'cancel_order',
  VIEW_BILLING: 'view_billing',
  PROCESS_PAYMENT: 'process_payment',
  VIEW_KITCHEN: 'view_kitchen',
  UPDATE_KITCHEN_STATUS: 'update_kitchen_status',
  VIEW_ONLINE_ORDERS: 'view_online_orders',
  ACCEPT_ONLINE_ORDERS: 'accept_online_orders',
  VIEW_REPORTS: 'view_reports',
  MANAGE_MENU: 'manage_menu',
  MANAGE_INVENTORY: 'manage_inventory',
  MANAGE_USERS: 'manage_users',
  MANAGE_SETTINGS: 'manage_settings',
  MANAGE_AGGREGATORS: 'manage_aggregators',
  VIEW_AGGREGATOR_STATS: 'view_aggregator_stats',
};

// Role-Permission Matrix
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
    PERMISSIONS.CANCEL_ORDER,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.PROCESS_PAYMENT,
    PERMISSIONS.VIEW_ONLINE_ORDERS,
    PERMISSIONS.ACCEPT_ONLINE_ORDERS,
    PERMISSIONS.VIEW_REPORTS,
    PERMISSIONS.MANAGE_MENU,
    PERMISSIONS.MANAGE_INVENTORY,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.MANAGE_AGGREGATORS,
    PERMISSIONS.VIEW_AGGREGATOR_STATS,
  ],
  [ROLES.WAITER]: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
  ],
};

// Check if a role has a specific permission
export const hasPermission = (role, permission) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

// Get all permissions for a role
export const getRolePermissions = (role) => {
  return ROLE_PERMISSIONS[role] || [];
};

// Check if a role can access a specific route
export const canAccessRoute = (role, requiredPermissions) => {
  if (!role || !requiredPermissions) return false;
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }
  return requiredPermissions.some(perm => hasPermission(role, perm));
};

// Default landing page per role
export const getDefaultRoute = (role) => {
  switch (role) {
    case ROLES.ADMIN:
      return '/dashboard';
    case ROLES.WAITER:
      return '/tables';
    default:
      return '/login';
  }
};
