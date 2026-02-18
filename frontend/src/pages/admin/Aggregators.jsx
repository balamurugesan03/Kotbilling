import { useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Tabs,
  SimpleGrid,
  Paper,
  Group,
  Badge,
  Skeleton,
  Alert,
  Select,
  Button,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconSettings,
  IconChartBar,
  IconRefresh,
  IconArrowRight,
} from '@tabler/icons-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  getAllAggregatorConfigs,
  upsertAggregatorConfig,
  testAggregatorConnection,
  getAggregatorAnalytics,
} from '../../api/aggregator.api';
import { notifications } from '@mantine/notifications';
import AggregatorCard from '../../components/domain/AggregatorCard';
import StatCard from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/formatters';
import { PLATFORMS } from '../../utils/constants';

const Aggregators = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('settings');
  const [dateRange, setDateRange] = useState([null, null]);
  const [testingPlatform, setTestingPlatform] = useState(null);

  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['aggregatorConfigs'],
    queryFn: getAllAggregatorConfigs,
  });

  const analyticsParams = {};
  if (dateRange[0]) analyticsParams.from = dateRange[0].toISOString();
  if (dateRange[1]) analyticsParams.to = dateRange[1].toISOString();

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['aggregatorAnalytics', analyticsParams],
    queryFn: () => getAggregatorAnalytics(analyticsParams),
    enabled: activeTab === 'analytics',
  });

  const saveMutation = useMutation({
    mutationFn: ({ platform, data }) => upsertAggregatorConfig(platform, data),
    onSuccess: (_, { platform }) => {
      queryClient.invalidateQueries({ queryKey: ['aggregatorConfigs'] });
      notifications.show({
        title: 'Saved',
        message: `${platform} configuration updated`,
        color: 'green',
      });
    },
    onError: () => {
      notifications.show({
        title: 'Error',
        message: 'Failed to save configuration',
        color: 'red',
      });
    },
  });

  const testMutation = useMutation({
    mutationFn: (platform) => testAggregatorConnection(platform),
    onSuccess: (result, platform) => {
      setTestingPlatform(null);
      queryClient.invalidateQueries({ queryKey: ['aggregatorConfigs'] });
      notifications.show({
        title: result.connected ? 'Connected' : 'Connection Failed',
        message: result.message,
        color: result.connected ? 'green' : 'red',
      });
    },
    onError: () => {
      setTestingPlatform(null);
      notifications.show({
        title: 'Error',
        message: 'Connection test failed',
        color: 'red',
      });
    },
  });

  const handleSave = (platform, data) => {
    saveMutation.mutate({ platform, data });
  };

  const handleTest = (platform) => {
    setTestingPlatform(platform);
    testMutation.mutate(platform);
  };

  const getConfigForPlatform = (platform) => {
    return configs.find((c) => c.platform === platform) || null;
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>Aggregator Integration</Title>
        <Text c="dimmed" size="sm">
          Manage Swiggy & Zomato integration settings, menu sync, and analytics
        </Text>
      </div>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
            Settings
          </Tabs.Tab>
          <Tabs.Tab value="analytics" leftSection={<IconChartBar size={16} />}>
            Analytics
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="settings" pt="md">
          {configsLoading ? (
            <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
              <Skeleton height={500} radius="md" />
              <Skeleton height={500} radius="md" />
            </SimpleGrid>
          ) : (
            <Stack gap="lg">
              <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
                <AggregatorCard
                  platform="swiggy"
                  config={getConfigForPlatform('swiggy')}
                  onSave={handleSave}
                  onTest={handleTest}
                  isSaving={saveMutation.isPending && saveMutation.variables?.platform === 'swiggy'}
                  isTesting={testingPlatform === 'swiggy'}
                />
                <AggregatorCard
                  platform="zomato"
                  config={getConfigForPlatform('zomato')}
                  onSave={handleSave}
                  onTest={handleTest}
                  isSaving={saveMutation.isPending && saveMutation.variables?.platform === 'zomato'}
                  isTesting={testingPlatform === 'zomato'}
                />
              </SimpleGrid>

              <Paper p="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text fw={500}>Menu Sync</Text>
                    <Text size="sm" c="dimmed">
                      Manage platform-specific pricing and availability
                    </Text>
                  </div>
                  <Group>
                    <Button
                      variant="light"
                      color="orange"
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() => navigate('/admin/menu-sync/swiggy')}
                    >
                      Swiggy Menu
                    </Button>
                    <Button
                      variant="light"
                      color="red"
                      rightSection={<IconArrowRight size={16} />}
                      onClick={() => navigate('/admin/menu-sync/zomato')}
                    >
                      Zomato Menu
                    </Button>
                  </Group>
                </Group>
              </Paper>
            </Stack>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="analytics" pt="md">
          <Stack gap="md">
            <Paper p="md" withBorder>
              <Group>
                <DatePickerInput
                  type="range"
                  label="Date Range"
                  placeholder="Select date range"
                  value={dateRange}
                  onChange={setDateRange}
                  clearable
                />
              </Group>
            </Paper>

            {analyticsLoading ? (
              <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                {Array(8).fill(0).map((_, i) => (
                  <Skeleton key={i} height={120} radius="md" />
                ))}
              </SimpleGrid>
            ) : analytics ? (
              <Stack gap="md">
                {/* Swiggy Stats */}
                <Title order={4}>
                  <Badge color="orange" variant="filled" size="lg" mr="sm">Swiggy</Badge>
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                  <StatCard
                    title="Total Orders"
                    value={analytics.swiggy?.totalOrders || 0}
                    color="orange"
                  />
                  <StatCard
                    title="Revenue"
                    value={analytics.swiggy?.totalRevenue || 0}
                    isCurrency
                    color="green"
                  />
                  <StatCard
                    title="Avg Order Value"
                    value={analytics.swiggy?.avgOrderValue || 0}
                    isCurrency
                    color="blue"
                  />
                  <StatCard
                    title="Completed"
                    value={analytics.swiggy?.completedOrders || 0}
                    color="teal"
                  />
                </SimpleGrid>

                {/* Zomato Stats */}
                <Title order={4}>
                  <Badge color="red" variant="filled" size="lg" mr="sm">Zomato</Badge>
                </Title>
                <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="md">
                  <StatCard
                    title="Total Orders"
                    value={analytics.zomato?.totalOrders || 0}
                    color="red"
                  />
                  <StatCard
                    title="Revenue"
                    value={analytics.zomato?.totalRevenue || 0}
                    isCurrency
                    color="green"
                  />
                  <StatCard
                    title="Avg Order Value"
                    value={analytics.zomato?.avgOrderValue || 0}
                    isCurrency
                    color="blue"
                  />
                  <StatCard
                    title="Completed"
                    value={analytics.zomato?.completedOrders || 0}
                    color="teal"
                  />
                </SimpleGrid>
              </Stack>
            ) : (
              <Alert color="gray" title="No Data">
                No analytics data available for the selected period
              </Alert>
            )}
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default Aggregators;
