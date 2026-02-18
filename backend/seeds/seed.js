require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Table = require('../models/Table');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

// Users data
const users = [
  {
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@restaurant.com',
    role: 'admin'
  },
  {
    username: 'cashier',
    password: 'cashier123',
    name: 'Ramesh Kumar',
    email: 'ramesh@restaurant.com',
    role: 'cashier'
  },
  {
    username: 'waiter',
    password: 'waiter123',
    name: 'Suresh Singh',
    email: 'suresh@restaurant.com',
    role: 'waiter'
  },
  {
    username: 'kitchen',
    password: 'kitchen123',
    name: 'Chef Prakash',
    email: 'prakash@restaurant.com',
    role: 'kitchen'
  }
];

// Tables data
const tables = [
  { number: 1, capacity: 4, status: 'available', section: 'A' },
  { number: 2, capacity: 4, status: 'available', section: 'A' },
  { number: 3, capacity: 2, status: 'available', section: 'A' },
  { number: 4, capacity: 6, status: 'available', section: 'A' },
  { number: 5, capacity: 4, status: 'available', section: 'B' },
  { number: 6, capacity: 4, status: 'available', section: 'B' },
  { number: 7, capacity: 8, status: 'available', section: 'B' },
  { number: 8, capacity: 2, status: 'available', section: 'B' },
  { number: 9, capacity: 4, status: 'available', section: 'C' },
  { number: 10, capacity: 6, status: 'available', section: 'C' },
  { number: 11, capacity: 4, status: 'available', section: 'C' },
  { number: 12, capacity: 10, status: 'available', section: 'C' },
  { number: 13, capacity: 4, status: 'available', section: 'D' },
  { number: 14, capacity: 6, status: 'available', section: 'D' },
  { number: 15, capacity: 8, status: 'available', section: 'D' }
];

// Menu items data
const menuItems = [
  // Starters
  { name: 'Paneer Tikka', category: 'starters', price: 280, isVeg: true },
  { name: 'Chicken Tikka', category: 'starters', price: 320, isVeg: false },
  { name: 'Veg Spring Rolls', category: 'starters', price: 180, isVeg: true },
  { name: 'Chicken Spring Rolls', category: 'starters', price: 220, isVeg: false },
  { name: 'Tandoori Prawns', category: 'starters', price: 450, isVeg: false },
  { name: 'Hara Bhara Kebab', category: 'starters', price: 220, isVeg: true },
  { name: 'Seekh Kebab', category: 'starters', price: 280, isVeg: false },
  { name: 'Fish Tikka', category: 'starters', price: 350, isVeg: false },
  { name: 'Mushroom Tikka', category: 'starters', price: 250, isVeg: true },
  { name: 'Malai Tikka', category: 'starters', price: 300, isVeg: false },

  // Main Course
  { name: 'Butter Chicken', category: 'main_course', price: 350, isVeg: false },
  { name: 'Paneer Butter Masala', category: 'main_course', price: 280, isVeg: true },
  { name: 'Dal Makhani', category: 'main_course', price: 220, isVeg: true },
  { name: 'Kadai Chicken', category: 'main_course', price: 320, isVeg: false },
  { name: 'Mutton Rogan Josh', category: 'main_course', price: 420, isVeg: false },
  { name: 'Palak Paneer', category: 'main_course', price: 260, isVeg: true },
  { name: 'Fish Curry', category: 'main_course', price: 380, isVeg: false },
  { name: 'Mixed Veg', category: 'main_course', price: 200, isVeg: true },
  { name: 'Chicken Biryani', category: 'main_course', price: 320, isVeg: false },
  { name: 'Veg Biryani', category: 'main_course', price: 250, isVeg: true },

  // Breads
  { name: 'Butter Naan', category: 'breads', price: 50, isVeg: true },
  { name: 'Garlic Naan', category: 'breads', price: 60, isVeg: true },
  { name: 'Tandoori Roti', category: 'breads', price: 30, isVeg: true },
  { name: 'Laccha Paratha', category: 'breads', price: 50, isVeg: true },
  { name: 'Missi Roti', category: 'breads', price: 40, isVeg: true },

  // Rice
  { name: 'Steamed Rice', category: 'rice', price: 120, isVeg: true },
  { name: 'Jeera Rice', category: 'rice', price: 150, isVeg: true },
  { name: 'Veg Pulao', category: 'rice', price: 180, isVeg: true },
  { name: 'Mutton Biryani', category: 'rice', price: 380, isVeg: false },
  { name: 'Egg Biryani', category: 'rice', price: 280, isVeg: false },

  // Beverages
  { name: 'Sweet Lassi', category: 'beverages', price: 80, isVeg: true },
  { name: 'Salted Lassi', category: 'beverages', price: 70, isVeg: true },
  { name: 'Mango Lassi', category: 'beverages', price: 100, isVeg: true },
  { name: 'Chaas', category: 'beverages', price: 50, isVeg: true },
  { name: 'Soft Drinks', category: 'beverages', price: 60, isVeg: true },
  { name: 'Fresh Lime Soda', category: 'beverages', price: 70, isVeg: true },

  // Desserts
  { name: 'Gulab Jamun', category: 'desserts', price: 80, isVeg: true },
  { name: 'Rasmalai', category: 'desserts', price: 100, isVeg: true },
  { name: 'Kheer', category: 'desserts', price: 90, isVeg: true },
  { name: 'Ice Cream', category: 'desserts', price: 120, isVeg: true },
  { name: 'Gajar Halwa', category: 'desserts', price: 100, isVeg: true }
];

