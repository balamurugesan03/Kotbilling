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
  Switch,
  Table,
  ActionIcon,
  Modal,
  Select,
  Badge,
  Tabs,
  Loader,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSearch } from '@tabler/icons-react';
import {
  getAllMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../../api/menu.api';
import { formatCurrency } from '../../utils/formatters';
import { VegBadge } from '../../components/common/StatusBadge';

const menuCategories = [
  { key: 'starters', name: 'Starters' },
  { key: 'main_course', name: 'Main Course' },
  { key: 'breads', name: 'Breads' },
  { key: 'rice', name: 'Rice' },
  { key: 'beverages', name: 'Beverages' },
  { key: 'desserts', name: 'Desserts' },
];

const MenuManagement = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editItem, setEditItem] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const isMobile = useMediaQuery('(max-width: 48em)');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: 0,
    isVeg: true,
    available: true,
  });

  // Fetch menu items
  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        setLoading(true);
        const items = await getAllMenuItems();
        setMenuItems(items);
      } catch (error) {
        console.error('Failed to fetch menu items:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMenuItems();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const categoryKey = typeof item.category === 'object'
      ? (item.category?.key || item.category?._id)
      : item.category;
    const categoryMatch =
      selectedCategory === 'all' || categoryKey === selectedCategory;
    const searchMatch =
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const handleAdd = () => {
    setEditItem(null);
    setFormData({
      name: '',
      category: menuCategories[0]?.key || '',
      price: 0,
      isVeg: true,
      available: true,
    });
    openModal();
  };

  const handleEdit = (item) => {
    setEditItem(item);
    const categoryKey = typeof item.category === 'object'
      ? (item.category?.key || item.category?._id)
      : item.category;
    setFormData({
      name: item.name,
      category: categoryKey,
      price: item.price,
      isVeg: item.isVeg,
      available: item.available,
    });
    openModal();
  };

  const handleSave = async () => {
    try {
      if (editItem) {
        const updated = await updateMenuItem(editItem._id, formData);
        setMenuItems((prev) =>
          prev.map((item) => (item._id === editItem._id ? updated : item))
        );
      } else {
        const created = await createMenuItem(formData);
        setMenuItems((prev) => [...prev, created]);
      }
      closeModal();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await deleteMenuItem(id);
      setMenuItems((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      console.error('Failed to delete:', error);
    }
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
          <Title order={2}>Menu Management</Title>
          <Text c="dimmed" size="sm">
            Manage menu items and categories
          </Text>
        </div>
        <Button leftSection={<IconPlus size={18} />} onClick={handleAdd}>
          Add Item
        </Button>
      </Group>

      {/* Filters */}
      <Paper p="md" withBorder>
        <Group>
          <TextInput
            placeholder="Search menu items..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1 }}
          />
        </Group>
      </Paper>

      {/* Categories Tabs */}
      <Tabs value={selectedCategory} onChange={setSelectedCategory}>
        <ScrollArea type="never">
          <Tabs.List>
            <Tabs.Tab value="all">All Items ({menuItems.length})</Tabs.Tab>
            {menuCategories.map((cat) => (
              <Tabs.Tab key={cat.key} value={cat.key}>
                {cat.name} (
                {menuItems.filter((i) => {
                  const categoryKey = typeof i.category === 'object'
                    ? (i.category?.key || i.category?._id)
                    : i.category;
                  return categoryKey === cat.key;
                }).length})
              </Tabs.Tab>
            ))}
          </Tabs.List>
        </ScrollArea>
      </Tabs>

      {/* Items Table */}
      <Paper withBorder>
        <ScrollArea>
        <Table striped highlightOnHover miw={600}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Category</Table.Th>
              <Table.Th>Price</Table.Th>
              <Table.Th ta="center">Type</Table.Th>
              <Table.Th ta="center">Status</Table.Th>
              <Table.Th ta="center">Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredItems.map((item) => (
              <Table.Tr key={item._id}>
                <Table.Td fw={500}>{item.name}</Table.Td>
                <Table.Td>
                  {menuCategories.find((c) => c.key === (typeof item.category === 'object' ? item.category?.key || item.category?._id : item.category))?.name ||
                    (typeof item.category === 'object' ? item.category?.name : item.category)}
                </Table.Td>
                <Table.Td>{formatCurrency(item.price)}</Table.Td>
                <Table.Td ta="center">
                  <VegBadge isVeg={item.isVeg} />
                </Table.Td>
                <Table.Td ta="center">
                  <Badge color={item.available ? 'green' : 'red'} variant="light">
                    {item.available ? 'Available' : 'Unavailable'}
                  </Badge>
                </Table.Td>
                <Table.Td ta="center">
                  <Group gap="xs" justify="center">
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => handleEdit(item)}
                    >
                      <IconEdit size={16} />
                    </ActionIcon>
                    <ActionIcon
                      variant="light"
                      color="red"
                      onClick={() => handleDelete(item._id)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        </ScrollArea>
      </Paper>

      {/* Add/Edit Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editItem ? 'Edit Menu Item' : 'Add Menu Item'}
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
          />

          <Select
            label="Category"
            placeholder="Select category"
            value={formData.category}
            onChange={(value) =>
              setFormData({ ...formData, category: value })
            }
            data={menuCategories.map((cat) => ({
              label: cat.name,
              value: cat.key,
            }))}
            required
          />

          <NumberInput
            label="Price"
            placeholder="Enter price"
            value={formData.price}
            onChange={(value) =>
              setFormData({ ...formData, price: value || 0 })
            }
            min={0}
            prefix="₹"
            required
          />

          <Group>
            <Switch
              label="Vegetarian"
              checked={formData.isVeg}
              onChange={(e) =>
                setFormData({ ...formData, isVeg: e.currentTarget.checked })
              }
            />
            <Switch
              label="Available"
              checked={formData.available}
              onChange={(e) =>
                setFormData({ ...formData, available: e.currentTarget.checked })
              }
            />
          </Group>

          <Group justify="flex-end" mt="md">
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editItem ? 'Update' : 'Add'} Item
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default MenuManagement;
