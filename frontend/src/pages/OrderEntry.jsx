import { useState, useMemo, useEffect } from 'react';
import {
  Grid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  TextInput,
  ActionIcon,
  Badge,
  SimpleGrid,
  Card,
  NumberInput,
  Divider,
  ScrollArea,
  SegmentedControl,
  Tabs,
  Loader,
  Box,
} from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconSearch,
  IconPlus,
  IconMinus,
  IconTrash,
  IconShoppingCart,
  IconReceipt,
} from '@tabler/icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import { getTableByIdApi, occupyTable } from '../api/tables.api';
import { createOrder, getOrderById, addItemsToOrder } from '../api/orders.api';
import { getAllMenuItems, getCategories } from '../api/menu.api';
import { formatCurrency, formatTableNumber } from '../utils/formatters';
import { VegBadge } from '../components/common/StatusBadge';
import { ORDER_TYPE, MENU_CATEGORIES } from '../utils/constants';

const OrderEntry = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState(tableId ? ORDER_TYPE.DINE_IN : ORDER_TYPE.TAKEAWAY);
  const isMobile = useMediaQuery('(max-width: 48em)');

  const { data: table } = useQuery({
    queryKey: ['table', tableId],
    queryFn: () => getTableByIdApi(tableId),
    enabled: !!tableId,
  });

  // Resolve existing order ID if table is already occupied
  const existingOrderId = useMemo(() => {
    if (!table?.currentOrderId) return null;
    return typeof table.currentOrderId === 'object'
      ? table.currentOrderId._id
      : table.currentOrderId;
  }, [table]);

  const { data: existingOrder } = useQuery({
    queryKey: ['order', existingOrderId],
    queryFn: () => getOrderById(existingOrderId),
    enabled: !!existingOrderId,
  });

  const { data: menuItems = [], isLoading: menuLoading } = useQuery({
    queryKey: ['menuItems'],
    queryFn: () => getAllMenuItems({ available: true }),
  });

  // Define menu categories
  const menuCategories = [
    { key: 'starters', name: 'Starters' },
    { key: 'main_course', name: 'Main Course' },
    { key: 'breads', name: 'Breads' },
    { key: 'rice', name: 'Rice' },
    { key: 'beverages', name: 'Beverages' },
    { key: 'desserts', name: 'Desserts' },
  ];

  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const order = await createOrder(orderData);
      // Mark table as occupied after creating order
      if (orderData.tableId) {
        await occupyTable(orderData.tableId, order._id);
      }
      return order;
    },
    onSuccess: (order) => {
      // Immediately update tables cache so occupied status shows right away
      if (tableId) {
        queryClient.setQueryData(['tables'], (old) => {
          if (!old) return old;
          return old.map((t) =>
            t._id === tableId ? { ...t, status: 'occupied', currentOrderId: order } : t
          );
        });
        queryClient.setQueryData(['table', tableId], (old) =>
          old ? { ...old, status: 'occupied', currentOrderId: order } : old
        );
      }
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      if (role === ROLES.WAITER) {
        navigate('/tables');
      } else {
        navigate(`/billing/${order._id}`);
      }
    },
  });

  const addItemsMutation = useMutation({
    mutationFn: ({ orderId, items }) => addItemsToOrder(orderId, items),
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      if (tableId) {
        queryClient.invalidateQueries({ queryKey: ['table', tableId] });
      }
      if (role === ROLES.WAITER) {
        navigate('/tables');
      } else {
        navigate(`/billing/${order._id}`);
      }
    },
  });

  const filteredItems = useMemo(() => {
    let items = menuItems.filter((item) => item.available);

    if (searchQuery) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (selectedCategory !== 'all') {
      items = items.filter((item) => {
        const categoryKey = typeof item.category === 'object'
          ? (item.category?.key || item.category?._id)
          : item.category;
        return categoryKey === selectedCategory;
      });
    }

    return items;
  }, [menuItems, searchQuery, selectedCategory]);

  const addToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((item) => item._id !== itemId));
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const handlePlaceOrder = () => {
    if (cart.length === 0) return;

    const newItems = cart.map((item) => ({
      menuItem: item._id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    if (existingOrderId) {
      // Table is occupied — add items to the existing order
      addItemsMutation.mutate({ orderId: existingOrderId, items: newItems });
    } else {
      // New order — create and mark table occupied
      createOrderMutation.mutate({
        tableId: table?._id || null,
        type: orderType,
        items: newItems,
        total: cartTotal,
      });
    }
  };

  return (
    <Grid gutter="md">
      {/* Menu Section */}
      <Grid.Col span={{ base: 12, md: 7, lg: 8 }}>
        <Paper p="md" withBorder h={isMobile ? 'auto' : 'calc(100vh - 120px)'}>
          <Stack h={isMobile ? 'auto' : '100%'}>
            {/* Header */}
            <Group justify="space-between" wrap="wrap">
              <div>
                <Title order={3}>Menu</Title>
                {table && (
                  <Badge color="orange" size="lg" mt="xs">
                    {formatTableNumber(table.number)} - {table.capacity} seats
                  </Badge>
                )}
              </div>
              <SegmentedControl
                value={orderType}
                onChange={setOrderType}
                data={[
                  { label: 'Dine In', value: ORDER_TYPE.DINE_IN },
                  { label: 'Takeaway', value: ORDER_TYPE.TAKEAWAY },
                ]}
              />
            </Group>

            {/* Search */}
            <TextInput
              placeholder="Search menu..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Categories */}
            <ScrollArea type="never">
              <Tabs value={selectedCategory} onChange={setSelectedCategory}>
                <Tabs.List>
                  <Tabs.Tab value="all">All</Tabs.Tab>
                  {menuCategories.map((cat) => (
                    <Tabs.Tab key={cat.key} value={cat.key}>
                      {cat.name}
                    </Tabs.Tab>
                  ))}
                </Tabs.List>
              </Tabs>
            </ScrollArea>

            {/* Menu Items */}
            <ScrollArea flex={1}>
              {menuLoading ? (
                <Group justify="center" py="xl">
                  <Loader />
                </Group>
              ) : (
                <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm">
                  {filteredItems.map((item) => (
                    <Card
                      key={item._id}
                      padding="sm"
                      withBorder
                      style={{
                        cursor: 'pointer',
                        borderLeft: `4px solid ${item.isVeg ? 'var(--mantine-color-green-6)' : 'var(--mantine-color-red-6)'}`,
                      }}
                      onClick={() => addToCart(item)}
                    >
                      <Stack gap="xs">
                        <Group justify="space-between" wrap="nowrap">
                          <Text fw={500} size="sm" lineClamp={2}>
                            {item.name}
                          </Text>
                          <VegBadge isVeg={item.isVeg} />
                        </Group>
                        <Text fw={700} c="orange">
                          {formatCurrency(item.price)}
                        </Text>
                      </Stack>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </ScrollArea>
          </Stack>
        </Paper>
      </Grid.Col>

      {/* Cart Section */}
      <Grid.Col span={{ base: 12, md: 5, lg: 4 }}>
        <Paper p="md" withBorder h={isMobile ? 'auto' : 'calc(100vh - 120px)'}>
          <Stack h={isMobile ? 'auto' : '100%'}>
            <Group>
              <IconShoppingCart size={24} />
              <Title order={3}>Order</Title>
              <Badge>{cart.length} items</Badge>
            </Group>

            <ScrollArea flex={1}>
              <Stack gap="sm">
                {/* Existing order items (already placed) */}
                {existingOrder?.items?.length > 0 && (
                  <>
                    <Text size="xs" fw={600} c="dimmed" tt="uppercase">
                      Existing Order
                    </Text>
                    {existingOrder.items.map((item, idx) => (
                      <Paper key={idx} p="sm" withBorder bg="gray.0">
                        <Group justify="space-between" wrap="nowrap">
                          <div style={{ flex: 1 }}>
                            <Text fw={500} size="sm" lineClamp={1}>
                              {item.name}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {formatCurrency(item.price)} × {item.quantity}
                            </Text>
                          </div>
                          <Text fw={600} size="sm">
                            {formatCurrency(item.price * item.quantity)}
                          </Text>
                        </Group>
                      </Paper>
                    ))}
                    <Divider label="Add New Items" labelPosition="center" />
                  </>
                )}

                {/* New items being added */}
                {cart.length === 0 ? (
                  <Text c="dimmed" ta="center" mt="xl">
                    {existingOrder ? 'Select items to add' : 'No items in cart'}
                  </Text>
                ) : (
                  cart.map((item) => (
                    <Paper key={item._id} p="sm" withBorder>
                      <Group justify="space-between" wrap="nowrap">
                        <div style={{ flex: 1 }}>
                          <Group gap="xs">
                            <Text fw={500} size="sm" lineClamp={1}>
                              {item.name}
                            </Text>
                            <VegBadge isVeg={item.isVeg} />
                          </Group>
                          <Text size="sm" c="dimmed">
                            {formatCurrency(item.price)} each
                          </Text>
                        </div>
                        <Group gap="xs">
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => updateQuantity(item._id, -1)}
                          >
                            <IconMinus size={14} />
                          </ActionIcon>
                          <Text fw={600} w={30} ta="center">
                            {item.quantity}
                          </Text>
                          <ActionIcon
                            size="sm"
                            variant="light"
                            onClick={() => updateQuantity(item._id, 1)}
                          >
                            <IconPlus size={14} />
                          </ActionIcon>
                          <ActionIcon
                            size="sm"
                            color="red"
                            variant="light"
                            onClick={() => removeFromCart(item._id)}
                          >
                            <IconTrash size={14} />
                          </ActionIcon>
                        </Group>
                      </Group>
                      <Group justify="flex-end" mt="xs">
                        <Text fw={600}>
                          {formatCurrency(item.price * item.quantity)}
                        </Text>
                      </Group>
                    </Paper>
                  ))
                )}
              </Stack>
            </ScrollArea>

            <Divider />

            {/* Total */}
            <Paper p="md" bg="orange.0">
              <Group justify="space-between">
                <Text size="lg" fw={500}>
                  Subtotal
                </Text>
                <Text size="xl" fw={700}>
                  {formatCurrency(cartTotal)}
                </Text>
              </Group>
            </Paper>

            <Button
              size="lg"
              fullWidth
              leftSection={<IconReceipt size={20} />}
              disabled={cart.length === 0}
              loading={createOrderMutation.isPending || addItemsMutation.isPending}
              onClick={handlePlaceOrder}
            >
              {existingOrderId ? 'Add to Order' : 'Place Order'}
            </Button>
          </Stack>
        </Paper>
      </Grid.Col>
    </Grid>
  );
};

export default OrderEntry;
