import { Alert, Text, Group, Stack, Badge, Button } from '@mantine/core';
import { IconAlertTriangle, IconPackage } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';

const LowStockAlert = ({ items = [], compact = false }) => {
  const navigate = useNavigate();

  if (!items || items.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <Alert
        icon={<IconAlertTriangle size={16} />}
        title="Low Stock Alert"
        color="yellow"
        variant="light"
      >
        <Group gap="xs" wrap="wrap">
          {items.slice(0, 3).map((item) => (
            <Badge key={item._id} color="yellow" variant="outline" size="sm">
              {item.name}: {item.currentStock} {item.unit}
            </Badge>
          ))}
          {items.length > 3 && (
            <Badge color="gray" variant="outline" size="sm">
              +{items.length - 3} more
            </Badge>
          )}
        </Group>
      </Alert>
    );
  }

  return (
    <Alert
      icon={<IconAlertTriangle size={20} />}
      title="Low Stock Alert"
      color="yellow"
      variant="light"
    >
      <Stack gap="xs" mt="xs">
        {items.map((item) => (
          <Group key={item._id} justify="space-between">
            <Group gap="xs">
              <IconPackage size={14} />
              <Text size="sm" fw={500}>
                {item.name}
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" c="red" fw={600}>
                {item.currentStock} {item.unit}
              </Text>
              <Text size="xs" c="dimmed">
                (min: {item.threshold} {item.unit})
              </Text>
            </Group>
          </Group>
        ))}
        <Button
          variant="light"
          color="yellow"
          size="xs"
          mt="xs"
          onClick={() => navigate('/admin/inventory')}
        >
          Manage Inventory
        </Button>
      </Stack>
    </Alert>
  );
};

export default LowStockAlert;