// Inventory data
const inventory = [
  { name: 'Paneer', currentStock: 5, unit: 'kg', threshold: 3, price: 350, category: 'dairy' },
  { name: 'Chicken', currentStock: 8, unit: 'kg', threshold: 5, price: 280, category: 'meat' },
  { name: 'Mutton', currentStock: 4, unit: 'kg', threshold: 3, price: 650, category: 'meat' },
  { name: 'Fish', currentStock: 3, unit: 'kg', threshold: 2, price: 450, category: 'meat' },
  { name: 'Prawns', currentStock: 2, unit: 'kg', threshold: 1, price: 800, category: 'meat' },
  { name: 'Basmati Rice', currentStock: 15, unit: 'kg', threshold: 10, price: 120, category: 'grains' },
  { name: 'Wheat Flour', currentStock: 20, unit: 'kg', threshold: 10, price: 45, category: 'grains' },
  { name: 'Cooking Oil', currentStock: 10, unit: 'L', threshold: 5, price: 150, category: 'other' },
  { name: 'Butter', currentStock: 3, unit: 'kg', threshold: 2, price: 500, category: 'dairy' },
  { name: 'Cream', currentStock: 4, unit: 'L', threshold: 2, price: 280, category: 'dairy' },
  { name: 'Yogurt', currentStock: 5, unit: 'kg', threshold: 3, price: 80, category: 'dairy' },
  { name: 'Milk', currentStock: 10, unit: 'L', threshold: 5, price: 60, category: 'dairy' },
  { name: 'Onions', currentStock: 15, unit: 'kg', threshold: 8, price: 40, category: 'vegetables' },
  { name: 'Tomatoes', currentStock: 10, unit: 'kg', threshold: 5, price: 50, category: 'vegetables' },
  { name: 'Ginger Garlic Paste', currentStock: 3, unit: 'kg', threshold: 2, price: 150, category: 'spices' },
  { name: 'Garam Masala', currentStock: 2, unit: 'kg', threshold: 1, price: 400, category: 'spices' },
  { name: 'Turmeric', currentStock: 1, unit: 'kg', threshold: 0.5, price: 200, category: 'spices' },
  { name: 'Red Chili Powder', currentStock: 1.5, unit: 'kg', threshold: 0.5, price: 250, category: 'spices' },
  { name: 'Coriander Powder', currentStock: 1, unit: 'kg', threshold: 0.5, price: 180, category: 'spices' },
  { name: 'Salt', currentStock: 5, unit: 'kg', threshold: 2, price: 20, category: 'spices' }
];

const seedDatabase = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Table.deleteMany({});
    await MenuItem.deleteMany({});
    await Inventory.deleteMany({});

    // Seed users
    console.log('Seeding users...');
    await User.create(users);
    console.log(`${users.length} users created`);

    // Seed tables
    console.log('Seeding tables...');
    await Table.create(tables);
    console.log(`${tables.length} tables created`);

    // Seed menu items
    console.log('Seeding menu items...');
    await MenuItem.create(menuItems);
    console.log(`${menuItems.length} menu items created`);

    // Seed inventory
    console.log('Seeding inventory...');
    await Inventory.create(inventory);
    console.log(`${inventory.length} inventory items created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin:   admin / admin123');
    console.log('  Cashier: cashier / cashier123');
    console.log('  Waiter:  waiter / waiter123');
    console.log('  Kitchen: kitchen / kitchen123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
