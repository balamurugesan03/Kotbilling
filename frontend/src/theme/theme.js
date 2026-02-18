import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'orange',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',

  colors: {
    // Brand color (warm orange - Petpooja inspired)
    brand: ['#fff4e6', '#ffe8cc', '#ffd8a8', '#ffc078', '#ffa94d', '#ff922b', '#fd7e14', '#f76707', '#e8590c', '#d9480f'],

    // Order status colors
    orderPending: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'],
    orderPreparing: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'],
    orderReady: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20'],
    orderServed: ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c'],

    // Platform colors
    swiggy: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#fc8019', '#f57c00', '#ef6c00', '#e65100', '#bf360c'],
    zomato: ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#e23744', '#e53935', '#d32f2f', '#c62828', '#b71c1c'],

    // Table status colors
    tableAvailable: ['#e8f5e9', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20'],
    tableOccupied: ['#fff3e0', '#ffe0b2', '#ffcc80', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'],
    tableReserved: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'],
  },

  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          minHeight: '44px', // Touch-friendly
        },
      },
    },
    ActionIcon: {
      defaultProps: {
        size: 'lg',
      },
      styles: {
        root: {
          minWidth: '44px',
          minHeight: '44px',
        },
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        size: 'md',
      },
    },
    NumberInput: {
      defaultProps: {
        size: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
      },
    },
    Card: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
    Paper: {
      defaultProps: {
        padding: 'md',
        radius: 'md',
        withBorder: true,
      },
    },
  },

  other: {
    // POS-specific settings
    touchTargetSize: 44,
    cardSpacing: 16,
  },
});
