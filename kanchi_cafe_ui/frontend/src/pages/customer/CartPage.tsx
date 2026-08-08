import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { ArrowLeft, Trash2, Plus, Minus, Clock, ShieldCheck, ArrowRight, ShoppingBag } from 'lucide-react';

import { useAuth } from '../../context/AuthContext';
import { calculateGst } from '../../utils/gstCalculator';

export const CartPage: React.FC = () => {
  const { cart, updateQuantity, removeItem, totalAmount, timerSeconds, isTimerActive, startTimer } = useCart();
  const { customer, tableNumber } = useCustomer();
  const { cafeSettings } = useAuth();
  const navigate = useNavigate();

  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (cart.length > 0 && !isTimerActive) {
      startTimer();
    }
  }, [cart.length]);

  const handleProceedToPayment = async () => {
    if (!customer?.mobile || !tableNumber) {
      navigate('/table/' + (tableNumber || 1));
      return;
    }

    if (cart.length === 0) return;

    setSubmitting(true);
    setError('');

    try {
      // Create Order API endpoint
      const payload = {
        tableNumber,
        mobile: customer.mobile,
        name: customer.name,
        notes,
        items: cart.map((c) => ({
          menuItemId: c.menuItem.id,
          quantity: c.quantity,
          notes: c.notes || null,
        })),
      };

      const res = await api.post('/orders/create', payload);

      if (res.data.success && res.data.order) {
        // Navigate to payment page with order state
        navigate('/payment', { state: { order: res.data.order } });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const enableGst = cafeSettings?.enableGst || false;
  const gstPercentage = cafeSettings?.gstPercentage || 0;
  const gstResult = calculateGst(totalAmount, enableGst, gstPercentage);

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Header navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/menu')}
            className="flex items-center gap-1 text-xs font-semibold text-gold-500 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Menu
          </button>
          <h2 className="font-serif text-lg font-bold text-cafe-800 dark:text-gold-300">
            Your Order Cart
          </h2>
        </div>

        {/* 20-Second Interactive Countdown Timer Banner */}
        <div className="bg-gradient-to-r from-cafe-900 to-cafe-800 border-2 border-gold-500/50 rounded-2xl p-4 text-cream-100 shadow-lg flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center font-mono font-bold text-lg animate-pulse">
              {timerSeconds}s
            </div>
            <div>
              <h4 className="text-sm font-bold text-gold-300 flex items-center gap-1">
                <Clock className="w-4 h-4 text-gold-400" /> Cart Review Timer
              </h4>
              <p className="text-xs text-cream-200/70">
                {timerSeconds > 0
                  ? 'You can modify items before payment unlocks'
                  : 'Timer completed! Payment is ready.'}
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold bg-gold-500/20 text-gold-300 px-2.5 py-1 rounded-full border border-gold-500/30">
            Table {tableNumber || 1}
          </span>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Empty Cart state */}
        {cart.length === 0 ? (
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-8 text-center space-y-4">
            <ShoppingBag className="w-16 h-16 text-gold-500/40 mx-auto" />
            <p className="text-sm font-semibold text-cafe-600 dark:text-cream-200/60">
              Your cart is empty
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-2.5 px-6 rounded-xl shadow transition text-xs"
            >
              Browse Menu & Add Items
            </button>
          </div>
        ) : (
          /* Cart Item List */
          <div className="space-y-3">
            <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm divide-y divide-cafe-100 dark:divide-gold-500/10">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-cafe-900 dark:text-cream-100">
                      {item.menuItem.name}
                    </h4>
                    <span className="font-mono text-xs text-gold-600 dark:text-gold-400 font-semibold">
                      Rs.{(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-cafe-100 dark:bg-cafe-800 text-cafe-900 dark:text-cream-100 rounded-xl px-2 py-1 text-xs font-bold border border-cafe-200 dark:border-gold-500/20">
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, -1)}
                        className="p-1 hover:text-gold-500 transition"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2 font-mono">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.menuItem.id, 1)}
                        className="p-1 hover:text-gold-500 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="p-1.5 text-red-400 hover:text-red-500 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Special Instructions */}
            <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm">
              <label className="block text-xs font-semibold text-cafe-800 dark:text-gold-300 mb-1.5">
                Cooking Notes / Special Instructions
              </label>
              <textarea
                rows={2}
                placeholder="e.g., Extra spicy, less sugar, no onions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-xs text-cafe-900 dark:text-cream-100 placeholder-cafe-400 dark:placeholder-cream-200/40 outline-none"
              />
            </div>

            {/* Bill Summary */}
            <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm space-y-2 text-xs">
              <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                <span>Items Subtotal</span>
                <span className="font-mono">Rs.{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                <span>GST ({enableGst ? `${gstPercentage}%` : 'Disabled'})</span>
                <span className="font-mono">Rs.{gstResult.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-cafe-900 dark:text-gold-300 pt-2 border-t border-cafe-100 dark:border-gold-500/20">
                <span>Grand Total</span>
                <span className="font-mono text-base">Rs.{gstResult.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Proceed to Payment Action Button */}
        {cart.length > 0 && (
          <div className="pt-2">
            <button
              onClick={handleProceedToPayment}
              disabled={submitting}
              className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-4 px-5 rounded-2xl shadow-xl flex items-center justify-between transition"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cafe-950" />
                <span>{submitting ? 'Generating KOT...' : 'Proceed to Payment'}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-base">
                Rs.{gstResult.totalAmount.toFixed(2)} <ArrowRight className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}
      </main>

      <CustomerBottomNav />
    </div>
  );
};
