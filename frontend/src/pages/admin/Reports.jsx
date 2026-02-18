import { useState } from 'react';
import {
  Paper,
  Title,
  Text,
  Group,
  Stack,
  SimpleGrid,
  Select,
  Table,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import {
  IconCurrencyRupee,
  IconReceipt,
  IconUsers,
  IconTrendingUp,
} from '@tabler/icons-react';
import dayjs from 'dayjs';
import StatCard from '../../components/common/StatCard';
import { formatCurrency } from '../../utils/formatters';

const Reports = () => {
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(7, 'day').toDate(),
    dayjs().toDate(),
  ]);
  const [reportType, setReportType] = useState('sales');

  // Mock report data
  const salesSummary = {
    totalRevenue: 245680,
    totalOrders: 342,
    averageOrderValue: 718,
    growthPercent: 12.5,
  };

  const topSellingItems = [
    { name: 'Chicken Biryani', quantity: 145, revenue: 40600 },
    { name: 'Butter Chicken', quantity: 98, revenue: 34300 },
    { name: 'Paneer Butter Masala', quantity: 87, revenue: 24360 },
    { name: 'Dal Makhani', quantity: 76, revenue: 16720 },
    { name: 'Naan', quantity: 234, revenue: 9360 },
  ];

  const salesByCategory = [
    { category: 'Main Course', sales: 98450, percent: 40 },
    { category: 'Rice', sales: 61420, percent: 25 },
    { category: 'Starters', sales: 49136, percent: 20 },
    { category: 'Breads', sales: 24568, percent: 10 },
    { category: 'Beverages', sales: 12284, percent: 5 },
  ];

  const dailySales = [
    { date: '2024-01-01', orders: 45, revenue: 32450 },
    { date: '2024-01-02', orders: 52, revenue: 38720 },
    { date: '2024-01-03', orders: 48, revenue: 35180 },
    { date: '2024-01-04', orders: 61, revenue: 44230 },
    { date: '2024-01-05', orders: 55, revenue: 39800 },
    { date: '2024-01-06', orders: 42, revenue: 30150 },
    { date: '2024-01-07', orders: 39, revenue: 25150 },
  ];

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>Reports & Analytics</Title>
          <Text c="dimmed" size="sm">
            View sales and business insights
          </Text>
        </div>
      </Group>

      {/* Filters */}
      <Paper p="md" withBorder>
        <Group wrap="wrap">
          <DatePickerInput
            type="range"
            label="Date Range"
            placeholder="Select dates"
            value={dateRange}
            onChange={setDateRange}
            w={{ base: '100%', sm: 300 }}
          />
          <Select
            label="Report Type"
            value={reportType}
            onChange={setReportType}
            data={[
              { label: 'Sales Report', value: 'sales' },
              { label: 'Order Report', value: 'orders' },
              { label: 'Item Performance', value: 'items' },
            ]}
            w={{ base: '100%', sm: 'auto' }}
          />
        </Group>
      </Paper>

      {/* Summary Stats */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatCard
          title="Total Revenue"
          value={salesSummary.totalRevenue}
          icon={IconCurrencyRupee}
          color="green"
          isCurrency
          change={salesSummary.growthPercent}
        />
        <StatCard
          title="Total Orders"
          value={salesSummary.totalOrders}
          icon={IconReceipt}
          color="blue"
        />
        <StatCard
          title="Average Order Value"
          value={salesSummary.averageOrderValue}
          icon={IconTrendingUp}
          color="violet"
          isCurrency
        />
        <StatCard
          title="Customers Served"
          value={salesSummary.totalOrders}
          icon={IconUsers}
          color="orange"
        />
      </SimpleGrid>

      {/* Reports Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Top Selling Items */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">
            Top Selling Items
          </Title>
          <ScrollArea>
          <Table miw={400}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Item</Table.Th>
                <Table.Th ta="center">Qty Sold</Table.Th>
                <Table.Th ta="right">Revenue</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {topSellingItems.map((item) => (
                <Table.Tr key={item.name}>
                  <Table.Td>
                    <Group gap="xs">
                      <Badge size="xs" circle>
                        {topSellingItems.indexOf(item) + 1}
                      </Badge>
                      {item.name}
                    </Group>
                  </Table.Td>
                  <Table.Td ta="center">{item.quantity}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(item.revenue)}</Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          </ScrollArea>
        </Paper>

        {/* Sales by Category */}
        <Paper p="md" withBorder>
          <Title order={4} mb="md">
            Sales by Category
          </Title>
          <ScrollArea>
          <Table miw={400}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Category</Table.Th>
                <Table.Th ta="right">Sales</Table.Th>
                <Table.Th ta="right">Share</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {salesByCategory.map((cat) => (
                <Table.Tr key={cat.category}>
                  <Table.Td>{cat.category}</Table.Td>
                  <Table.Td ta="right">{formatCurrency(cat.sales)}</Table.Td>
                  <Table.Td ta="right">
                    <Badge variant="light">{cat.percent}%</Badge>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
          </ScrollArea>
        </Paper>
      </SimpleGrid>

      {/* Daily Sales */}
      <Paper p="md" withBorder>
        <Title order={4} mb="md">
          Daily Sales
        </Title>
        <ScrollArea>
        <Table miw={500}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Date</Table.Th>
              <Table.Th ta="center">Orders</Table.Th>
              <Table.Th ta="right">Revenue</Table.Th>
              <Table.Th ta="right">Avg Order</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {dailySales.map((day) => (
              <Table.Tr key={day.date}>
                <Table.Td>{dayjs(day.date).format('DD MMM YYYY')}</Table.Td>
                <Table.Td ta="center">{day.orders}</Table.Td>
                <Table.Td ta="right">{formatCurrency(day.revenue)}</Table.Td>
                <Table.Td ta="right">
                  {formatCurrency(Math.round(day.revenue / day.orders))}
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
};

export default Reports;
