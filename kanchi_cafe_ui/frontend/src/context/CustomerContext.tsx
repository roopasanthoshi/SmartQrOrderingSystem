import React, { createContext, useContext, useEffect, useState } from 'react';
import { Customer, Order } from '../types';
import { api } from '../services/api';

interface CustomerContextType {
  customer: Customer | null;
  tableNumber: number | null;
  activeOrders: Order[];
  previousOrders: Order[];
  isLoading: boolean;
  setTableNumber: (num: number) => void;
  setCustomerInfo: (cust: Customer) => void;
  refreshOrders: () => Promise<void>;
  logoutCustomer: () => void;
  pendingReviewOrder: Order | null;
  setPendingReviewOrder: (order: Order | null) => void;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<Customer | null>(() => {
    const saved = localStorage.getItem('kanchi_customer');
    return saved ? JSON.parse(saved) : null;
  });

  const [tableNumber, setTableNumberState] = useState<number | null>(() => {
    const saved = localStorage.getItem('kanchi_table_number');
    return saved ? Number(saved) : 1;
  });

  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [previousOrders, setPreviousOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [pendingReviewOrder, setPendingReviewOrder] = useState<Order | null>(null);

  const setTableNumber = (num: number) => {
    setTableNumberState(num);
    localStorage.setItem('kanchi_table_number', String(num));
  };

  const setCustomerInfo = (cust: Customer) => {
    setCustomer(cust);
    localStorage.setItem('kanchi_customer', JSON.stringify(cust));
  };

  const logoutCustomer = () => {
    setCustomer(null);
    localStorage.removeItem('kanchi_customer');
    setActiveOrders([]);
    setPreviousOrders([]);
  };

  const refreshOrders = async () => {
    if (!customer?.mobile) return;
    setIsLoading(true);
    try {
      const res = await api.post('/customer/identify', { mobile: customer.mobile });
      if (res.data.success && res.data.customer) {
        setCustomerInfo(res.data.customer);
        setActiveOrders(res.data.activeOrders || []);
        setPreviousOrders(res.data.previousOrders || []);
      }
    } catch (err) {
      console.error('Error refreshing customer orders:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.mobile) {
      refreshOrders();
      // Poll active orders every 10 seconds for real-time status updates
      const interval = setInterval(refreshOrders, 10000);
      return () => clearInterval(interval);
    }
  }, [customer?.mobile]);

  return (
    <CustomerContext.Provider
      value={{
        customer,
        tableNumber,
        activeOrders,
        previousOrders,
        isLoading,
        setTableNumber,
        setCustomerInfo,
        refreshOrders,
        logoutCustomer,
        pendingReviewOrder,
        setPendingReviewOrder,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) throw new Error('useCustomer must be used within CustomerProvider');
  return context;
};
