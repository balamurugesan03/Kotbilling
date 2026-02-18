import { useState, useEffect, useCallback } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Divider,
  Table,
  Badge,
  SimpleGrid,
  Modal,
  SegmentedControl,
  Alert,
  Skeleton,
  Kbd,
  Box,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconReceipt,
  IconPrinter,
  IconCash,
  IconCreditCard,
  IconQrcode,
  IconCheck,
  IconKeyboard,
} from '@tabler/icons-react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, getAllOrders, processPayment } from '../api/orders.api';
import { formatCurrency, formatOrderNumber, formatTableNumber, formatDateTime } from '../utils/formatters';
import { OrderStatusBadge } from '../components/common/StatusBadge';
import { PAYMENT_METHODS } from '../utils/constants';
import NumPad from '../components/common/NumPad';
import { useSettings } from '../context/SettingsContext';

const QUICK_AMOUNTS = [100, 200, 500, 1000, 2000];

const Billing = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { calculateTaxes } = useSettings();
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS.CASH);
  const [paymentModalOpened, { open: openPaymentModal, close: closePaymentModal }] = useDisclosure(false);
  const [amountReceived, setAmountReceived] = useState('');
  const [paymentComplete, setPaymentComplete] = useState(false);
  const isMobile = useMediaQuery('(max-width: 48em)');

  const queryClient = useQueryClient();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => getOrderById(orderId),
    enabled: !!orderId,
  });

  const paymentMutation = useMutation({
    mutationFn: ({ orderId, paymentMethod, discount }) =>
      processPayment(orderId, paymentMethod, discount),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      setPaymentComplete(true);
      setTimeout(() => {
        closePaymentModal();
        navigate('/tables');
      }, 2000);
    },
  });

  // Calculate taxes
  const taxDetails = order ? calculateTaxes(order.total || 0) : {};
  const { subtotal, cgst, sgst, serviceCharge, grandTotal, cgstPercent, sgstPercent, serviceChargePercent } = taxDetails;
  const changeAmount = amountReceived ? parseFloat(amountReceived) - (grandTotal || 0) : 0;

  const canComplete =
    paymentMethod !== PAYMENT_METHODS.CASH ||
    (amountReceived && parseFloat(amountReceived) >= (grandTotal || 0));

  const handlePayment = useCallback(() => {
    if (!canComplete || paymentMutation.isPending) return;
    paymentMutation.mutate({
      orderId,
      paymentMethod,
      discount: 0,
    });
  }, [canComplete, paymentMutation, orderId, paymentMethod]);

  const handleSetExactAmount = useCallback(() => {
    if (grandTotal) {
      const exact = String(Math.ceil(grandTotal));
      setAmountReceived(exact);
    }
  }, [grandTotal]);

  const handleQuickAmount = useCallback((amount) => {
    setAmountReceived(String(amount));
  }, []);

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't capture if user is typing in a regular input
      const tag = e.target.tagName;
      const isNumPadInput = e.target.closest('[data-numpad]');

      // F1 = Cash
      if (e.key === 'F1') {
        e.preventDefault();
        setPaymentMethod(PAYMENT_METHODS.CASH);
        return;
      }

      // F2 = Card
      if (e.key === 'F2') {
        e.preventDefault();
        setPaymentMethod(PAYMENT_METHODS.CARD);
        return;
      }

      // F3 = UPI
      if (e.key === 'F3') {
        e.preventDefault();
        setPaymentMethod(PAYMENT_METHODS.UPI);
        return;
      }

      // F9 = Open payment modal (when not already open)
      if (e.key === 'F9' && !paymentModalOpened) {
        e.preventDefault();
        if (order) openPaymentModal();
        return;
      }

      // Enter = Complete payment (when modal is open and not in numpad)
      if (e.key === 'Enter' && paymentModalOpened && !paymentComplete && !isNumPadInput) {
        e.preventDefault();
        handlePayment();
        return;
      }

      // Escape = Close modal or go back
      if (e.key === 'Escape') {
        if (paymentModalOpened) {
          e.preventDefault();
          closePaymentModal();
        }
        return;
      }

      // F5 = Exact amount (cash mode)
      if (e.key === 'F5' && paymentMethod === PAYMENT_METHODS.CASH) {
        e.preventDefault();
        handleSetExactAmount();
        return;
      }

      // F8 = Print KOT
      if (e.key === 'F8') {
        e.preventDefault();
        // Print KOT action
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    paymentModalOpened,
    paymentComplete,
    paymentMethod,
    order,
    openPaymentModal,
    closePaymentModal,
    handlePayment,
    handleSetExactAmount,
  ]);

  // Fetch all active orders when no specific order is selected
  const { data: allOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'pending-bills'],
    queryFn: () => getAllOrders({ status: 'pending_payment' }),
    enabled: !orderId,
    refetchInterval: 5000,
  });

  // Also fetch preparing/ready orders to show in the bill queue
  const { data: activeOrders = [] } = useQuery({
    queryKey: ['orders', 'active'],
    queryFn: () => getAllOrders(),
    enabled: !orderId,
    refetchInterval: 5000,
  });

  const pendingBills = !orderId
    ? activeOrders.filter((o) =>
        ['pending', 'preparing', 'ready', 'served', 'pending_payment'].includes(o.status)
      )
    : [];

  if (!orderId) {
    return (
      <Stack gap="lg">
        <Title order={2}>Billing</Title>
        <Text c="dimmed" size="sm">
          Bills sent by waiters will appear here. Click to view and process payment.
        </Text>

        {ordersLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} height={180} radius="md" />
            ))}
          </SimpleGrid>
        ) : pendingBills.length === 0 ? (
          <Paper p="xl" withBorder ta="center">
            <IconReceipt size={48} color="gray" />
            <Text c="dimmed" mt="md">
              No pending bills right now
            </Text>
            <Button mt="md" onClick={() => navigate('/tables')}>
              Go to Tables
            </Button>
          </Paper>
        ) : (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {pendingBills.map((o) => (
              <Paper
                key={o._id}
                p="md"
                withBorder
                style={{ cursor: 'pointer' }}
                onClick={() => navigate(`/billing/${o._id}`)}
              >
                <Group justify="space-between" mb="sm">
                  <Text fw={700}>{formatOrderNumber(o.orderNumber)}</Text>
                  <Badge color={o.status === 'pending_payment' ? 'orange' : 'blue'} size="sm">
                    {o.status === 'pending_payment' ? 'Bill Ready' : o.status}
                  </Badge>
                </Group>
                {o.tableNumber && (
                  <Badge color="orange" variant="light" size="lg" mb="sm">
                    {formatTableNumber(o.tableNumber)}
                  </Badge>
                )}
                <Stack gap={4}>
                  {o.items?.slice(0, 3).map((item, idx) => (
                    <Text key={idx} size="sm" c="dimmed">
                      {item.quantity}x {item.name}
                    </Text>
                  ))}
                  {o.items?.length > 3 && (
                    <Text size="xs" c="dimmed">+{o.items.length - 3} more items</Text>
                  )}
                </Stack>
                <Divider my="sm" />
                <Group justify="space-between">
                  <Text size="sm" c="dimmed">Total</Text>
                  <Text fw={700} c="orange" size="lg">{formatCurrency(o.total || 0)}</Text>
                </Group>
              </Paper>
            ))}
          </SimpleGrid>
        )}
      </Stack>
    );
  }

  if (isLoading) {
    return (
      <Stack gap="lg">
        <Skeleton height={40} width={300} />
        <Skeleton height={400} />
      </Stack>
    );
  }

  if (error || !order) {
    return (
      <Alert color="red" title="Error">
        Order not found or could not be loaded
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>Bill {formatOrderNumber(order.orderNumber)}</Title>
          <Group gap="md" mt="xs">
            {order.tableNumber && (
              <Badge color="orange" size="lg">
                {formatTableNumber(order.tableNumber)}
              </Badge>
            )}
            <OrderStatusBadge status={order.status} size="lg" />
          </Group>
        </div>
        <Group>
          <Button variant="light" leftSection={<IconPrinter size={18} />}>
            Print KOT {!isMobile && <Text span size="xs" c="dimmed" ml={4}>[F8]</Text>}
          </Button>
        </Group>
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Order Items */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">
            Order Items
          </Title>
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th ta="center">Qty</Table.Th>
                <Table.Th ta="right">Price</Table.Th>
                <Table.Th ta="right">Total</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {order.items.map((item, index) => (
                <Table.Tr key={item._id ?? `item-${index}`}>
                  <Table.Td>{item.name}</Table.Td>
                  <Table.Td ta="center">{item.quantity}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(item.price || 0)}</Table.Td>
                  <Table.Td ta="right">
                    {formatCurrency((item.price || 0) * item.quantity)}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>

          <Text size="xs" c="dimmed" mt="md">
            Order placed: {formatDateTime(order.createdAt)}
          </Text>
          {order.waiter && (
            <Text size="xs" c="dimmed">
              Server: {typeof order.waiter === 'object' ? order.waiter.name : order.waiter}
            </Text>
          )}
        </Paper>

        {/* Bill Summary */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">
            Bill Summary
          </Title>

          <Stack gap="sm">
            <Group justify="space-between">
              <Text>Subtotal</Text>
              <Text fw={500}>{formatCurrency(subtotal)}</Text>
            </Group>
            {cgstPercent > 0 && (
              <Group justify="space-between">
                <Text c="dimmed">CGST ({cgstPercent}%)</Text>
                <Text c="dimmed">{formatCurrency(cgst)}</Text>
              </Group>
            )}
            {sgstPercent > 0 && (
              <Group justify="space-between">
                <Text c="dimmed">SGST ({sgstPercent}%)</Text>
                <Text c="dimmed">{formatCurrency(sgst)}</Text>
              </Group>
            )}
            {serviceChargePercent > 0 && (
              <Group justify="space-between">
                <Text c="dimmed">Service Charge ({serviceChargePercent}%)</Text>
                <Text c="dimmed">{formatCurrency(serviceCharge)}</Text>
              </Group>
            )}

            <Divider my="sm" />

            <Group justify="space-between">
              <Text size="xl" fw={700}>
                Grand Total
              </Text>
              <Text size="xl" fw={700} c="orange">
                {formatCurrency(grandTotal)}
              </Text>
            </Group>
          </Stack>

          <Divider my="lg" />

          {/* Payment Method with keyboard hints */}
          <Title order={5} mb="sm">
            Payment Method
          </Title>
          <SegmentedControl
            fullWidth
            value={paymentMethod}
            onChange={setPaymentMethod}
            data={[
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconCash size={16} />
                    <span>Cash</span>
                    {!isMobile && <Kbd size="xs">F1</Kbd>}
                  </Group>
                ),
                value: PAYMENT_METHODS.CASH,
              },
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconCreditCard size={16} />
                    <span>Card</span>
                    {!isMobile && <Kbd size="xs">F2</Kbd>}
                  </Group>
                ),
                value: PAYMENT_METHODS.CARD,
              },
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconQrcode size={16} />
                    <span>UPI</span>
                    {!isMobile && <Kbd size="xs">F3</Kbd>}
                  </Group>
                ),
                value: PAYMENT_METHODS.UPI,
              },
            ]}
          />

          <Button
            fullWidth
            size="lg"
            mt="lg"
            leftSection={<IconReceipt size={20} />}
            onClick={openPaymentModal}
          >
            Process Payment {!isMobile && <Text span size="xs" c="dimmed" ml={4}>[F9]</Text>}
          </Button>
        </Paper>
      </SimpleGrid>

      {/* Keyboard Shortcuts Bar - hidden on mobile */}
      <Box visibleFrom="sm">
        <Paper p="xs" withBorder bg="orange.0">
          <Group justify="center" gap="lg">
            <Group gap={4}>
              <IconKeyboard size={16} color="gray" />
              <Text size="xs" c="dimmed" fw={500}>Shortcuts:</Text>
            </Group>
            <Group gap={4}><Kbd size="xs">F1</Kbd><Text size="xs" c="dimmed">Cash</Text></Group>
            <Group gap={4}><Kbd size="xs">F2</Kbd><Text size="xs" c="dimmed">Card</Text></Group>
            <Group gap={4}><Kbd size="xs">F3</Kbd><Text size="xs" c="dimmed">UPI</Text></Group>
            <Group gap={4}><Kbd size="xs">F5</Kbd><Text size="xs" c="dimmed">Exact Amt</Text></Group>
            <Group gap={4}><Kbd size="xs">F8</Kbd><Text size="xs" c="dimmed">Print KOT</Text></Group>
            <Group gap={4}><Kbd size="xs">F9</Kbd><Text size="xs" c="dimmed">Pay</Text></Group>
            <Group gap={4}><Kbd size="xs">Enter</Kbd><Text size="xs" c="dimmed">Confirm</Text></Group>
            <Group gap={4}><Kbd size="xs">Esc</Kbd><Text size="xs" c="dimmed">Back</Text></Group>
          </Group>
        </Paper>
      </Box>

      {/* Payment Modal */}
      <Modal
        opened={paymentModalOpened}
        onClose={closePaymentModal}
        title={
          <Group gap="xs">
            <Text fw={600}>Process Payment</Text>
            <Badge variant="light" size="sm">{paymentMethod.toUpperCase()}</Badge>
          </Group>
        }
        centered
        size="md"
        fullScreen={isMobile}
        closeOnEscape={false}
      >
        {paymentComplete ? (
          <Stack align="center" py="xl">
            <IconCheck size={64} color="green" />
            <Title order={3}>Payment Successful!</Title>
            <Text c="dimmed">Redirecting to tables...</Text>
          </Stack>
        ) : (
          <Stack>
            <Paper p="md" bg="orange.0">
              <Group justify="space-between">
                <Text>Amount Due</Text>
                <Text size="xl" fw={700}>
                  {formatCurrency(grandTotal)}
                </Text>
              </Group>
            </Paper>

            {paymentMethod === PAYMENT_METHODS.CASH && (
              <>
                {/* Quick Amount Buttons */}
                <Box>
                  <Text size="sm" fw={500} mb="xs">Quick Amount</Text>
                  <Group gap="xs" wrap="wrap">
                    <Button
                      variant="light"
                      color="teal"
                      size="compact-md"
                      onClick={handleSetExactAmount}
                    >
                      Exact {!isMobile && <Kbd size="xs" ml={4}>F5</Kbd>}
                    </Button>
                    {QUICK_AMOUNTS.map((amt) => (
                      <Button
                        key={amt}
                        variant="light"
                        size="compact-md"
                        onClick={() => handleQuickAmount(amt)}
                      >
                        {formatCurrency(amt)}
                      </Button>
                    ))}
                  </Group>
                </Box>

                <div data-numpad>
                  <NumPad
                    value={amountReceived}
                    onChange={setAmountReceived}
                    placeholder="Enter amount received"
                    autoFocus
                  />
                </div>

                {amountReceived && parseFloat(amountReceived) >= grandTotal && (
                  <Paper p="md" bg="green.0">
                    <Group justify="space-between">
                      <Text>Change to return</Text>
                      <Text size="lg" fw={700} c="green">
                        {formatCurrency(changeAmount)}
                      </Text>
                    </Group>
                  </Paper>
                )}
              </>
            )}

            {paymentMethod === PAYMENT_METHODS.CARD && (
              <Alert color="orange">
                Please swipe/insert card on the payment terminal
              </Alert>
            )}

            {paymentMethod === PAYMENT_METHODS.UPI && (
              <Stack align="center">
                <Paper p="xl" withBorder>
                  <Text ta="center" c="dimmed">
                    [QR Code would appear here]
                  </Text>
                </Paper>
                <Text size="sm" c="dimmed">
                  Scan QR code to pay via UPI
                </Text>
              </Stack>
            )}

            <Button
              fullWidth
              size="lg"
              color="green"
              onClick={handlePayment}
              disabled={!canComplete}
              loading={paymentMutation.isPending}
            >
              Complete Payment <Text span size="xs" ml={4}>[Enter]</Text>
            </Button>

            {/* Modal shortcut hints - hidden on mobile */}
            {!isMobile && (
              <Group justify="center" gap="md">
                <Group gap={4}><Kbd size="xs">0-9</Kbd><Text size="xs" c="dimmed">Type amount</Text></Group>
                <Group gap={4}><Kbd size="xs">F5</Kbd><Text size="xs" c="dimmed">Exact</Text></Group>
                <Group gap={4}><Kbd size="xs">Enter</Kbd><Text size="xs" c="dimmed">Confirm</Text></Group>
                <Group gap={4}><Kbd size="xs">Esc</Kbd><Text size="xs" c="dimmed">Cancel</Text></Group>
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default Billing;
