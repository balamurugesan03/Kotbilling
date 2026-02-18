const Order = require('../models/Order');
const Table = require('../models/Table');
const KitchenItem = require('../models/KitchenItem');
const Inventory = require('../models/Inventory');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get today's orders
    const todayOrders = await Order.find({
      createdAt: { $gte: today },
      status: { $ne: 'cancelled' }
    });

    // Calculate totals
    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const dineInSales = todayOrders
      .filter(o => o.type === 'dine_in')
      .reduce((sum, order) => sum + order.total, 0);
    const onlineSales = todayOrders
      .filter(o => o.type === 'online')
      .reduce((sum, order) => sum + order.total, 0);
    const takeawaySales = todayOrders
      .filter(o => o.type === 'takeaway')
      .reduce((sum, order) => sum + order.total, 0);

    // Get table stats
    const tables = await Table.find();
    const tableStats = {
      total: tables.length,
      available: tables.filter(t => t.status === 'available').length,
      occupied: tables.filter(t => t.status === 'occupied').length,
      reserved: tables.filter(t => t.status === 'reserved').length
    };

    // Get order counts
    const pendingOrders = todayOrders.filter(o => o.status === 'pending').length;
    const preparingOrders = todayOrders.filter(o => o.status === 'preparing').length;
    const completedOrders = todayOrders.filter(o => o.status === 'completed').length;

    res.json({
      totalSales,
      dineInSales,
      onlineSales,
      takeawaySales,
      tables: tableStats,
      orders: {
        total: todayOrders.length,
        pending: pendingOrders,
        preparing: preparingOrders,
        completed: completedOrders
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get running orders (dine-in)
// @route   GET /api/dashboard/running-orders
// @access  Private
const getRunningOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      type: 'dine_in',
      status: { $in: ['pending', 'preparing', 'ready', 'served'] }
    })
      .populate('table')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Running orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get online orders
// @route   GET /api/dashboard/online-orders
// @access  Private
const getOnlineOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      type: 'online',
      status: { $in: ['pending', 'preparing', 'ready'] }
    }).sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Online orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get kitchen pending items
