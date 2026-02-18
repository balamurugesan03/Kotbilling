import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

// Format currency (Indian Rupees)
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Format date
export const formatDate = (date, format = 'DD MMM YYYY') => {
  return dayjs(date).format(format);
};

// Format time
export const formatTime = (date) => {
  return dayjs(date).format('hh:mm A');
};

// Format datetime
export const formatDateTime = (date) => {
  return dayjs(date).format('DD MMM YYYY, hh:mm A');
};

// Get relative time (e.g., "5 minutes ago")
export const getRelativeTime = (date) => {
  return dayjs(date).fromNow();
};

// Get elapsed minutes from a timestamp
export const getElapsedMinutes = (startTime) => {
  return dayjs().diff(dayjs(startTime), 'minute');
};

// Format elapsed time as MM:SS or HH:MM:SS
export const formatElapsedTime = (startTime) => {
  const totalMinutes = getElapsedMinutes(startTime);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Get color based on elapsed time
export const getTimeColor = (startTime, warningThreshold = 15, dangerThreshold = 25) => {
  const elapsed = getElapsedMinutes(startTime);
  if (elapsed >= dangerThreshold) return 'red';
  if (elapsed >= warningThreshold) return 'yellow';
  return 'green';
};

// Format order number
export const formatOrderNumber = (orderNumber) => {
  return `#${String(orderNumber).padStart(4, '0')}`;
};

// Format table number
export const formatTableNumber = (tableNumber) => {
  return `T${tableNumber}`;
};

// Format phone number
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
};

// Capitalize first letter
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Format status for display
export const formatStatus = (status) => {
  if (!status) return '';
  return status.split('_').map(capitalize).join(' ');
};

// Truncate text with ellipsis
export const truncate = (text, maxLength = 50) => {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};
