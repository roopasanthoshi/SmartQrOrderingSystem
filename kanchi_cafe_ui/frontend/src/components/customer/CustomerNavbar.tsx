import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCustomer } from '../../context/CustomerContext';
import { useTheme } from '../../context/ThemeContext';
import { Coffee, Sun, Moon, MapPin } from 'lucide-react';

export const CustomerNavbar: React.FC = () => {
  const { cafeSettings } = useAuth();
  const { tableNumber, customer } = useCustomer();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 bg-sidebar/97 backdrop-blur text-cream-100 shadow-md border-b border-sidebar-border px-4 h-[64px] flex items-center">
      <div className="max-w-md mx-auto w-full flex items-center justify-between">
        {/* Cafe Logo & Name */}
        <div className="flex items-center gap-2.5">
          {cafeSettings?.logoUrl ? (
            <img
              src={cafeSettings.logoUrl}
              alt={cafeSettings.name}
              className="w-9 h-9 rounded-full object-cover border border-gold-accent/40"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gold-accent/15 border border-gold-accent/40 flex items-center justify-center text-gold-accent">
              <Coffee className="w-5 h-5" />
            </div>
          )}
          <div>
            <h1 className="font-serif font-bold text-[17px] leading-tight tracking-wide text-cafe-900 dark:text-gold-300">
              {cafeSettings?.name || 'Kanchi Cafe'}
            </h1>
            <p className="text-[11px] text-cafe-700 dark:text-cream-200/80 font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-gold-accent" />
              Nagole, Hyderabad
            </p>
          </div>
        </div>

        {/* Right side: Table badge & Theme toggle */}
        <div className="flex items-center gap-2">
          {tableNumber && (
            <span className="bg-gold-accent/15 border border-gold-accent/40 text-gold-accent px-2.5 py-1 rounded-full text-xs font-semibold">
              Table {tableNumber}
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-full bg-sidebar-hover text-gold-accent hover:bg-sidebar-active transition"
            title="Toggle Light/Dark Theme"
          >
            {theme === 'dark' ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>
    </header>
  );
};
