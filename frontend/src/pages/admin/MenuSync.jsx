import { useState, useEffect } from 'react';
import {
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Badge,
  Table,
  NumberInput,
  Switch,
  Button,
  Skeleton,
  Alert,
  ScrollArea,
} from '@mantine/core';
import { IconArrowLeft, IconUpload, IconDeviceFloppy } from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import {
  getMenuWithOverrides,
  saveMenuOverrides,
  syncMenuToPlatform,
} from '../../api/aggregator.api';
import { formatCurrency } from '../../utils/formatters';

const MenuSync = () => {
  const { platform } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [overrides, setOverrides] = useState({});

  const platformLabel = platform === 'swiggy' ? 'Swiggy' : 'Zomato';
  const platformColor = platform === 'swiggy' ? 'orange' : 'red';

  const { data: menuItems = [], isLoading, error } = useQuery({
    queryKey: ['menuOverrides', platform],
    queryFn: () => getMenuWithOverrides(platform),
    enabled: ['swiggy', 'zomato'].includes(platform),
  });

  // Initialize overrides from loaded data
  useEffect(() => {
    if (menuItems.length > 0) {
      const initial = {};
      menuItems.forEach((item) => {
        initial[item._id] = {
          platformPrice: item.platformPrice,
          isAvailable: item.platformAvailable,
        };
      });
      setOverrides(initial);
    }
  }, [menuItems]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const overrideList = Object.entries(overrides).map(([menuItemId, data]) => ({
        menuItemId,
        platformPrice: data.platformPrice,
        isAvailable: data.isAvailable,
      }));
      return saveMenuOverrides(platform, overrideList);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuOverrides', platform] });
      notifications.show({
        title: 'Saved',
        message: 'Menu overrides saved successfully',
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to save overrides',
        color: 'red',
      });
    },
  });

  const syncMutation = useMutation({
    mutationFn: () => syncMenuToPlatform(platform),
    onSuccess: (data) => {
      notifications.show({
        title: 'Sync Initiated',
        message: data.message,
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to sync menu',
        color: 'red',
      });
    },
  });

  const updateOverride = (itemId, field, value) => {
    setOverrides((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: value,
      },
    }));
  };

  if (!['swiggy', 'zomato'].includes(platform)) {
    return (
      <Alert color="red" title="Invalid Platform">
        Platform must be swiggy or zomato
      </Alert>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        Failed to load menu items
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="wrap">
        <Group>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/admin/aggregators')}
          >
            Back
          </Button>
          <div>
            <Group gap="xs">
              <Title order={2}>Menu Sync</Title>
              <Badge color={platformColor} variant="filled" size="lg">
                {platformLabel}
              </Badge>
            </Group>
            <Text c="dimmed" size="sm">
              Set platform-specific prices and availability
            </Text>
          </div>
        </Group>
        <Group>
          <Button
            variant="outline"
            leftSection={<IconUpload size={16} />}
            onClick={() => syncMutation.mutate()}
            loading={syncMutation.isPending}
            color={platformColor}
          >
            Push to {platformLabel}
          </Button>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={() => saveMutation.mutate()}
            loading={saveMutation.isPending}
            color={platformColor}
          >
            Save Overrides
          </Button>
        </Group>
      </Group>

      {isLoading ? (
        <Stack gap="sm">
          {Array(10).fill(0).map((_, i) => (
            <Skeleton key={i} height={50} radius="sm" />
          ))}
        </Stack>
      ) : (
        <Paper withBorder>
          <ScrollArea>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Item Name</Table.Th>
                  <Table.Th>Category</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Base Price</Table.Th>
                  <Table.Th>{platformLabel} Price</Table.Th>
                  <Table.Th>Available on {platformLabel}</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {menuItems.map((item) => (
                  <Table.Tr key={item._id}>
                    <Table.Td>
                      <Text size="sm" fw={500}>{item.name}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="sm">
                        {item.category?.replace('_', ' ')}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={item.isVeg ? 'green' : 'red'}
                        variant="outline"
                        size="xs"
                      >
                        {item.isVeg ? 'Veg' : 'Non-Veg'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{formatCurrency(item.basePrice)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <NumberInput
                        size="xs"
                        w={120}
                        placeholder="Same as base"
                        value={overrides[item._id]?.platformPrice ?? ''}
                        onChange={(val) => updateOverride(item._id, 'platformPrice', val || null)}
                        min={0}
                        prefix="₹"
                        decimalScale={2}
                      />
                    </Table.Td>
                    <Table.Td>
                      <Switch
                        size="sm"
                        checked={overrides[item._id]?.isAvailable ?? true}
                        onChange={(e) =>
                          updateOverride(item._id, 'isAvailable', e.currentTarget.checked)
                        }
                        color={platformColor}
                      />
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}
    </Stack>
  );
};

export default MenuSync;
