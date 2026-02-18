import { PERMISSIONS } from '../utils/permissions';

export const routeConfig = [
  {
    path: '/login',
    public: true,
  },
  {
    path: '/dashboard',
    permissions: [PERMISSIONS.VIEW_DASHBOARD],
  },
  {
    path: '/tables',
    permissions: [PERMISSIONS.VIEW_TABLES],
  },
  {
    path: '/order-entry',
    permissions: [PERMISSIONS.CREATE_ORDER],
  },
  {
    path: '/order-entry/:tableId',
    permissions: [PERMISSIONS.CREATE_ORDER],
  },
  {
    path: '/billing',
    permissions: [PERMISSIONS.VIEW_BILLING],
  },
  {
    path: '/billing/:orderId',
    permissions: [PERMISSIONS.VIEW_BILLING],
  },
  {
    path: '/online-orders',
    permissions: [PERMISSIONS.VIEW_ONLINE_ORDERS],
  },
  {
    path: '/admin/menu',
    permissions: [PERMISSIONS.MANAGE_MENU],
  },
  {
    path: '/admin/inventory',
    permissions: [PERMISSIONS.MANAGE_INVENTORY],
  },
  {
    path: '/admin/reports',
    permissions: [PERMISSIONS.VIEW_REPORTS],
  },
  {
    path: '/admin/settings',
    permissions: [PERMISSIONS.MANAGE_SETTINGS],
  },
  {
    path: '/admin/aggregators',
    permissions: [PERMISSIONS.MANAGE_AGGREGATORS],
  },
  {
    path: '/admin/menu-sync/:platform',
    permissions: [PERMISSIONS.MANAGE_AGGREGATORS],
  },
];

export const getRouteConfig = (path) => {
  return routeConfig.find((route) => {
    // Handle parameterized routes
    const routePattern = route.path.replace(/:\w+/g, '[^/]+');
    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(path);
  });
};
