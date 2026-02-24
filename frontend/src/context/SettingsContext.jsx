import { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext(null);

// Default billing settings with GST enabled
const DEFAULT_BILLING_SETTINGS = {
  cgstPercent: 2.5,
  sgstPercent: 2.5,
  serviceChargePercent: 5,
  enableGst: true,
  enableServiceCharge: true,
  printKotAutomatically: true,
  printBillAutomatically: true,
};

const DEFAULT_RESTAURANT_SETTINGS = {
  name: '',
  address: '',
  phone: '',
  email: '',
  gstNumber: '',
};

const SETTINGS_STORAGE_KEY = 'kotbilling_settings';

export const SettingsProvider = ({ children }) => {
  const [billingSettings, setBillingSettings] = useState(DEFAULT_BILLING_SETTINGS);
  const [restaurantSettings, setRestaurantSettings] = useState(DEFAULT_RESTAURANT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.billing) {
          setBillingSettings({ ...DEFAULT_BILLING_SETTINGS, ...parsed.billing });
        }
        if (parsed.restaurant) {
          setRestaurantSettings({ ...DEFAULT_RESTAURANT_SETTINGS, ...parsed.restaurant });
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify({
          billing: billingSettings,
          restaurant: restaurantSettings,
        })
      );
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [billingSettings, restaurantSettings, isLoaded]);

  // Calculate taxes based on subtotal
  const calculateTaxes = (subtotal) => {
    const cgst = billingSettings.enableGst ? subtotal * (billingSettings.cgstPercent / 100) : 0;
    const sgst = billingSettings.enableGst ? subtotal * (billingSettings.sgstPercent / 100) : 0;
    const serviceCharge = billingSettings.enableServiceCharge
      ? subtotal * (billingSettings.serviceChargePercent / 100)
      : 0;
    const totalTax = cgst + sgst;
    const grandTotal = subtotal + totalTax + serviceCharge;

    return {
      subtotal,
      cgst,
      sgst,
      totalTax,
      serviceCharge,
      grandTotal,
      cgstPercent: billingSettings.enableGst ? billingSettings.cgstPercent : 0,
      sgstPercent: billingSettings.enableGst ? billingSettings.sgstPercent : 0,
      serviceChargePercent: billingSettings.enableServiceCharge ? billingSettings.serviceChargePercent : 0,
    };
  };

  const updateBillingSettings = (updates) => {
    setBillingSettings((prev) => ({ ...prev, ...updates }));
  };

  const updateRestaurantSettings = (updates) => {
    setRestaurantSettings((prev) => ({ ...prev, ...updates }));
  };

  const value = {
    billingSettings,
    restaurantSettings,
    updateBillingSettings,
    updateRestaurantSettings,
    calculateTaxes,
    isLoaded,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export default SettingsContext;
