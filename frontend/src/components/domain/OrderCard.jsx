import { Card, Text, Group, Stack, Badge, ActionIcon } from '@mantine/core';
import { IconClock, IconUser, IconEye } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { OrderStatusBadge } from '../common/StatusBadge';
import {
  formatCurrency,
  formatElapsedTime,
  formatOrderNumber,
  formatTableNumber,
  getTimeColor,
} from '../../utils/formatters';
import { ORDER_TIME_THRESHOLDS } from '../../utils/constants';

const OrderCard = ({ order, onClick }) => {
  const navigate = useNavigate();
  const timeColor = getTimeColor(
    order.createdAt,
    ORDER_TIME_THRESHOLDS.WARNING,
    ORDER_TIME_THRESHOLDS.DANGER
  );

  const handleClick = () => {
    if (onClick) {
      onClick(order);
    } else {
      navigate(`/billing/${order._id}`);
    }
  };

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{ cursor: 'pointer', minWidth: 180 }}
      onClick={handleClick}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={700} size="lg">
            {formatOrderNumber(order.orderNumber)}
          </Text>
          <OrderStatusBadge status={order.status} />
        </Group>

        <Group gap="xs">
          <Badge variant="light" color="blue" size="lg">
            {formatTableNumber(order.tableNumber)}
          </Badge>
        </Group>

        <Stack gap={4}>
          {order.items.slice(0, 3).map((item, index) => (
            <Text key={index} size="sm" c="dimmed" lineClamp={1}>
              {item.quantity}x {item.name}
            </Text>
          ))}
          {order.items.length > 3 && (
            <Text size="xs" c="dimmed">
              +{order.items.length - 3} more items
            </Text>
          )}
        </Stack>

        <Group justify="space-between" mt="xs">
          <Text fw={600} size="md">
            {formatCurrency(order.total)}
          </Text>
          <Group gap={4}>
            <IconClock size={14} color={`var(--mantine-color-${timeColor}-6)`} />
            <Text size="xs" c={timeColor} fw={500}>
              {formatElapsedTime(order.createdAt)}
            </Text>
          </Group>
        </Group>

        {order.waiter && (
          <Group gap={4}>
            <IconUser size={14} />
            <Text size="xs" c="dimmed">
              {typeof order.waiter === 'object' ? order.waiter.name : order.waiter}
            </Text>
          </Group>
        )}
      </Stack>
    </Card>
  );
};

export default OrderCard;
