// Permission definitions matching frontend
const PERMISSIONS = {
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
  VIEW_AGGREGATOR_STATS: 'view_aggregator_stats'
};

// Role permissions mapping
const ROLE_PERMISSIONS = {
  admin: Object.values(PERMISSIONS),
  waiter: [
    PERMISSIONS.VIEW_DASHBOARD,
    PERMISSIONS.VIEW_TABLES,
    PERMISSIONS.MANAGE_TABLES,
    PERMISSIONS.CREATE_ORDER,
    PERMISSIONS.EDIT_ORDER,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.PROCESS_PAYMENT
  ]
};

// Check if role has permission
const hasPermission = (role, permission) => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

// Middleware to check roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }
    next();
  };
};

// Middleware to check permissions
const requirePermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const hasRequiredPermission = permissions.some(permission =>
      hasPermission(req.user.role, permission)
    );

    if (!hasRequiredPermission) {
      return res.status(403).json({
        message: 'You do not have permission to perform this action'
      });
    }
    next();
  };
};

module.exports = {
  authorize,
  requirePermission,
  hasPermission,
  PERMISSIONS,
  ROLE_PERMISSIONS
};
