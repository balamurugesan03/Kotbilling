import { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Tabs,
  Table,
  Badge,
  Skeleton,
  Alert,
  Progress,
  Box,
  ScrollArea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCurrencyRupee,
  IconReceipt,
  IconTrendingUp,
  IconCash,
  IconCreditCard,
  IconDeviceMobile,
  IconWorld,
  IconToolsKitchen2,
  IconTruck,
  IconShoppingBag,
  IconCalendar,
  IconCalendarWeek,
  IconCalendarMonth,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import StatCard from '../common/StatCard';
import { formatCurrency } from '../../utils/formatters';
import {
  useDailySalesReport,
  useWeeklySalesReport,
  useMonthlySalesReport,
} from '../../hooks/useDashboardStats';

const PAYMENT_ICONS = {
  cash: IconCash,
  card: IconCreditCard,
  upi: IconDeviceMobile,
  online: IconWorld,
};

const ORDER_TYPE_ICONS = {
  'dine-in': IconToolsKitchen2,
  dineIn: IconToolsKitchen2,
  online: IconTruck,
  takeaway: IconShoppingBag,
};

const ORDER_TYPE_COLORS = {
  'dine-in': 'blue',
  dineIn: 'blue',
  online: 'orange',
  takeaway: 'green',
};

const PAYMENT_COLORS = {
  cash: 'green',
  card: 'blue',
  upi: 'violet',
  online: 'orange',
};

// Simple bar chart component using divs
const SimpleBarChart = ({ data, valueKey, labelKey, color = 'blue', maxValue }) => {
  const max = maxValue || Math.max(...data.map((d) => d[valueKey] || 0), 1);

  return (
    <Stack gap="xs">
      {data.map((item, index) => (
        <Group key={index} gap="xs" wrap="nowrap">
          <Text size="xs" w={60} ta="right" c="dimmed">
            {item[labelKey]}
          </Text>
          <Box style={{ flex: 1 }}>
            <Progress
              value={(item[valueKey] / max) * 100}
              color={color}
              size="lg"
              radius="sm"
            />
          </Box>
          <Text size="xs" w={80} ta="right" fw={500}>
            {formatCurrency(item[valueKey] || 0)}
          </Text>
        </Group>
      ))}
    </Stack>
  );
};

// Normalize breakdown value: backend may return a plain number or an object with sales/amount
const normalizeBreakdownValue = (value) => {
  if (typeof value === 'number') {
    return { amount: value, orders: 0 };
  }
  return { amount: value?.sales ?? value?.amount ?? 0, orders: value?.orders ?? 0 };
};

// Breakdown card component
const BreakdownCard = ({ title, data, type = 'orderType' }) => {
  const icons = type === 'payment' ? PAYMENT_ICONS : ORDER_TYPE_ICONS;
  const colors = type === 'payment' ? PAYMENT_COLORS : ORDER_TYPE_COLORS;
  const total = Object.values(data || {}).reduce((sum, item) => sum + normalizeBreakdownValue(item).amount, 0);

  return (
    <Paper p="md" withBorder>
      <Title order={5} mb="md">{title}</Title>
      <Stack gap="sm">
        {Object.entries(data || {}).map(([key, rawValue]) => {
          const Icon = icons[key] || IconReceipt;
          const color = colors[key] || 'gray';
          const value = normalizeBreakdownValue(rawValue);
          const percent = total > 0 ? (value.amount / total * 100).toFixed(1) : 0;

          return (
            <Group key={key} justify="space-between" wrap="nowrap">
              <Group gap="xs" wrap="nowrap">
                <Icon size={18} color={`var(--mantine-color-${color}-6)`} />
                <Text size="sm" tt="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</Text>
              </Group>
              <Group gap="xs" wrap="nowrap">
                {value.orders > 0 && (
                  <Badge variant="light" color={color} size="sm">
                    {value.orders} orders
                  </Badge>
                )}
                <Text size="sm" fw={500} ta="right" style={{ minWidth: 70 }}>
                  {formatCurrency(value.amount)}
                </Text>
                <Text size="xs" c="dimmed" ta="right" style={{ minWidth: 35 }}>
                  {percent}%
                </Text>
              </Group>
            </Group>
          );
        })}
      </Stack>
    </Paper>
  );
};

// Daily Report Component
const DailyReport = ({ date }) => {
  const formattedDate = date ? dayjs(date).format('YYYY-MM-DD') : undefined;
  const { data, isLoading, error } = useDailySalesReport(formattedDate);

  if (isLoading) {
    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Skeleton height={250} radius="md" />
          <Skeleton height={250} radius="md" />
        </SimpleGrid>
      </Stack>
    );
  }

  if (error) {
    return <Alert color="red" title="Error">{error.message}</Alert>;
  }

  const summary = data?.summary || {};
  const byOrderType = data?.byType || {};
  const byPaymentMethod = data?.byPaymentMethod || {};
  const hourlyBreakdown = data?.hourlyBreakdown || [];

  return (
    <Stack gap="lg">
      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          title="Total Sales"
          value={summary.totalSales || 0}
          icon={IconCurrencyRupee}
          color="green"
          isCurrency
          subtitle={`${summary.totalOrders || 0} orders`}
        />
        <StatCard
          title="Average Order"
          value={summary.averageOrderValue || 0}
          icon={IconTrendingUp}
          color="blue"
          isCurrency
        />
        <StatCard
          title="Tax Collected"
          value={summary.totalTax || 0}
          icon={IconReceipt}
          color="violet"
          isCurrency
        />
        <StatCard
          title="Discounts Given"
          value={summary.totalDiscount || 0}
          icon={IconReceipt}
          color="orange"
          isCurrency
        />
      </SimpleGrid>

      {/* Breakdown Cards */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <BreakdownCard title="By Order Type" data={byOrderType} type="orderType" />
        <BreakdownCard title="By Payment Method" data={byPaymentMethod} type="payment" />
      </SimpleGrid>

      {/* Hourly Breakdown */}
      {hourlyBreakdown.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Hourly Sales</Title>
          <SimpleBarChart
            data={hourlyBreakdown.filter(h => h.sales > 0)}
            valueKey="sales"
            labelKey="hour"
            color="blue"
          />
        </Paper>
      )}
    </Stack>
  );
};

