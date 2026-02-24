import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
import dayjs from 'dayjs';
import {
  getDashboardStats,
  getRunningOrders,
  getOnlineOrders,
  getLowStockAlerts,
  getDashboardData,
  getDailySalesReport,
  getWeeklySalesReport,
  getMonthlySalesReport,
} from '../api/dashboard.api';

// Fetch all dashboard stats
export const useDashboardStats = (options = {}) => {
  return useQuery({
    queryKey: ['dashboardStats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    ...options,
  });
};

// Fetch running orders
export const useRunningOrders = (options = {}) => {
  return useQuery({
    queryKey: ['runningOrders'],
    queryFn: getRunningOrders,
    refetchInterval: 15000, // Refetch every 15 seconds
    ...options,
  });
};

// Fetch online orders
export const useOnlineOrders = (options = {}) => {
  return useQuery({
    queryKey: ['onlineOrders'],
    queryFn: getOnlineOrders,
    refetchInterval: 10000, // Refetch every 10 seconds for time-sensitive online orders
    ...options,
  });
};

// Fetch low stock alerts
export const useLowStockAlerts = (options = {}) => {
  return useQuery({
    queryKey: ['lowStockAlerts'],
    queryFn: getLowStockAlerts,
    refetchInterval: 60000, // Refetch every minute
    ...options,
  });
};

// Fetch all dashboard data in one call — with instant socket-driven updates
export const useDashboardData = (options = {}) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    };

    const unsubNewOrder   = subscribe('new-order',      invalidate);
    const unsubOrder      = subscribe('order-updated',  invalidate);
    const unsubTable      = subscribe('table-updated',  invalidate);

    return () => {
      unsubNewOrder();
      unsubOrder();
      unsubTable();
    };
  }, [subscribe, queryClient]);

  return useQuery({
    queryKey: ['dashboardData'],
    queryFn: getDashboardData,
    staleTime: 10000,
    refetchInterval: 15000,
    placeholderData: keepPreviousData,
    ...options,
  });
};

// Fetch daily sales report — instant updates via socket when viewing today
export const useDailySalesReport = (date, options = {}) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  const isToday = !date || date === dayjs().format('YYYY-MM-DD');

  useEffect(() => {
    if (!isToday) return;

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ['dailySalesReport', date] });

    const unsubNew = subscribe('new-order', invalidate);
    const unsubUpd = subscribe('order-updated', invalidate);

    return () => {
      unsubNew();
      unsubUpd();
    };
  }, [subscribe, queryClient, date, isToday]);

  return useQuery({
    queryKey: ['dailySalesReport', date],
    queryFn: () => getDailySalesReport(date),
    staleTime: isToday ? 0 : 5 * 60 * 1000,
    refetchInterval: isToday ? 30000 : false,
    refetchOnWindowFocus: isToday,
    placeholderData: keepPreviousData,
    ...options,
  });
};

// Fetch weekly sales report — instant updates via socket when viewing current week
export const useWeeklySalesReport = (date, options = {}) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  const today = dayjs();
  const isCurrentWeek =
    !date ||
    (dayjs(date).valueOf() >= today.startOf('week').valueOf() &&
      dayjs(date).valueOf() <= today.endOf('week').valueOf());

  useEffect(() => {
    if (!isCurrentWeek) return;

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ['weeklySalesReport', date] });

    const unsubNew = subscribe('new-order', invalidate);
    const unsubUpd = subscribe('order-updated', invalidate);

    return () => {
      unsubNew();
      unsubUpd();
    };
  }, [subscribe, queryClient, date, isCurrentWeek]);

  return useQuery({
    queryKey: ['weeklySalesReport', date],
    queryFn: () => getWeeklySalesReport(date),
    staleTime: isCurrentWeek ? 0 : 30 * 60 * 1000,
    refetchInterval: isCurrentWeek ? 60000 : false,
    refetchOnWindowFocus: isCurrentWeek,
    placeholderData: keepPreviousData,
    ...options,
  });
};

// Fetch monthly sales report — instant updates via socket when viewing current month
export const useMonthlySalesReport = (date, options = {}) => {
  const queryClient = useQueryClient();
  const { subscribe } = useSocket();

  const isCurrentMonth = !date || dayjs(date).isSame(dayjs(), 'month');

  useEffect(() => {
    if (!isCurrentMonth) return;

    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: ['monthlySalesReport', date] });

    const unsubNew = subscribe('new-order', invalidate);
    const unsubUpd = subscribe('order-updated', invalidate);

    return () => {
      unsubNew();
      unsubUpd();
    };
  }, [subscribe, queryClient, date, isCurrentMonth]);

  return useQuery({
    queryKey: ['monthlySalesReport', date],
    queryFn: () => getMonthlySalesReport(date),
    staleTime: isCurrentMonth ? 0 : 30 * 60 * 1000,
    refetchInterval: isCurrentMonth ? 2 * 60 * 1000 : false,
    refetchOnWindowFocus: isCurrentMonth,
    placeholderData: keepPreviousData,
    ...options,
  });
};
