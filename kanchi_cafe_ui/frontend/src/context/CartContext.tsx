import React, { createContext, useContext, useEffect, useState } from 'react';
import { MenuItem } from '../types';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes?: string;
}

interface CartContextType {
  cart: CartItem[];
  addItem: (item: MenuItem, quantity?: number, notes?: string) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, delta: number) => void;
  getItemQuantity: (itemId: string) => number;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  timerSeconds: number;
  isTimerActive: boolean;
  startTimer: () => void;
  resetTimer: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('kanchi_cart');
    return saved ? JSON.parse(saved) : [];
  });

  const [timerSeconds, setTimerSeconds] = useState<number>(20);
  const [isTimerActive, setIsTimerActive] = useState<boolean>(false);

  useEffect(() => {
    localStorage.setItem('kanchi_cart', JSON.stringify(cart));
  }, [cart]);

  // 20-second timer countdown logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timerSeconds]);

  const startTimer = () => {
    setTimerSeconds(20);
    setIsTimerActive(true);
  };

  const resetTimer = () => {
    setTimerSeconds(20);
    setIsTimerActive(false);
  };

  const addItem = (item: MenuItem, quantity = 1, notes?: string) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex((i) => i.menuItem.id === item.id);
      if (existingIndex > -1) {
        return prev.map((i, index) => {
          if (index === existingIndex) {
            return {
              ...i,
              quantity: i.quantity + quantity,
              ...(notes ? { notes } : {}),
            };
          }
          return i;
        });
      }
      return [...prev, { menuItem: item, quantity, notes }];
    });
  };

  const removeItem = (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.menuItem.id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((i) => {
          if (i.menuItem.id === itemId) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const getItemQuantity = (itemId: string): number => {
    const item = cart.find((i) => i.menuItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const clearCart = () => {
    setCart([]);
    resetTimer();
  };

  const totalAmount = cart.reduce((acc, i) => acc + i.menuItem.price * i.quantity, 0);
  const totalItems = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        getItemQuantity,
        clearCart,
        totalAmount,
        totalItems,
        timerSeconds,
        isTimerActive,
        startTimer,
        resetTimer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
