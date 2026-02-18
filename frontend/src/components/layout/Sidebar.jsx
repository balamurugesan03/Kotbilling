import { NavLink, Stack, Text, Divider } from '@mantine/core';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  IconDashboard,
  IconArmchair2,
  IconToolsKitchen2,
  IconReceipt,
  IconTruck,
  IconCategory,
  IconPackage,
  IconChartBar,
  IconSettings,
  IconBuildingStore,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const navItems = [
  {
    label: 'Dashboard',
    icon: IconDashboard,
    path: '/dashboard',
    permission: PERMISSIONS.VIEW_DASHBOARD,
  },
  {
    label: 'Tables',
    icon: IconArmchair2,
    path: '/tables',
    permission: PERMISSIONS.VIEW_TABLES,
  },
  {
    label: 'Order Entry',
    icon: IconToolsKitchen2,
    path: '/order-entry',
    permission: PERMISSIONS.CREATE_ORDER,
  },
  {
    label: 'Billing',
    icon: IconReceipt,
    path: '/billing',
    permission: PERMISSIONS.VIEW_BILLING,
  },
  {
    label: 'Online Orders',
    icon: IconTruck,
    path: '/online-orders',
    permission: PERMISSIONS.VIEW_ONLINE_ORDERS,
  },
];

const adminItems = [
  {
    label: 'Menu',
    icon: IconCategory,
    path: '/admin/menu',
    permission: PERMISSIONS.MANAGE_MENU,
  },
  {
    label: 'Inventory',
    icon: IconPackage,
    path: '/admin/inventory',
    permission: PERMISSIONS.MANAGE_INVENTORY,
  },
  {
    label: 'Reports',
    icon: IconChartBar,
    path: '/admin/reports',
    permission: PERMISSIONS.VIEW_REPORTS,
  },
  {
    label: 'Aggregators',
    icon: IconBuildingStore,
    path: '/admin/aggregators',
    permission: PERMISSIONS.MANAGE_AGGREGATORS,
  },
  {
    label: 'Settings',
    icon: IconSettings,
    path: '/admin/settings',
    permission: PERMISSIONS.MANAGE_SETTINGS,
  },
];

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role } = useAuth();

  const renderNavItems = (items) => {
    return items
      .filter((item) => hasPermission(role, item.permission))
      .map((item) => {
        const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
        return (
          <NavLink
            key={item.path}
            label={item.label}
            leftSection={<item.icon size={20} stroke={1.5} />}
            active={isActive}
            onClick={() => navigate(item.path)}
            styles={{
              root: {
                borderRadius: 8,
                marginBottom: 4,
                color: isActive ? 'var(--mantine-color-orange-4)' : 'rgba(255, 255, 255, 0.8)',
                borderLeft: isActive ? '3px solid var(--mantine-color-orange-5)' : '3px solid transparent',
                backgroundColor: isActive ? 'rgba(255, 146, 43, 0.15)' : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 146, 43, 0.1)',
                  color: '#fff',
                },
              },
              label: {
                color: 'inherit',
              },
            }}
          />
        );
      });
  };

  const hasAdminItems = adminItems.some((item) =>
    hasPermission(role, item.permission)
  );

  return (
    <Stack gap="xs" p="md">
      {renderNavItems(navItems)}

      {hasAdminItems && (
        <>
          <Divider my="sm" label="Admin" labelPosition="center" color="dark.4" styles={{ label: { color: 'rgba(255,255,255,0.5)' } }} />
          {renderNavItems(adminItems)}
        </>
      )}
    </Stack>
  );
};

export default Sidebar;
