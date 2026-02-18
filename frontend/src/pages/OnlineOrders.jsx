import { useState, useEffect } from 'react';
import {
  SimpleGrid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Badge,
  SegmentedControl,
  Skeleton,
  Alert,
  ScrollArea,
} from '@mantine/core';
import { IconTruck, IconBrandUber, IconWifi, IconWifiOff } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllOnlineOrders, acceptOnlineOrder, updateOnlineOrderStatus } from '../api/orders.api';
import { notifyPlatformStatus } from '../api/aggregator.api';
import { ORDER_STATUS, PLATFORMS } from '../utils/constants';
import OnlineOrderCard from '../components/domain/OnlineOrderCard';
import { useSocket } from '../context/SocketContext';

const OnlineOrders = () => {
  const queryClient = useQueryClient();
  const { subscribe, isConnected } = useSocket();
  const [statusFilter, setStatusFilter] = useState('all');
  const [platformFilter, setPlatformFilter] = useState('all');

  const { data: orders = [], isLoading, error } = useQuery({
    queryKey: ['onlineOrders'],
    queryFn: getAllOnlineOrders,
    // Fallback polling when socket not connected, faster refresh when connected
    refetchInterval: isConnected ? 30000 : 5000,
  });

  // Real-time socket events for instant order updates
  useEffect(() => {
    if (!isConnected) return;

    // Listen for new orders from Swiggy/Zomato
    const unsubNewOrder = subscribe('new-online-order', () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
    });

    // Listen for order status changes
    const unsubStatusUpdate = subscribe('order-status-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
    });

    // Listen for order accepted/rejected by restaurant
    const unsubOrderUpdate = subscribe('online-order-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
    });

    return () => {
      unsubNewOrder();
      unsubStatusUpdate();
      unsubOrderUpdate();
    };
  }, [isConnected, subscribe, queryClient]);

  const acceptMutation = useMutation({
    mutationFn: (order) => acceptOnlineOrder(order._id),
    onSuccess: (_, order) => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      // Fire-and-forget platform notification
      if (order.platform && order.platformOrderId) {
        notifyPlatformStatus(order._id).catch(() => {});
      }
    },
  });

  const readyMutation = useMutation({
    mutationFn: (order) => updateOnlineOrderStatus(order._id, ORDER_STATUS.READY),
    onSuccess: (_, order) => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      if (order.platform && order.platformOrderId) {
        notifyPlatformStatus(order._id).catch(() => {});
      }
    },
  });

  const completeMutation = useMutation({
    mutationFn: (order) => updateOnlineOrderStatus(order._id, ORDER_STATUS.COMPLETED),
    onSuccess: (_, order) => {
      queryClient.invalidateQueries({ queryKey: ['onlineOrders'] });
      if (order.platform && order.platformOrderId) {
        notifyPlatformStatus(order._id).catch(() => {});
      }
    },
  });

  const filteredOrders = orders.filter((order) => {
    const statusMatch =
      statusFilter === 'all' || order.status === statusFilter;
    const platformMatch =
      platformFilter === 'all' || order.platform === platformFilter;
    return statusMatch && platformMatch;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === ORDER_STATUS.PENDING).length,
    preparing: orders.filter((o) => o.status === ORDER_STATUS.PREPARING).length,
    ready: orders.filter((o) => o.status === ORDER_STATUS.READY).length,
    swiggy: orders.filter((o) => o.platform === PLATFORMS.SWIGGY).length,
    zomato: orders.filter((o) => o.platform === PLATFORMS.ZOMATO).length,
  };

  if (error) {
    return (
      <Alert color="red" title="Error">
        Failed to load online orders
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>Online Orders</Title>
          <Group gap="xs">
            <Text c="dimmed" size="sm">
              Swiggy & Zomato orders
            </Text>
            <Badge
              color={isConnected ? 'green' : 'yellow'}
              size="xs"
              variant="dot"
              leftSection={isConnected ? <IconWifi size={10} /> : <IconWifiOff size={10} />}
            >
              {isConnected ? 'Live' : 'Polling'}
            </Badge>
          </Group>
        </div>
        <Group wrap="wrap">
          <Badge color="orange" size="lg" variant="filled">
            Swiggy: {stats.swiggy}
          </Badge>
          <Badge color="red" size="lg" variant="filled">
            Zomato: {stats.zomato}
          </Badge>
        </Group>
      </Group>

      {/* Filters */}
      <Paper p="md" withBorder>
        <Stack gap="sm">
          <div>
            <Text size="sm" fw={500} mb="xs">
              Status
            </Text>
            <ScrollArea type="never">
              <SegmentedControl
                value={statusFilter}
                onChange={setStatusFilter}
                data={[
                  { label: `All (${stats.total})`, value: 'all' },
                  { label: `Pending (${stats.pending})`, value: ORDER_STATUS.PENDING },
                  { label: `Preparing (${stats.preparing})`, value: ORDER_STATUS.PREPARING },
                  { label: `Ready (${stats.ready})`, value: ORDER_STATUS.READY },
                ]}
              />
            </ScrollArea>
          </div>
          <div>
            <Text size="sm" fw={500} mb="xs">
              Platform
            </Text>
            <ScrollArea type="never">
              <SegmentedControl
                value={platformFilter}
                onChange={setPlatformFilter}
                data={[
                  { label: 'All', value: 'all' },
                  { label: 'Swiggy', value: PLATFORMS.SWIGGY },
                  { label: 'Zomato', value: PLATFORMS.ZOMATO },
                ]}
              />
            </ScrollArea>
          </div>
        </Stack>
      </Paper>

      {/* Orders Grid */}
      {isLoading ? (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} height={250} radius="md" />
            ))}
        </SimpleGrid>
      ) : filteredOrders.length === 0 ? (
        <Paper p="xl" withBorder ta="center">
          <IconTruck size={48} color="gray" />
          <Text c="dimmed" mt="md">
            No online orders found
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {filteredOrders.map((order) => (
            <OnlineOrderCard
              key={order._id ?? order.id}
              order={order}
              onAccept={() => acceptMutation.mutate(order)}
              onReady={() => readyMutation.mutate(order)}
              onComplete={() => completeMutation.mutate(order)}
            />
          ))}
        </SimpleGrid>
      )}
    </Stack>
  );
};

export default OnlineOrders;
