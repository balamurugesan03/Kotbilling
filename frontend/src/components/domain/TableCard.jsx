import { Card, Text, Group, Stack, Badge, ThemeIcon } from '@mantine/core';
import { IconArmchair2, IconUsers, IconClock } from '@tabler/icons-react';
import { TableStatusBadge } from '../common/StatusBadge';
import { TABLE_STATUS, TABLE_STATUS_COLORS } from '../../utils/constants';

const TableCard = ({ table, onClick }) => {
  const getCardColor = () => {
    switch (table.status) {
      case TABLE_STATUS.AVAILABLE:
        return 'green';
      case TABLE_STATUS.OCCUPIED:
        return 'orange';
      case TABLE_STATUS.RESERVED:
        return 'blue';
      default:
        return 'gray';
    }
  };

  const color = getCardColor();

  return (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        cursor: 'pointer',
        borderColor: `var(--mantine-color-${color}-4)`,
        backgroundColor: `var(--mantine-color-${color}-0)`,
      }}
      onClick={() => onClick?.(table)}
    >
      <Stack gap="xs" align="center">
        <ThemeIcon size={50} radius="xl" color={color} variant="light">
          <IconArmchair2 size={28} />
        </ThemeIcon>

        <Text fw={700} size="xl">
          T{table.number}
        </Text>

        <TableStatusBadge status={table.status} />

        <Group gap={4}>
          <IconUsers size={14} />
          <Text size="sm" c="dimmed">
            {table.capacity} seats
          </Text>
        </Group>

        {table.status === TABLE_STATUS.RESERVED && table.reservationTime && (
          <Group gap={4}>
            <IconClock size={14} />
            <Text size="xs" c="dimmed">
              {table.reservationTime}
            </Text>
          </Group>
        )}

        {table.status === TABLE_STATUS.RESERVED && table.reservationName && (
          <Text size="xs" c="dimmed" ta="center">
            {table.reservationName}
          </Text>
        )}

        <Badge variant="outline" color="gray" size="xs">
          Section {table.section}
        </Badge>
      </Stack>
    </Card>
  );
};

export default TableCard;
