import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSocket } from '../context/SocketContext';
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
    refetchInterval: 15000,
    ...options,
  });
};

// Fetch daily sales report
export const useDailySalesReport = (date, options = {}) => {
  return useQuery({
    queryKey: ['dailySalesReport', date],
    queryFn: () => getDailySalesReport(date),
    ...options,
  });
};

// Fetch weekly sales report
export const useWeeklySalesReport = (date, options = {}) => {
  return useQuery({
    queryKey: ['weeklySalesReport', date],
    queryFn: () => getWeeklySalesReport(date),
    ...options,
  });
};

// Fetch monthly sales report
export const useMonthlySalesReport = (date, options = {}) => {
  return useQuery({
    queryKey: ['monthlySalesReport', date],
    queryFn: () => getMonthlySalesReport(date),
    ...options,
  });
};
