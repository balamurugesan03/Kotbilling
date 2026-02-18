import { Badge } from '@mantine/core';
import {
  ORDER_STATUS_COLORS,
  TABLE_STATUS_COLORS,
  PLATFORM_COLORS,
} from '../../utils/constants';
import { formatStatus } from '../../utils/formatters';

export const OrderStatusBadge = ({ status, size = 'sm', ...props }) => {
  const color = ORDER_STATUS_COLORS[status] || 'gray';
  return (
    <Badge color={color} variant="light" size={size} {...props}>
      {formatStatus(status)}
    </Badge>
  );
};

export const TableStatusBadge = ({ status, size = 'sm', ...props }) => {
  const color = TABLE_STATUS_COLORS[status] || 'gray';
  return (
    <Badge color={color} variant="light" size={size} {...props}>
      {formatStatus(status)}
    </Badge>
  );
};

export const PlatformBadge = ({ platform, size = 'sm', ...props }) => {
  const color = PLATFORM_COLORS[platform] || 'gray';
  const label = platform === 'swiggy' ? 'Swiggy' : platform === 'zomato' ? 'Zomato' : platform;
  return (
    <Badge color={color} variant="filled" size={size} {...props}>
      {label}
    </Badge>
  );
};

export const VegBadge = ({ isVeg, size = 'xs', ...props }) => {
  return (
    <Badge
      color={isVeg ? 'green' : 'red'}
      variant="outline"
      size={size}
      {...props}
    >
      {isVeg ? 'Veg' : 'Non-Veg'}
    </Badge>
  );
};

const StatusBadge = ({ type, status, ...props }) => {
  switch (type) {
    case 'order':
      return <OrderStatusBadge status={status} {...props} />;
    case 'table':
      return <TableStatusBadge status={status} {...props} />;
    case 'platform':
      return <PlatformBadge platform={status} {...props} />;
    default:
      return (
        <Badge variant="light" {...props}>
          {formatStatus(status)}
        </Badge>
      );
  }
};

export default StatusBadge;
