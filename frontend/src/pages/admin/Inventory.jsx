import { useState, useEffect } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  TextInput,
  NumberInput,
  Table,
  ActionIcon,
  Modal,
  Badge,
  Progress,
  Alert,
  Loader,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconPackage,
  IconAlertTriangle,
  IconSearch,
} from '@tabler/icons-react';
import {
  getAllInventory,
  getLowStockItems,
  createInventoryItem,
  updateInventoryItem,
} from '../../api/inventory.api';
import { formatCurrency } from '../../utils/formatters';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editItem, setEditItem] = useState(null);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [formData, setFormData] = useState({
    name: '',
    currentStock: 0,
    unit: 'kg',
    threshold: 0,
    price: 0,
  });

  // Fetch inventory data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [inventory, lowStock] = await Promise.all([
          getAllInventory(),
          getLowStockItems(),
        ]);
        setInventoryItems(inventory);
        setLowStockItems(lowStock);
      } catch (error) {
        console.error('Failed to fetch inventory:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (item) => {
    setEditItem(item);
    setFormData({
      name: item.name,
      currentStock: item.currentStock,
      unit: item.unit,
      threshold: item.threshold,
      price: item.price,
    });
    openModal();
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({
      name: '',
      currentStock: 0,
      unit: 'kg',
      threshold: 0,
      price: 0,
    });
    openModal();
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        const updated = await updateInventoryItem(editItem._id, formData);
        setInventoryItems((prev) =>
          prev.map((item) => (item._id === editItem._id ? updated : item))
        );
      } else {
        const created = await createInventoryItem(formData);
        setInventoryItems((prev) => [...prev, created]);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const getStockStatus = (item) => {
    const ratio = item.currentStock / item.threshold;
    if (ratio <= 0.5) return { color: 'red', label: 'Critical' };
    if (ratio <= 1) return { color: 'yellow', label: 'Low' };
    return { color: 'green', label: 'Good' };
  };

  if (loading) {
    return (
      <Group justify="center" py="xl">
        <Loader />
      </Group>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>Inventory Management</Title>
          <Text c="dimmed" size="sm">
            Track and manage stock levels
          </Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={handleAdd}>
          Add Item
        </Button>
      </Group>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert
          icon={<IconAlertTriangle size={20} />}
          title={`${lowStockItems.length} items need restocking`}
          color="yellow"
        >
          <Group gap="xs" wrap="wrap">
            {lowStockItems.map((item) => (
              <Badge key={item._id} color="yellow" variant="outline">
                {item.name}: {item.currentStock} {item.unit}
              </Badge>
            ))}
          </Group>
        </Alert>
      )}

      {/* Search */}
      <Paper p="md" withBorder>
        <TextInput
          placeholder="Search inventory..."
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Paper>

      {/* Inventory Table */}
      <Paper withBorder>
        <ScrollArea>
        <Table striped highlightOnHover miw={700}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Item</Table.Th>
              <Table.Th>Current Stock</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Threshold</Table.Th>
              <Table.Th>Unit Price</Table.Th>
              <Table.Th>Value</Table.Th>
              <Table.Th ta="center">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredItems.map((item) => {
              const status = getStockStatus(item);
              const stockPercent = Math.min(
                100,
                (item.currentStock / item.threshold) * 100
              );
              return (
                <Table.Tr key={item._id}>
                  <Table.Td>
                    <Group gap="xs">
                      <IconPackage size={16} />
                      <Text fw={500}>{item.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Stack gap={4}>
                      <Text>
                        {item.currentStock} {item.unit}
                      </Text>
                      <Progress
                        value={stockPercent}
                        color={status.color}
                        size="sm"
                        w={100}
                      />
                    </Stack>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={status.color} variant="light">
                      {status.label}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {item.threshold} {item.unit}
                  </Table.Td>
                  <Table.Td>{formatCurrency(item.price)}</Table.Td>
                  <Table.Td>
                    {formatCurrency(item.currentStock * item.price)}
                  </Table.Td>
                  <Table.Td ta="center">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleEdit(item)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
        </ScrollArea>
      </Paper>

      {/* Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editItem ? 'Update Stock' : 'Add Inventory Item'}
        centered
        fullScreen={isMobile}
      >
        <Stack>
          <TextInput
            label="Item Name"
            placeholder="Enter item name"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            required
            disabled={!!editItem}
          />

          <Group grow>
            <NumberInput
              label="Current Stock"
              value={formData.currentStock}
              onChange={(value) =>
                setFormData({ ...formData, currentStock: value || 0 })
              }
              min={0}
              decimalScale={2}
              required
            />
            <TextInput
              label="Unit"
              value={formData.unit}
              onChange={(e) =>
                setFormData({ ...formData, unit: e.target.value })
              }
              required
            />
          </Group>

          <NumberInput
            label="Minimum Threshold"
            value={formData.threshold}
            onChange={(value) =>
              setFormData({ ...formData, threshold: value || 0 })
            }
            min={0}
            decimalScale={2}
            required
          />

          <NumberInput
            label="Unit Price"
            value={formData.price}
            onChange={(value) =>
              setFormData({ ...formData, price: value || 0 })
            }
            min={0}
            prefix="₹"
            required
          />

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editItem ? 'Update' : 'Add'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default Inventory;
