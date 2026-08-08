import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { User, Phone, Award, Coffee, LogOut, Star } from 'lucide-react';

export const CustomerProfile: React.FC = () => {
  const { customer, logoutCustomer, tableNumber } = useCustomer();
  const navigate = useNavigate();

  const [favouriteItem, setFavouriteItem] = useState<string>('Filter Coffee');

  useEffect(() => {
    if (customer?.mobile) {
      api.get(`/customer/profile/${customer.mobile}`).then((res) => {
        if (res.data.success && res.data.customer?.favouriteItem) {
          setFavouriteItem(res.data.customer.favouriteItem);
        }
      }).catch(console.error);
    }
  }, [customer?.mobile]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 flex flex-col">
        <CustomerNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-[20px] p-8 text-center space-y-4 shadow-sm max-w-sm w-full">
            <div className="w-14 h-14 rounded-full bg-gold-500/15 text-gold-500 flex items-center justify-center mx-auto">
              <User className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-cafe-600 dark:text-cream-200/70">
              No customer profile loaded yet
            </p>
            <button
              onClick={() => navigate(`/table/${tableNumber || 1}`)}
              className="bg-gold-500 hover:bg-gold-600 text-cafe-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow transition"
            >
              Identify Mobile
            </button>
          </div>
        </div>
        <CustomerBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />

      <main className="max-w-md mx-auto p-4 space-y-5">
        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-6 shadow-xl text-center space-y-3">
          <div className="w-16 h-16 bg-gold-500/20 text-gold-400 border border-gold-500/40 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            <User className="w-8 h-8" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300">
            {customer.name}
          </h2>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70 flex items-center justify-center gap-1 font-mono">
            <Phone className="w-3.5 h-3.5 text-gold-500" /> {customer.mobile}
          </p>
        </div>

        {/* Profile Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm text-center">
            <Award className="w-6 h-6 text-gold-500 mx-auto mb-1" />
            <span className="font-mono text-xl font-bold text-cafe-900 dark:text-gold-300">
              {customer.totalVisits}
            </span>
            <p className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">
              Total Cafe Visits
            </p>
          </div>

          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm text-center">
            <Coffee className="w-6 h-6 text-gold-500 mx-auto mb-1" />
            <span className="font-mono text-xl font-bold text-cafe-900 dark:text-gold-300">
              {customer.totalOrders || 1}
            </span>
            <p className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">
              Total KOT Orders
            </p>
          </div>
        </div>

        {/* Favorite Item Card */}
        <div className="bg-gradient-to-r from-cafe-900 to-cafe-800 border border-gold-500/30 rounded-2xl p-4 text-cream-100 shadow-md flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gold-400">
              MOST ORDERED ITEM
            </span>
            <h4 className="font-serif font-bold text-base text-cream-100">
              {favouriteItem}
            </h4>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-4">
          <button
            onClick={() => {
              logoutCustomer();
              navigate(`/table/${tableNumber || 1}`);
            }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" /> Change Mobile / Logout
          </button>
        </div>
      </main>

      <CustomerBottomNav />
    </div>
  );
};
