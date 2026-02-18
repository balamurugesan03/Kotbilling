import { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Center,
  Stack,
  Alert,
  Container,
} from '@mantine/core';
import { IconAlertCircle, IconLogin, IconToolsKitchen2 } from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDefaultRoute } from '../utils/permissions';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(username, password);
      const from = location.state?.from?.pathname || getDefaultRoute(user.role);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
      }}
    >
      <Container size="xs" px="md">
        <Paper radius="md" p="xl" withBorder shadow="xl">
          <Stack gap="md">
            <div style={{ textAlign: 'center' }}>
              <Center>
                <IconToolsKitchen2 size={40} color="#ff6b35" stroke={1.5} />
              </Center>
              <Title order={2} mt="xs">KotBilling</Title>
              <Text c="dimmed" size="sm" mt={5}>
                Restaurant Management System
              </Text>
            </div>

            {error && (
              <Alert
                icon={<IconAlertCircle size={16} />}
                title="Error"
                color="red"
                variant="light"
              >
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack gap="md">
                <TextInput
                  label="Username"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  size="md"
                />

                <PasswordInput
                  label="Password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  size="md"
                />

                <Button
                  type="submit"
                  fullWidth
                  size="md"
                  loading={loading}
                  leftSection={<IconLogin size={18} />}
                >
                  Sign In
                </Button>
              </Stack>
            </form>

            <Text size="xs" c="dimmed" ta="center">
              Demo credentials: admin/admin123, waiter/waiter123
            </Text>
          </Stack>
        </Paper>
      </Container>
    </Center>
  );
};

export default Login;
