import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, Clock, History, User } from 'lucide-react';
import { useCustomer } from '../../context/CustomerContext';

export const CustomerBottomNav: React.FC = () => {
  const { activeOrders } = useCustomer();
  const activeCount = activeOrders.length;

  const navItems = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Menu', path: '/menu', icon: UtensilsCrossed },
    {
      label: 'Current',
      path: '/active-orders',
      icon: Clock,
      badge: activeCount > 0 ? activeCount : null,
    },
    { label: 'Previous', path: '/history', icon: History },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-6 left-4 right-4 z-40 bg-white/80 dark:bg-cafe-900/80 backdrop-blur-lg border border-cafe-200/40 dark:border-gold-500/10 text-cafe-800 dark:text-cream-200 shadow-[0_15px_35px_rgba(0,0,0,0.08)] rounded-[20px] px-2 py-2 max-w-md mx-auto transition-all duration-300">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-1 py-1.5 px-3.5 rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-gold-700 dark:text-gold-300 font-bold bg-gold-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] scale-105'
                    : 'text-cafe-500/75 dark:text-cream-200/55 hover:text-cafe-800 dark:hover:text-cream-100'
                }`
              }
            >
              <div className="relative">
                <Icon className="w-5 h-5 transition-transform duration-300" />
                {item.badge !== null && (
                  <span className="absolute -top-2 -right-2.5 bg-red-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-wider uppercase font-semibold">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
