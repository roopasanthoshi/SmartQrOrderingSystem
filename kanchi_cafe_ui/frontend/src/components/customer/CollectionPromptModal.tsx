import React, { useEffect, useState } from 'react';
import { useCustomer } from '../../context/CustomerContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Bell } from 'lucide-react';
import { Order } from '../../types';

export const CollectionPromptModal: React.FC = () => {
  const { activeOrders, refreshOrders, setPendingReviewOrder } = useCustomer();
  const { cafeSettings } = useAuth();
  const navigate = useNavigate();
  const [promptOrder, setPromptOrder] = useState<Order | null>(null);

  // Track local snooze timestamps to prevent instant re-prompting while DB syncs
  const [snoozedOrderIds, setSnoozedOrderIds] = useState<{ [orderId: string]: number }>({});

  const delayMins = cafeSettings?.customerNotifDelayMin || 20;
  const reminderMins = cafeSettings?.reminderIntervalMin || 15;

  // Request browser notification permission once on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(console.error);
    }
  }, []);

  useEffect(() => {
    const eligibleOrder = activeOrders.find((ord) => {
      // Must be ACTIVE, have KOT number, and not yet confirmed collected
      if (ord.status !== 'ACTIVE' || !ord.kotNumber) return false;
      if (ord.confirmedCollectedByCustomer) return false;

      // Check local snooze timestamp first
      const snoozedTime = snoozedOrderIds[ord.id];
      if (snoozedTime) {
        const elapsedSinceSnoozeMins = (Date.now() - snoozedTime) / (1000 * 60);
        if (elapsedSinceSnoozeMins < reminderMins) {
          return false; // Still snoozed, do NOT display!
        }
      }

      // Calculate elapsed time from DB approval / last notified timestamp
      const referenceTime = new Date(ord.lastNotifiedAt || ord.updatedAt || ord.createdAt).getTime();
      const elapsedMins = (Date.now() - referenceTime) / (1000 * 60);

      // Trigger popup ONLY AFTER 20-minute delay passes
      return elapsedMins >= delayMins;
    });

    if (eligibleOrder && !promptOrder) {
      setPromptOrder(eligibleOrder);

      // Trigger Browser Notification API if permitted
      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification('Kanchi Cafe Order Update', {
            body: `Have you received your order ${eligibleOrder.kotNumber}?`,
            icon: '/favicon.svg',
          });
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [activeOrders, promptOrder, snoozedOrderIds, delayMins, reminderMins]);

  if (!promptOrder) return null;

  const handleYesReceived = async () => {
    try {
      await api.post(`/orders/${promptOrder.id}/confirm-collection`, { confirmedBy: 'CUSTOMER' });
      setPendingReviewOrder(promptOrder);
      setPromptOrder(null);
      await refreshOrders();
      navigate('/review');
    } catch (err) {
      console.error(err);
      setPromptOrder(null);
    }
  };

  // Clean "NOT YET" handler: updates DB lastNotifiedAt to restart 15-min reminder timer persistently!
  const handleNotYet = async () => {
    if (promptOrder) {
      const currentOrderId = promptOrder.id;
      setSnoozedOrderIds((prev) => ({
        ...prev,
        [currentOrderId]: Date.now(),
      }));
      setPromptOrder(null);

      try {
        await api.post(`/orders/${currentOrderId}/confirm-collection`, { snooze: true });
        await refreshOrders();
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cafe-800 border-2 border-gold-500 rounded-2xl p-6 max-w-sm w-full text-cream-100 shadow-2xl text-center space-y-4">
        <div className="w-14 h-14 bg-gold-500/20 text-gold-300 rounded-full flex items-center justify-center mx-auto border border-gold-500/40">
          <Bell className="w-7 h-7 text-gold-400 animate-bounce" />
        </div>

        <div>
          <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">
            DELIVERY STATUS CHECK
          </span>
          <h3 className="font-serif text-xl font-bold text-gold-300 mt-1">
            Have you received your order?
          </h3>
        </div>

        <p className="text-sm text-cream-200">
          Order KOT: <strong className="text-gold-300 font-mono">{promptOrder.kotNumber}</strong> at Table {promptOrder.table?.tableNumber}
        </p>

        <div className="bg-cafe-900/80 p-3 rounded-xl text-xs text-left space-y-1 border border-gold-500/10">
          <p className="text-gold-400 font-semibold mb-1">Items in Order:</p>
          {promptOrder.items.map((it) => (
            <div key={it.id} className="flex justify-between text-cream-200">
              <span>{it.menuItemName}</span>
              <span>x{it.quantity}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={handleYesReceived}
            className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3 px-4 rounded-xl shadow transition flex items-center justify-center gap-1.5 text-xs"
          >
            <CheckCircle2 className="w-4 h-4" /> YES
          </button>
          <button
            onClick={handleNotYet}
            className="w-full bg-cafe-700 hover:bg-cafe-600 text-cream-200 font-semibold py-3 px-4 rounded-xl text-xs transition"
          >
            NOT YET
          </button>
        </div>
      </div>
    </div>
  );
};
