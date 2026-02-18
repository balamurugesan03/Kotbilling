import {
  Group,
  Text,
  Avatar,
  Menu,
  UnstyledButton,
  Badge,
  ActionIcon,
  Box,
  Burger,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconChevronDown,
  IconLogout,
  IconUser,
  IconSun,
  IconMoon,
  IconBell,
  IconToolsKitchen2,
} from '@tabler/icons-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { formatStatus } from '../../utils/formatters';

const Header = ({ mobileOpened, toggleMobile }) => {
  const { user, logout, role } = useAuth();
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { restaurantSettings } = useSettings();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'violet';
      case 'waiter':
        return 'green';
      default:
        return 'gray';
    }
  };

  return (
    <Group justify="space-between" h="100%" px="md">
      <Group>
        <Burger opened={mobileOpened} onClick={toggleMobile} hiddenFrom="sm" size="sm" />
        <Group gap="xs" visibleFrom="xs">
          <IconToolsKitchen2 size={24} color="var(--mantine-color-orange-6)" stroke={1.5} />
          <Text fw={800} size="lg" c="orange.6">
            KotBilling
          </Text>
          <Badge size="sm" variant="filled" color="orange" radius="sm">
            POS
          </Badge>
        </Group>
        {restaurantSettings?.name && (
          <Text size="xs" c="dimmed" visibleFrom="md">
            | {restaurantSettings.name}
          </Text>
        )}
      </Group>

      <Group>
        {/* Theme Toggle */}
        <ActionIcon
          variant="subtle"
          onClick={() => toggleColorScheme()}
          size="lg"
        >
          {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>

        {/* Notifications */}
        <ActionIcon variant="subtle" size="lg">
          <IconBell size={20} />
        </ActionIcon>

        {/* User Menu */}
        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <UnstyledButton>
              <Group gap="xs">
                <Avatar color="orange" radius="xl" size="md">
                  {user?.name?.charAt(0) || 'U'}
                </Avatar>
                <Box visibleFrom="sm" style={{ flex: 1 }}>
                  <Text size="sm" fw={500}>
                    {user?.name || 'User'}
                  </Text>
                  <Badge size="xs" color={getRoleBadgeColor(role)} variant="light">
                    {formatStatus(role)}
                  </Badge>
                </Box>
                <IconChevronDown size={16} />
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>Account</Menu.Label>
            <Menu.Item leftSection={<IconUser size={16} />}>Profile</Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<IconLogout size={16} />}
              onClick={handleLogout}
            >
              Logout
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  );
};

export default Header;
