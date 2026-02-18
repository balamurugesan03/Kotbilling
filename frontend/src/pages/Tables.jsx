import { useState } from 'react';
import {
  SimpleGrid,
  Paper,
  Title,
  Text,
  Group,
  Stack,
  Button,
  Modal,
  TextInput,
  Select,
  SegmentedControl,
  Skeleton,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconArmchair2, IconReceipt } from '@tabler/icons-react';
import { getAllTables, updateTableStatus, reserveTable } from '../api/tables.api';
import { TABLE_STATUS } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../utils/constants';
import TableCard from '../components/domain/TableCard';

const Tables = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { role } = useAuth();
  const [selectedTable, setSelectedTable] = useState(null);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [filter, setFilter] = useState('all');
  const [reservationName, setReservationName] = useState('');
  const [reservationTime, setReservationTime] = useState('');
  const isMobile = useMediaQuery('(max-width: 48em)');

  const { data: tables = [], isLoading } = useQuery({
    queryKey: ['tables'],
    queryFn: getAllTables,
    refetchInterval: 10000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTableStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      if (selectedTable) {
        queryClient.invalidateQueries({ queryKey: ['table', selectedTable._id] });
      }
      closeModal();
    },
    onError: (error) => {
      console.error('Failed to update table status:', error);
      alert(error?.response?.data?.message || 'Failed to update table. Please try again.');
    },
  });

  const reserveMutation = useMutation({
    mutationFn: ({ id, name, time }) => reserveTable(id, name, time),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
      closeModal();
      setReservationName('');
      setReservationTime('');
    },
    onError: (error) => {
      console.error('Failed to reserve table:', error);
      alert(error?.response?.data?.message || 'Failed to reserve table. Please try again.');
    },
  });

  const handleTableClick = (table) => {
    setSelectedTable(table);

    if (table.status === TABLE_STATUS.AVAILABLE) {
      // Navigate to order entry for available tables
      navigate(`/order-entry/${table._id}`);
    } else {
      // Open modal for occupied/reserved tables
      openModal();
    }
  };

  const handleRelease = () => {
    if (selectedTable) {
      updateStatusMutation.mutate({
        id: selectedTable._id,
        status: TABLE_STATUS.AVAILABLE,
      });
    }
  };

  const handleReserve = () => {
    if (selectedTable && reservationName && reservationTime) {
      reserveMutation.mutate({
        id: selectedTable._id,
        name: reservationName,
        time: reservationTime,
      });
    }
  };

  const handleViewBill = () => {
    const orderId = selectedTable?.currentOrderId;
    if (orderId) {
      const id = typeof orderId === 'object' ? orderId._id : orderId;
      navigate(`/billing/${id}`);
      closeModal();
    }
  };

  const filteredTables = tables.filter((table) => {
    if (filter === 'all') return true;
    return table.status === filter;
  });

  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === TABLE_STATUS.AVAILABLE).length,
    occupied: tables.filter((t) => t.status === TABLE_STATUS.OCCUPIED).length,
    reserved: tables.filter((t) => t.status === TABLE_STATUS.RESERVED).length,
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between" wrap="wrap">
        <div>
          <Title order={2}>Tables</Title>
          <Text c="dimmed" size="sm">
            Manage restaurant tables
          </Text>
        </div>
        <Group wrap="wrap">
          <Badge color="green" size="lg" variant="light">
            Available: {stats.available}
          </Badge>
          <Badge color="orange" size="lg" variant="light">
            Occupied: {stats.occupied}
          </Badge>
          <Badge color="blue" size="lg" variant="light">
            Reserved: {stats.reserved}
          </Badge>
        </Group>
      </Group>

      {/* Filter */}
      <Paper p="md" withBorder>
        <ScrollArea type="never">
          <SegmentedControl
            value={filter}
            onChange={setFilter}
            data={[
              { label: `All (${stats.total})`, value: 'all' },
              { label: `Available (${stats.available})`, value: TABLE_STATUS.AVAILABLE },
              { label: `Occupied (${stats.occupied})`, value: TABLE_STATUS.OCCUPIED },
              { label: `Reserved (${stats.reserved})`, value: TABLE_STATUS.RESERVED },
            ]}
          />
        </ScrollArea>
      </Paper>

      {/* Tables Grid */}
      {isLoading ? (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {Array(15)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} height={180} radius="md" />
            ))}
        </SimpleGrid>
      ) : filteredTables.length === 0 ? (
        <Paper p="xl" withBorder ta="center">
          <IconArmchair2 size={48} color="gray" />
          <Text c="dimmed" mt="md">
            No tables found
          </Text>
        </Paper>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
          {filteredTables.map((table, index) => (
            <TableCard key={table._id ?? `table-${index}`} table={table} onClick={handleTableClick} />
          ))}
        </SimpleGrid>
      )}

      {/* Table Action Modal */}
      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={`Table ${selectedTable?.number || ''}`}
        centered
        fullScreen={isMobile}
      >
        {selectedTable && (
          <Stack>
            <Group>
              <Text fw={500}>Status:</Text>
              <Badge
                color={
                  selectedTable.status === TABLE_STATUS.AVAILABLE
                    ? 'green'
                    : selectedTable.status === TABLE_STATUS.OCCUPIED
                    ? 'orange'
                    : 'blue'
                }
              >
                {selectedTable.status}
              </Badge>
            </Group>

            <Group>
              <Text fw={500}>Capacity:</Text>
              <Text>{selectedTable.capacity} seats</Text>
            </Group>

            {selectedTable.status === TABLE_STATUS.OCCUPIED && (
              <>
                {role === ROLES.ADMIN && (
                  <Button onClick={handleViewBill} color="blue" leftSection={<IconReceipt size={18} />}>
                    View Bill & Pay
                  </Button>
                )}
                <Button onClick={() => { closeModal(); navigate(`/order-entry/${selectedTable._id}`); }} variant="light">
                  Add Items
                </Button>
                {(role === ROLES.ADMIN || role === ROLES.WAITER) && (
                  <Button
                    onClick={handleRelease}
                    color="red"
                    variant="outline"
                    loading={updateStatusMutation.isPending}
                  >
                    Release Table
                  </Button>
                )}
              </>
            )}

            {selectedTable.status === TABLE_STATUS.RESERVED && (
              <>
                <Group>
                  <Text fw={500}>Reserved for:</Text>
                  <Text>{selectedTable.reservationName}</Text>
                </Group>
                <Group>
                  <Text fw={500}>Time:</Text>
                  <Text>{selectedTable.reservationTime}</Text>
                </Group>
                <Button
                  onClick={() => { closeModal(); navigate(`/order-entry/${selectedTable._id}`); }}
                  color="green"
                >
                  Seat Guest
                </Button>
                <Button
                  onClick={handleRelease}
                  color="red"
                  variant="outline"
                  loading={updateStatusMutation.isPending}
                >
                  Cancel Reservation
                </Button>
              </>
            )}

            {selectedTable.status === TABLE_STATUS.AVAILABLE && (
              <>
                <Button
                  onClick={() => navigate(`/order-entry/${selectedTable._id}`)}
                  leftSection={<IconPlus size={18} />}
                >
                  Create Order
                </Button>
                <Text fw={500} mt="md">
                  Or make a reservation:
                </Text>
                <TextInput
                  label="Guest Name"
                  placeholder="Enter guest name"
                  value={reservationName}
                  onChange={(e) => setReservationName(e.target.value)}
                />
                <Select
                  label="Time"
                  placeholder="Select time"
                  value={reservationTime}
                  onChange={setReservationTime}
                  data={[
                    '6:00 PM',
                    '6:30 PM',
                    '7:00 PM',
                    '7:30 PM',
                    '8:00 PM',
                    '8:30 PM',
                    '9:00 PM',
                    '9:30 PM',
                  ]}
                />
                <Button
                  onClick={handleReserve}
                  color="blue"
                  variant="outline"
                  disabled={!reservationName || !reservationTime}
                  loading={reserveMutation.isPending}
                >
                  Reserve Table
                </Button>
              </>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default Tables;