// @route   GET /api/dashboard/kitchen-pending
// @access  Private
const getKitchenPending = async (req, res) => {
  try {
    const items = await KitchenItem.find({
      status: { $in: ['queued', 'cooking'] }
    })
      .populate('order')
      .sort({ createdAt: 1, priority: -1 });

    res.json(items);
  } catch (error) {
    console.error('Kitchen pending error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get daily sales report
// @route   GET /api/dashboard/sales/daily
// @access  Private
const getDailySalesReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      status: { $ne: 'cancelled' },
      paymentStatus: 'paid'
    });

    // Calculate totals by type
    const dineInOrders = orders.filter(o => o.type === 'dine_in');
    const onlineOrders = orders.filter(o => o.type === 'online');
    const takeawayOrders = orders.filter(o => o.type === 'takeaway');

    // Calculate totals by payment method
    const cashSales = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const cardSales = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
    const upiSales = orders.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.total, 0);
    const onlinePaymentSales = orders.filter(o => o.paymentMethod === 'online').reduce((sum, o) => sum + o.total, 0);

    // Hourly breakdown
    const hourlyBreakdown = [];
    for (let hour = 0; hour < 24; hour++) {
      const hourOrders = orders.filter(o => {
        const orderHour = new Date(o.createdAt).getHours();
        return orderHour === hour;
      });
      hourlyBreakdown.push({
        hour: `${hour.toString().padStart(2, '0')}:00`,
        orders: hourOrders.length,
        sales: hourOrders.reduce((sum, o) => sum + o.total, 0)
      });
    }

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      summary: {
        totalOrders: orders.length,
        totalSales: orders.reduce((sum, o) => sum + o.total, 0),
        totalTax: orders.reduce((sum, o) => sum + o.tax, 0),
        totalDiscount: orders.reduce((sum, o) => sum + o.discount, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0
      },
      byType: {
        dineIn: {
          orders: dineInOrders.length,
          sales: dineInOrders.reduce((sum, o) => sum + o.total, 0)
        },
        online: {
          orders: onlineOrders.length,
          sales: onlineOrders.reduce((sum, o) => sum + o.total, 0)
        },
        takeaway: {
          orders: takeawayOrders.length,
          sales: takeawayOrders.reduce((sum, o) => sum + o.total, 0)
        }
      },
      byPaymentMethod: {
        cash: cashSales,
        card: cardSales,
        upi: upiSales,
        online: onlinePaymentSales
      },
      hourlyBreakdown
    });
  } catch (error) {
    console.error('Daily sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get weekly sales report
// @route   GET /api/dashboard/sales/weekly
// @access  Private
const getWeeklySalesReport = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();

    // Get start of week (Sunday)
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Get end of week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      status: { $ne: 'cancelled' },
      paymentStatus: 'paid'
    });

    // Daily breakdown for the week
    const dailyBreakdown = [];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    for (let i = 0; i < 7; i++) {
      const dayStart = new Date(startOfWeek);
      dayStart.setDate(startOfWeek.getDate() + i);
      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      dailyBreakdown.push({
        day: dayNames[i],
        date: dayStart.toISOString().split('T')[0],
        orders: dayOrders.length,
        sales: dayOrders.reduce((sum, o) => sum + o.total, 0),
        dineIn: dayOrders.filter(o => o.type === 'dine_in').reduce((sum, o) => sum + o.total, 0),
        online: dayOrders.filter(o => o.type === 'online').reduce((sum, o) => sum + o.total, 0),
        takeaway: dayOrders.filter(o => o.type === 'takeaway').reduce((sum, o) => sum + o.total, 0)
      });
    }

    // Calculate totals by type
    const dineInOrders = orders.filter(o => o.type === 'dine_in');
    const onlineOrders = orders.filter(o => o.type === 'online');
    const takeawayOrders = orders.filter(o => o.type === 'takeaway');

    res.json({
      weekStart: startOfWeek.toISOString().split('T')[0],
      weekEnd: endOfWeek.toISOString().split('T')[0],
      summary: {
        totalOrders: orders.length,
        totalSales: orders.reduce((sum, o) => sum + o.total, 0),
        totalTax: orders.reduce((sum, o) => sum + o.tax, 0),
        totalDiscount: orders.reduce((sum, o) => sum + o.discount, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
        averageDailySales: orders.reduce((sum, o) => sum + o.total, 0) / 7
      },
      byType: {
        dineIn: {
          orders: dineInOrders.length,
          sales: dineInOrders.reduce((sum, o) => sum + o.total, 0)
        },
        online: {
          orders: onlineOrders.length,
          sales: onlineOrders.reduce((sum, o) => sum + o.total, 0)
        },
        takeaway: {
          orders: takeawayOrders.length,
          sales: takeawayOrders.reduce((sum, o) => sum + o.total, 0)
        }
      },
      dailyBreakdown
    });
  } catch (error) {
    console.error('Weekly sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get monthly sales report
// @route   GET /api/dashboard/sales/monthly
// @access  Private
const getMonthlySalesReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
    const daysInMonth = endOfMonth.getDate();

    const orders = await Order.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $ne: 'cancelled' },
      paymentStatus: 'paid'
    });

    // Daily breakdown for the month
    const dailyBreakdown = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(targetYear, targetMonth, day);
      const dayEnd = new Date(targetYear, targetMonth, day, 23, 59, 59, 999);

      const dayOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= dayStart && orderDate <= dayEnd;
      });

      dailyBreakdown.push({
        date: dayStart.toISOString().split('T')[0],
        day: day,
        orders: dayOrders.length,
        sales: dayOrders.reduce((sum, o) => sum + o.total, 0)
      });
    }

    // Weekly breakdown
    const weeklyBreakdown = [];
    let weekStart = new Date(startOfMonth);
    let weekNum = 1;

    while (weekStart <= endOfMonth) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      if (weekEnd > endOfMonth) {
        weekEnd.setTime(endOfMonth.getTime());
      }

      const weekOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= weekStart && orderDate <= weekEnd;
      });

      weeklyBreakdown.push({
        week: weekNum,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0],
        orders: weekOrders.length,
        sales: weekOrders.reduce((sum, o) => sum + o.total, 0)
      });

      weekStart = new Date(weekEnd);
      weekStart.setDate(weekStart.getDate() + 1);
      weekNum++;
    }

    // Calculate totals by type
    const dineInOrders = orders.filter(o => o.type === 'dine_in');
    const onlineOrders = orders.filter(o => o.type === 'online');
    const takeawayOrders = orders.filter(o => o.type === 'takeaway');

    // Calculate by payment method
    const cashSales = orders.filter(o => o.paymentMethod === 'cash').reduce((sum, o) => sum + o.total, 0);
    const cardSales = orders.filter(o => o.paymentMethod === 'card').reduce((sum, o) => sum + o.total, 0);
    const upiSales = orders.filter(o => o.paymentMethod === 'upi').reduce((sum, o) => sum + o.total, 0);
    const onlinePaymentSales = orders.filter(o => o.paymentMethod === 'online').reduce((sum, o) => sum + o.total, 0);

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];

    res.json({
      month: monthNames[targetMonth],
      year: targetYear,
      monthStart: startOfMonth.toISOString().split('T')[0],
      monthEnd: endOfMonth.toISOString().split('T')[0],
      summary: {
        totalOrders: orders.length,
        totalSales: orders.reduce((sum, o) => sum + o.total, 0),
        totalTax: orders.reduce((sum, o) => sum + o.tax, 0),
        totalDiscount: orders.reduce((sum, o) => sum + o.discount, 0),
        averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total, 0) / orders.length : 0,
        averageDailySales: orders.reduce((sum, o) => sum + o.total, 0) / daysInMonth
      },
      byType: {
        dineIn: {
          orders: dineInOrders.length,
          sales: dineInOrders.reduce((sum, o) => sum + o.total, 0)
        },
        online: {
          orders: onlineOrders.length,
          sales: onlineOrders.reduce((sum, o) => sum + o.total, 0)
        },
        takeaway: {
          orders: takeawayOrders.length,
          sales: takeawayOrders.reduce((sum, o) => sum + o.total, 0)
        }
      },
      byPaymentMethod: {
        cash: cashSales,
        card: cardSales,
        upi: upiSales,
        online: onlinePaymentSales
      },
      weeklyBreakdown,
      dailyBreakdown
    });
  } catch (error) {
    console.error('Monthly sales report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get low stock alerts
// @route   GET /api/dashboard/low-stock
// @access  Private
const getLowStockAlerts = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$threshold'] }
    }).sort({ currentStock: 1 });

    res.json(items);
  } catch (error) {
    console.error('Low stock error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all dashboard data in one call
// @route   GET /api/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayOrders, tables, kitchenItems, lowStockItems] = await Promise.all([
      Order.find({ createdAt: { $gte: today }, status: { $ne: 'cancelled' } }),
      Table.find(),
      KitchenItem.find({ status: { $in: ['queued', 'cooking'] } }).populate('order'),
      Inventory.find({ $expr: { $lte: ['$currentStock', '$threshold'] } })
    ]);

    // Calculate stats
    const totalSales = todayOrders.reduce((sum, order) => sum + order.total, 0);
    const dineInSales = todayOrders.filter(o => o.type === 'dine_in').reduce((sum, o) => sum + o.total, 0);
    const onlineSales = todayOrders.filter(o => o.type === 'online').reduce((sum, o) => sum + o.total, 0);

    // Running orders
    const runningOrders = await Order.find({
      type: 'dine_in',
      status: { $in: ['pending', 'preparing', 'ready', 'served'] }
    }).populate('table').sort({ createdAt: -1 });

    // Online orders
    const onlineOrders = await Order.find({
      type: 'online',
      status: { $in: ['pending', 'preparing', 'ready'] }
    }).sort({ createdAt: -1 });

    // Count online orders by platform
    const swiggyOrders = todayOrders.filter(o => o.type === 'online' && o.platform === 'swiggy').length;
    const zomatoOrders = todayOrders.filter(o => o.type === 'online' && o.platform === 'zomato').length;

    res.json({
      stats: {
        totalSales,
        dineInSales,
        onlineSales,
        totalTables: tables.length,
        activeTables: tables.filter(t => t.status === 'occupied').length,
        swiggyOrders,
        zomatoOrders
      },
      runningOrders,
      onlineOrders,
      kitchenPending: kitchenItems,
      lowStockItems
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getDashboardStats,
  getRunningOrders,
  getOnlineOrders,
  getKitchenPending,
  getLowStockAlerts,
  getDashboardData,
  getDailySalesReport,
  getWeeklySalesReport,
  getMonthlySalesReport
};