// Weekly Report Component
const WeeklyReport = ({ date }) => {
  const formattedDate = date ? dayjs(date).format('YYYY-MM-DD') : undefined;
  const { data, isLoading, error } = useWeeklySalesReport(formattedDate);

  if (isLoading) {
    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Skeleton height={250} radius="md" />
          <Skeleton height={250} radius="md" />
        </SimpleGrid>
      </Stack>
    );
  }

  if (error) {
    return <Alert color="red" title="Error">{error.message}</Alert>;
  }

  const summary = data?.summary || {};
  const byOrderType = data?.byType || {};
  const dailyBreakdown = data?.dailyBreakdown || [];

  const weekStart = data?.weekStart ? dayjs(data.weekStart).format('DD MMM') : '';
  const weekEnd = data?.weekEnd ? dayjs(data.weekEnd).format('DD MMM YYYY') : '';

  return (
    <Stack gap="lg">
      {weekStart && (
        <Text c="dimmed" size="sm">
          Week: {weekStart} - {weekEnd}
        </Text>
      )}

      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          title="Total Sales"
          value={summary.totalSales || 0}
          icon={IconCurrencyRupee}
          color="green"
          isCurrency
          subtitle={`${summary.totalOrders || 0} orders`}
        />
        <StatCard
          title="Daily Average"
          value={summary.averageDailySales || 0}
          icon={IconTrendingUp}
          color="blue"
          isCurrency
        />
        <StatCard
          title="Average Order"
          value={summary.averageOrderValue || 0}
          icon={IconReceipt}
          color="violet"
          isCurrency
        />
        <StatCard
          title="Total Discount"
          value={summary.totalDiscount || 0}
          icon={IconReceipt}
          color="orange"
          isCurrency
        />
      </SimpleGrid>

      {/* Order Type Breakdown */}
      <BreakdownCard title="By Order Type" data={byOrderType} type="orderType" />

      {/* Daily Breakdown Table */}
      {dailyBreakdown.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Daily Breakdown</Title>
          <ScrollArea>
            <Table striped highlightOnHover miw={500}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Day</Table.Th>
                  <Table.Th>Date</Table.Th>
                  <Table.Th ta="center">Orders</Table.Th>
                  <Table.Th ta="right">Sales</Table.Th>
                  <Table.Th ta="right">Avg Order</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {dailyBreakdown.map((day, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Text fw={500}>{day.day || dayjs(day.date).format('ddd')}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {dayjs(day.date).format('DD MMM')}
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge variant="light">{day.orders || 0}</Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text fw={500}>{formatCurrency(day.sales || 0)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" c="dimmed">
                        {day.orders > 0 ? formatCurrency((day.sales || 0) / day.orders) : '-'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}

      {/* Daily Sales Bar Chart */}
      {dailyBreakdown.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Daily Sales Chart</Title>
          <SimpleBarChart
            data={dailyBreakdown.map(d => ({
              ...d,
              label: d.day || dayjs(d.date).format('ddd')
            }))}
            valueKey="sales"
            labelKey="label"
            color="teal"
          />
        </Paper>
      )}
    </Stack>
  );
};

// Monthly Report Component
const MonthlyReport = ({ date }) => {
  const formattedDate = date ? dayjs(date).format('YYYY-MM-DD') : undefined;
  const { data, isLoading, error } = useMonthlySalesReport(formattedDate);

  if (isLoading) {
    return (
      <Stack gap="md">
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={120} radius="md" />)}
        </SimpleGrid>
        <SimpleGrid cols={{ base: 1, md: 2 }}>
          <Skeleton height={250} radius="md" />
          <Skeleton height={250} radius="md" />
        </SimpleGrid>
      </Stack>
    );
  }

  if (error) {
    return <Alert color="red" title="Error">{error.message}</Alert>;
  }

  const summary = data?.summary || {};
  const byOrderType = data?.byType || {};
  const byPaymentMethod = data?.byPaymentMethod || {};
  const weeklyBreakdown = data?.weeklyBreakdown || [];

  const monthName = data?.month && data?.year
    ? `${data.month} ${data.year}`
    : data?.month || '';

  return (
    <Stack gap="lg">
      {monthName && (
        <Text c="dimmed" size="sm">
          Month: {monthName}
        </Text>
      )}

      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          title="Total Sales"
          value={summary.totalSales || 0}
          icon={IconCurrencyRupee}
          color="green"
          isCurrency
          subtitle={`${summary.totalOrders || 0} orders`}
        />
        <StatCard
          title="Daily Average"
          value={summary.averageDailySales || 0}
          icon={IconTrendingUp}
          color="blue"
          isCurrency
        />
        <StatCard
          title="Average Order"
          value={summary.averageOrderValue || 0}
          icon={IconReceipt}
          color="violet"
          isCurrency
        />
        <StatCard
          title="Total Tax"
          value={summary.totalTax || 0}
          icon={IconReceipt}
          color="orange"
          isCurrency
        />
      </SimpleGrid>

      {/* Breakdown Cards */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        <BreakdownCard title="By Order Type" data={byOrderType} type="orderType" />
        <BreakdownCard title="By Payment Method" data={byPaymentMethod} type="payment" />
      </SimpleGrid>

      {/* Weekly Breakdown Table */}
      {weeklyBreakdown.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Weekly Breakdown</Title>
          <ScrollArea>
            <Table striped highlightOnHover miw={500}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Week</Table.Th>
                  <Table.Th>Period</Table.Th>
                  <Table.Th ta="center">Orders</Table.Th>
                  <Table.Th ta="right">Sales</Table.Th>
                  <Table.Th ta="right">Avg Order</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {weeklyBreakdown.map((week, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>
                      <Text fw={500}>Week {week.week || index + 1}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" c="dimmed">
                        {week.startDate && week.endDate
                          ? `${dayjs(week.startDate).format('DD MMM')} - ${dayjs(week.endDate).format('DD MMM')}`
                          : '-'
                        }
                      </Text>
                    </Table.Td>
                    <Table.Td ta="center">
                      <Badge variant="light">{week.orders || 0}</Badge>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text fw={500}>{formatCurrency(week.sales || 0)}</Text>
                    </Table.Td>
                    <Table.Td ta="right">
                      <Text size="sm" c="dimmed">
                        {week.orders > 0 ? formatCurrency((week.sales || 0) / week.orders) : '-'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </ScrollArea>
        </Paper>
      )}

      {/* Weekly Sales Bar Chart */}
      {weeklyBreakdown.length > 0 && (
        <Paper p="md" withBorder>
          <Title order={5} mb="md">Weekly Sales Chart</Title>
          <SimpleBarChart
            data={weeklyBreakdown.map((w, i) => ({
              ...w,
              label: `W${w.week || i + 1}`
            }))}
            valueKey="sales"
            labelKey="label"
            color="grape"
          />
        </Paper>
      )}
    </Stack>
  );
};

// Main Sales Report Component
const SalesReport = () => {
  const [activeTab, setActiveTab] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" align="flex-end" wrap="wrap">
        <div>
          <Title order={2}>Sales Reports</Title>
          <Text c="dimmed" size="sm">
            View daily, weekly, and monthly sales analytics
          </Text>
        </div>
        <DatePickerInput
          label="Select Date"
          placeholder="Pick date"
          value={selectedDate}
          onChange={setSelectedDate}
          maxDate={new Date()}
          w={{ base: '100%', sm: 200 }}
        />
      </Group>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="daily" leftSection={<IconCalendar size={16} />}>
            Daily
          </Tabs.Tab>
          <Tabs.Tab value="weekly" leftSection={<IconCalendarWeek size={16} />}>
            Weekly
          </Tabs.Tab>
          <Tabs.Tab value="monthly" leftSection={<IconCalendarMonth size={16} />}>
            Monthly
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="daily" pt="md">
          <DailyReport date={selectedDate} />
        </Tabs.Panel>

        <Tabs.Panel value="weekly" pt="md">
          <WeeklyReport date={selectedDate} />
        </Tabs.Panel>

        <Tabs.Panel value="monthly" pt="md">
          <MonthlyReport date={selectedDate} />
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default SalesReport;
