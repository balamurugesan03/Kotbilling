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
  Divider,
  Tabs,
  PasswordInput,
  Table,
  Badge,
  ActionIcon,
  Alert,
  Loader,
  ScrollArea,
  SimpleGrid,
  Modal,
  Select,
  Tooltip,
} from '@mantine/core';
import {
  IconBuilding,
  IconReceipt,
  IconUsers,
  IconBell,
  IconDeviceFloppy,
  IconEdit,
  IconTrash,
  IconPlus,
  IconCheck,
  IconKey,
  IconLock,
  IconLockOpen,
  IconX,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  resetUserPassword,
} from '../../api/users.api';
import { formatStatus } from '../../utils/formatters';
import { useSettings } from '../../context/SettingsContext';

const ROLE_OPTIONS = [
  { value: 'admin', label: 'Admin' },
  { value: 'waiter', label: 'Waiter' },
];

const emptyAddForm = { name: '', username: '', email: '', password: '', role: 'waiter' };
const emptyEditForm = { name: '', email: '', role: 'waiter', isActive: true };
const emptyPasswordForm = { password: '', confirmPassword: '' };

const Settings = () => {
  const [activeTab, setActiveTab] = useState('restaurant');
  const [saved, setSaved] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form states
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [formLoading, setFormLoading] = useState(false);

  const {
    billingSettings,
    restaurantSettings,
    updateBillingSettings,
    updateRestaurantSettings,
  } = useSettings();

  const [notificationSettings, setNotificationSettings] = useState({
    soundOnNewOrder: true,
    soundOnOnlineOrder: true,
    lowStockAlert: true,
    lowStockThreshold: 10,
  });

  const fetchUsers = () => {
    setUsersLoading(true);
    getAllUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error('Failed to fetch users:', err))
      .finally(() => setUsersLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const handleSave = () => {
    console.log('Settings saved!', { restaurantSettings, billingSettings, notificationSettings });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  // Add User
  const handleAddUser = async () => {
    if (!addForm.name || !addForm.username || !addForm.email || !addForm.password) {
      notifications.show({ color: 'red', title: 'Error', message: 'All fields are required' });
      return;
    }
    setFormLoading(true);
    try {
      await createUser(addForm);
      notifications.show({ color: 'green', title: 'Success', message: 'User created successfully' });
      setAddModalOpen(false);
      setAddForm(emptyAddForm);
      fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to create user';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    });
    setEditModalOpen(true);
  };

  // Edit User
  const handleEditUser = async () => {
    if (!editForm.name || !editForm.email) {
      notifications.show({ color: 'red', title: 'Error', message: 'Name and email are required' });
      return;
    }
    setFormLoading(true);
    try {
      await updateUser(selectedUser._id || selectedUser.id, editForm);
      notifications.show({ color: 'green', title: 'Success', message: 'User updated successfully' });
      setEditModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update user';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  // Open Delete Confirm
  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
  };

  // Delete User
  const handleDeleteUser = async () => {
    setFormLoading(true);
    try {
      await deleteUser(selectedUser._id || selectedUser.id);
      notifications.show({ color: 'green', title: 'Success', message: 'User deleted successfully' });
      setDeleteModalOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to delete user';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  // Toggle Status
  const handleToggleStatus = async (user) => {
    try {
      await toggleUserStatus(user._id || user.id);
      notifications.show({
        color: 'blue',
        title: 'Updated',
        message: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
      });
      fetchUsers();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to update status';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    }
  };

  // Open Reset Password Modal
  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setPasswordForm(emptyPasswordForm);
    setPasswordModalOpen(true);
  };

  // Reset Password
  const handleResetPassword = async () => {
    if (!passwordForm.password || passwordForm.password.length < 6) {
      notifications.show({ color: 'red', title: 'Error', message: 'Password must be at least 6 characters' });
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      notifications.show({ color: 'red', title: 'Error', message: 'Passwords do not match' });
      return;
    }
    setFormLoading(true);
    try {
      await resetUserPassword(selectedUser._id || selectedUser.id, passwordForm.password);
      notifications.show({ color: 'green', title: 'Success', message: 'Password reset successfully' });
      setPasswordModalOpen(false);
      setSelectedUser(null);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      notifications.show({ color: 'red', title: 'Error', message: msg });
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>Settings</Title>
          <Text c="dimmed" size="sm">Configure restaurant settings</Text>
        </div>
        <Button leftSection={<IconDeviceFloppy size={18} />} onClick={handleSave}>
          Save Changes
        </Button>
      </Group>

      {saved && (
        <Alert icon={<IconCheck size={16} />} color="green">
          Settings saved successfully!
        </Alert>
      )}

      {/* Settings Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <ScrollArea type="never">
          <Tabs.List>
            <Tabs.Tab value="restaurant" leftSection={<IconBuilding size={16} />}>Restaurant</Tabs.Tab>
            <Tabs.Tab value="billing" leftSection={<IconReceipt size={16} />}>Billing</Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>Notifications</Tabs.Tab>
            <Tabs.Tab value="users" leftSection={<IconUsers size={16} />}>Users</Tabs.Tab>
          </Tabs.List>
        </ScrollArea>

        {/* Restaurant Settings */}
        <Tabs.Panel value="restaurant" pt="md">
          <Paper p="md" withBorder>
            <Stack>
              <Title order={4}>Restaurant Information</Title>
              <TextInput
                label="Restaurant Name"
                value={restaurantSettings.name || ''}
                onChange={(e) => updateRestaurantSettings({ name: e.target.value })}
              />
              <TextInput
                label="Address"
                value={restaurantSettings.address || ''}
                onChange={(e) => updateRestaurantSettings({ address: e.target.value })}
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Phone"
                  value={restaurantSettings.phone || ''}
                  onChange={(e) => updateRestaurantSettings({ phone: e.target.value })}
                />
                <TextInput
                  label="Email"
                  value={restaurantSettings.email || ''}
                  onChange={(e) => updateRestaurantSettings({ email: e.target.value })}
                />
              </SimpleGrid>
              <TextInput
                label="GST Number"
                value={restaurantSettings.gstNumber || ''}
                onChange={(e) => updateRestaurantSettings({ gstNumber: e.target.value })}
              />
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Billing Settings */}
        <Tabs.Panel value="billing" pt="md">
          <Paper p="md" withBorder>
            <Stack>
              <Title order={4}>GST Settings</Title>
              <Switch
                label="Enable GST (CGST + SGST)"
                description="GST will be automatically added to all bills"
                checked={billingSettings.enableGst}
                onChange={(e) => updateBillingSettings({ enableGst: e.currentTarget.checked })}
                size="md"
              />
              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <NumberInput
                  label="CGST (%)"
                  value={billingSettings.cgstPercent}
                  onChange={(value) => updateBillingSettings({ cgstPercent: value || 0 })}
                  min={0} max={100} decimalScale={2}
                  disabled={!billingSettings.enableGst}
                />
                <NumberInput
                  label="SGST (%)"
                  value={billingSettings.sgstPercent}
                  onChange={(value) => updateBillingSettings({ sgstPercent: value || 0 })}
                  min={0} max={100} decimalScale={2}
                  disabled={!billingSettings.enableGst}
                />
              </SimpleGrid>
              <Text size="sm" c="dimmed">
                Total GST: {(billingSettings.cgstPercent || 0) + (billingSettings.sgstPercent || 0)}%
              </Text>
              <Divider my="md" />
              <Title order={4}>Service Charge</Title>
              <Group>
                <Switch
                  label="Enable Service Charge"
                  checked={billingSettings.enableServiceCharge}
                  onChange={(e) => updateBillingSettings({ enableServiceCharge: e.currentTarget.checked })}
                />
              </Group>
              <NumberInput
                label="Service Charge (%)"
                value={billingSettings.serviceChargePercent}
                onChange={(value) => updateBillingSettings({ serviceChargePercent: value || 0 })}
                min={0} max={100} decimalScale={2}
                disabled={!billingSettings.enableServiceCharge}
              />
              <Divider my="md" />
              <Title order={4}>Printing</Title>
              <Switch
                label="Print KOT automatically after order"
                checked={billingSettings.printKotAutomatically}
                onChange={(e) => updateBillingSettings({ printKotAutomatically: e.currentTarget.checked })}
              />
              <Switch
                label="Print bill automatically after payment"
                checked={billingSettings.printBillAutomatically}
                onChange={(e) => updateBillingSettings({ printBillAutomatically: e.currentTarget.checked })}
              />
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Notification Settings */}
        <Tabs.Panel value="notifications" pt="md">
          <Paper p="md" withBorder>
            <Stack>
              <Title order={4}>Sound Alerts</Title>
              <Switch
                label="Play sound on new dine-in order"
                checked={notificationSettings.soundOnNewOrder}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, soundOnNewOrder: e.currentTarget.checked })}
              />
              <Switch
                label="Play sound on new online order"
                checked={notificationSettings.soundOnOnlineOrder}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, soundOnOnlineOrder: e.currentTarget.checked })}
              />
              <Divider my="md" />
              <Title order={4}>Inventory Alerts</Title>
              <Switch
                label="Show low stock alerts"
                checked={notificationSettings.lowStockAlert}
                onChange={(e) => setNotificationSettings({ ...notificationSettings, lowStockAlert: e.currentTarget.checked })}
              />
              <NumberInput
                label="Low stock threshold (%)"
                value={notificationSettings.lowStockThreshold}
                onChange={(value) => setNotificationSettings({ ...notificationSettings, lowStockThreshold: value || 0 })}
                min={0} max={100}
                disabled={!notificationSettings.lowStockAlert}
              />
            </Stack>
          </Paper>
        </Tabs.Panel>

        {/* Users Tab */}
        <Tabs.Panel value="users" pt="md">
          <Paper p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>User Management</Title>
              <Button
                size="xs"
                leftSection={<IconPlus size={14} />}
                onClick={() => { setAddForm(emptyAddForm); setAddModalOpen(true); }}
              >
                Add User
              </Button>
            </Group>

            {usersLoading ? (
              <Group justify="center" py="xl">
                <Loader size="sm" />
              </Group>
            ) : users.length === 0 ? (
              <Text c="dimmed" ta="center" py="xl">No users found</Text>
            ) : (
              <ScrollArea>
                <Table miw={700}>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Name</Table.Th>
                      <Table.Th>Username</Table.Th>
                      <Table.Th>Role</Table.Th>
                      <Table.Th>Email</Table.Th>
                      <Table.Th>Status</Table.Th>
                      <Table.Th ta="center">Actions</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {users.map((user) => (
                      <Table.Tr key={user._id || user.id}>
                        <Table.Td fw={500}>{user.name}</Table.Td>
                        <Table.Td>{user.username}</Table.Td>
                        <Table.Td>
                          <Badge variant="light">{formatStatus(user.role)}</Badge>
                        </Table.Td>
                        <Table.Td>{user.email}</Table.Td>
                        <Table.Td>
                          <Badge color={user.isActive ? 'green' : 'red'} variant="light">
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </Table.Td>
                        <Table.Td ta="center">
                          <Group gap="xs" justify="center">
                            <Tooltip label="Edit User">
                              <ActionIcon variant="light" color="blue" onClick={() => openEditModal(user)}>
                                <IconEdit size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Reset Password">
                              <ActionIcon variant="light" color="orange" onClick={() => openPasswordModal(user)}>
                                <IconKey size={16} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label={user.isActive ? 'Deactivate' : 'Activate'}>
                              <ActionIcon
                                variant="light"
                                color={user.isActive ? 'gray' : 'green'}
                                onClick={() => handleToggleStatus(user)}
                              >
                                {user.isActive ? <IconLock size={16} /> : <IconLockOpen size={16} />}
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Delete User">
                              <ActionIcon variant="light" color="red" onClick={() => openDeleteModal(user)}>
                                <IconTrash size={16} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </ScrollArea>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      {/* Add User Modal */}
      <Modal
        opened={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Add New User"
        centered
      >
        <Stack>
          <TextInput
            label="Full Name"
            placeholder="Enter full name"
            required
            value={addForm.name}
            onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
          />
          <TextInput
            label="Username"
            placeholder="Enter username"
            required
            value={addForm.username}
            onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
          />
          <TextInput
            label="Email"
            placeholder="Enter email"
            type="email"
            required
            value={addForm.email}
            onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
          />
          <PasswordInput
            label="Password"
            placeholder="Min 6 characters"
            required
            value={addForm.password}
            onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
          />
          <Select
            label="Role"
            data={ROLE_OPTIONS}
            value={addForm.role}
            onChange={(value) => setAddForm({ ...addForm, role: value })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button onClick={handleAddUser} loading={formLoading} leftSection={<IconPlus size={16} />}>
              Add User
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title={`Edit User — ${selectedUser?.username || ''}`}
        centered
      >
        <Stack>
          <TextInput
            label="Full Name"
            placeholder="Enter full name"
            required
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <TextInput
            label="Email"
            placeholder="Enter email"
            type="email"
            required
            value={editForm.email}
            onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
          />
          <Select
            label="Role"
            data={ROLE_OPTIONS}
            value={editForm.role}
            onChange={(value) => setEditForm({ ...editForm, role: value })}
          />
          <Switch
            label="Active"
            checked={editForm.isActive}
            onChange={(e) => setEditForm({ ...editForm, isActive: e.currentTarget.checked })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditUser} loading={formLoading} leftSection={<IconCheck size={16} />}>
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Delete User"
        centered
        size="sm"
      >
        <Stack>
          <Text>
            Are you sure you want to delete <strong>{selectedUser?.name}</strong>? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button color="red" onClick={handleDeleteUser} loading={formLoading} leftSection={<IconTrash size={16} />}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        opened={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        title={`Reset Password — ${selectedUser?.username || ''}`}
        centered
        size="sm"
      >
        <Stack>
          <PasswordInput
            label="New Password"
            placeholder="Min 6 characters"
            required
            value={passwordForm.password}
            onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
          />
          <PasswordInput
            label="Confirm Password"
            placeholder="Re-enter password"
            required
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
          />
          <Group justify="flex-end" mt="sm">
            <Button variant="default" onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} loading={formLoading} leftSection={<IconKey size={16} />}>
              Reset Password
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default Settings;
