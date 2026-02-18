import { useState } from 'react';
import {
  SimpleGrid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  ScrollArea,
  Grid,
  Button,
  Skeleton,
  Alert,
  Tabs,
} from '@mantine/core';
import {
  IconCurrencyRupee,
  IconArmchair2,
  IconToolsKitchen2,
  IconTruck,
  IconPlus,
  IconReceipt,
  IconDashboard,
  IconChartBar,
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useDashboardData } from '../hooks/useDashboardStats';
import { useAuth } from '../context/AuthContext';
import { hasPermission, PERMISSIONS } from '../utils/permissions';
import StatCard from '../components/common/StatCard';
import OrderCard from '../components/domain/OrderCard';
import OnlineOrderCard from '../components/domain/OnlineOrderCard';
import LowStockAlert from '../components/domain/LowStockAlert';
import SalesReport from '../components/domain/SalesReport';

// Live Dashboard Overview Component
const DashboardOverview = () => {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { data, isLoading, error } = useDashboardData();

  if (error) {
    return (
      <Alert color="red" title="Error loading dashboard">
        {error.message}
      </Alert>
    );
  }

  const stats = data?.stats;
  const runningOrders = data?.runningOrders || [];
  const onlineOrders = data?.onlineOrders || [];
  const lowStockItems = data?.lowStockItems || [];

  const canCreateOrder = hasPermission(role, PERMISSIONS.CREATE_ORDER);
  const canViewBilling = hasPermission(role, PERMISSIONS.VIEW_BILLING);
  const canViewOnlineOrders = hasPermission(role, PERMISSIONS.VIEW_ONLINE_ORDERS);

  return (
    <Stack gap="lg">
      {/* Today's Summary */}
      <Group justify="space-between">
        <Title order={4} c="dimmed">Today's Summary</Title>
        <Text size="sm" c="dimmed">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {isLoading ? (
          <>
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
            <Skeleton height={120} radius="md" />
          </>
        ) : (
          <>
            <StatCard
              title="Total Sales"
              value={stats?.totalSales || 0}
              icon={IconCurrencyRupee}
              color="green"
              isCurrency
              subtitle="Today"
              gradient
            />
            <StatCard
              title="Dine-in Sales"
              value={stats?.dineInSales || 0}
              icon={IconToolsKitchen2}
              color="blue"
              isCurrency
              gradient
            />
            <StatCard
              title="Online Sales"
              value={stats?.onlineSales || 0}
              icon={IconTruck}
              color="orange"
              isCurrency
              subtitle={`Swiggy: ${stats?.swiggyOrders || 0} | Zomato: ${stats?.zomatoOrders || 0}`}
              gradient
            />
            <StatCard
              title="Active Tables"
              value={`${stats?.activeTables || 0}/${stats?.totalTables || 0}`}
              icon={IconArmchair2}
              color="violet"
              showRing
              ringValue={
                stats?.totalTables
                  ? Math.round((stats.activeTables / stats.totalTables) * 100)
                  : 0
              }
              gradient
            />
          </>
        )}
      </SimpleGrid>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && hasPermission(role, PERMISSIONS.MANAGE_INVENTORY) && (
        <LowStockAlert items={lowStockItems} compact />
      )}

      {/* Quick Actions */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md">
          <Title order={4}>Quick Actions</Title>
        </Group>
        <Group wrap="wrap">
          {canCreateOrder && (
            <Button
              leftSection={<IconPlus size={18} />}
              onClick={() => navigate('/tables')}
            >
              New Order
            </Button>
          )}
          {canViewBilling && (
            <Button
              variant="filled"
              leftSection={<IconReceipt size={18} />}
              onClick={() => navigate('/billing')}
            >
              Billing
            </Button>
          )}
          {canViewOnlineOrders && (
            <Button
              variant="filled"
              color="red"
              leftSection={<IconTruck size={18} />}
              onClick={() => navigate('/online-orders')}
            >
              Online Orders
            </Button>
          )}
        </Group>
      </Paper>

      {/* Running Orders */}
      <Paper p="md" withBorder>
        <Group justify="space-between" mb="md" wrap="wrap">
          <Title order={4}>Running Orders ({runningOrders.length})</Title>
          <Button variant="subtle" size="xs" onClick={() => navigate('/tables')}>
            View All
          </Button>
        </Group>
        {isLoading ? (
          <Group>
            <Skeleton height={200} width={220} radius="md" />
            <Skeleton height={200} width={220} radius="md" />
            <Skeleton height={200} width={220} radius="md" />
          </Group>
        ) : runningOrders.length === 0 ? (
          <Text c="dimmed">No running orders</Text>
        ) : (
          <ScrollArea>
            <Group gap="md" wrap="nowrap" pb="sm">
              {runningOrders.map((order) => (
                <OrderCard key={order._id ?? order.id} order={order} />
              ))}
            </Group>
          </ScrollArea>
        )}
      </Paper>

      {/* Two Column Section */}
      <Grid>
        {/* Online Orders */}
        {canViewOnlineOrders && (
          <Grid.Col span={12}>
            <Paper p="md" withBorder h="100%">
              <Group justify="space-between" mb="md">
                <Title order={4}>Online Orders ({onlineOrders.length})</Title>
                <Button
                  variant="subtle"
                  size="xs"
                  onClick={() => navigate('/online-orders')}
                >
                  View All
                </Button>
              </Group>
              {isLoading ? (
                <Stack>
                  <Skeleton height={150} radius="md" />
                  <Skeleton height={150} radius="md" />
                </Stack>
              ) : onlineOrders.length === 0 ? (
                <Text c="dimmed">No online orders</Text>
              ) : (
                <ScrollArea h={350}>
                  <Stack gap="md">
                    {onlineOrders.slice(0, 4).map((order) => (
                      <OnlineOrderCard
                        key={order._id ?? order.id}
                        order={order}
                        onAccept={(o) => console.log('Accept', o)}
                        onReady={(o) => console.log('Ready', o)}
                      />
                    ))}
                  </Stack>
                </ScrollArea>
              )}
            </Paper>
          </Grid.Col>
        )}

      </Grid>
    </Stack>
  );
};

// Main Dashboard Component with Tabs
const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <Stack gap="lg">
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="overview" leftSection={<IconDashboard size={16} />}>
            Live Overview
          </Tabs.Tab>
          <Tabs.Tab value="sales" leftSection={<IconChartBar size={16} />}>
            Sales Reports
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="overview" pt="md">
          <DashboardOverview />
        </Tabs.Panel>

        <Tabs.Panel value="sales" pt="md">
          <SalesReport />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Dashboard;
