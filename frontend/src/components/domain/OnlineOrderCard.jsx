import { Card, Text, Group, Stack, Button, Divider } from '@mantine/core';
import { IconClock, IconMapPin, IconUser } from '@tabler/icons-react';
import { PlatformBadge, OrderStatusBadge } from '../common/StatusBadge';
import {
  formatCurrency,
  formatElapsedTime,
  getTimeColor,
} from '../../utils/formatters';
import { ORDER_STATUS, ORDER_TIME_THRESHOLDS } from '../../utils/constants';

const OnlineOrderCard = ({ order, onAccept, onReady, onComplete }) => {
  const timeColor = getTimeColor(
    order.createdAt,
    ORDER_TIME_THRESHOLDS.WARNING,
    ORDER_TIME_THRESHOLDS.DANGER
  );

  const isPending = order.status === ORDER_STATUS.PENDING;
  const isPreparing = order.status === ORDER_STATUS.PREPARING;
  const isReady = order.status === ORDER_STATUS.READY;

  return (
    <Card shadow="sm" padding="md" radius="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <PlatformBadge platform={order.platform} />
            <Text fw={700}>{order.orderNumber}</Text>
          </Group>
          <OrderStatusBadge status={order.status} />
        </Group>

        <Group gap="xs">
          <IconUser size={14} />
          <Text size="sm">{order.customerName}</Text>
        </Group>

        <Divider />

        <Stack gap={4}>
          {order.items.map((item, index) => (
            <Group key={index} justify="space-between">
              <Text size="sm">
                {item.quantity}x {item.name}
              </Text>
            </Group>
          ))}
        </Stack>

        <Divider />

        <Group justify="space-between">
          <Text fw={600}>{formatCurrency(order.total)}</Text>
          <Group gap={4}>
            <IconClock size={14} color={`var(--mantine-color-${timeColor}-6)`} />
            <Text size="xs" c={timeColor} fw={500}>
              {formatElapsedTime(order.createdAt)}
            </Text>
          </Group>
        </Group>

        {order.deliveryAddress && (
          <Group gap={4} wrap="nowrap">
            <IconMapPin size={14} style={{ flexShrink: 0 }} />
            <Text size="xs" c="dimmed" lineClamp={2}>
              {order.deliveryAddress}
            </Text>
          </Group>
        )}

        <Group grow mt="xs">
          {isPending && (
            <Button color="green" onClick={() => onAccept?.(order)}>
              Accept
            </Button>
          )}
          {isPreparing && (
            <Button color="blue" onClick={() => onReady?.(order)}>
              Mark Ready
            </Button>
          )}
          {isReady && (
            <Button color="violet" onClick={() => onComplete?.(order)}>
              Picked Up
            </Button>
          )}
        </Group>
      </Stack>
    </Card>
  );
};

export default OnlineOrderCard;
