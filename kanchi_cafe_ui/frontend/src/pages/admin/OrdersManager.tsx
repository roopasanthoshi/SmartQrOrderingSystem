import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { PasswordConfirmModal } from '../../components/admin/PasswordConfirmModal';
import { ThermalPrintModal } from '../../components/admin/ThermalPrintModal';
import {
  ShoppingBag,
  Search,
  Printer,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  BellRing,
} from 'lucide-react';

export const OrdersManager: React.FC = () => {
  const { cafeSettings } = useAuth();
  const [tab, setTab] = useState<'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'>('ACTIVE');
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Expanded items state
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);

  // Modals state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [printTargetId, setPrintTargetId] = useState<string | null>(null);

  const delayMins = cafeSettings?.customerNotifDelayMin || 20;

  const toggleExpandCard = (orderId: string) => {
    setExpandedCardIds((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = `/orders/history?status=${tab}&page=${page}&limit=15`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      if (fromDate) url += `&fromDate=${fromDate}`;
      if (toDate) url += `&toDate=${toDate}`;

      const res = await api.get(url);
      if (res.data.success) {
        setOrders(res.data.orders || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [tab, page, search, fromDate, toDate]);

  const handleDeleteConfirm = async (password: string) => {
    if (!deleteTargetId) return;
    await api.post(`/orders/${deleteTargetId}/delete`, { password });
    fetchOrders();
  };

  const handleConfirmCollectionAdmin = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/confirm-collection`, { confirmedBy: 'ADMIN' });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSnoozeAdmin = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/confirm-collection`, { snooze: true });
      fetchOrders();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-bold text-cafe-900 dark:text-gold-300">
            Orders & KOT Management
          </h1>
          <p className="text-[15px] text-[#666666] dark:text-cream-200/60 font-semibold mt-0.5">
            Track, filter, print thermal KOTs, and manage customer orders
          </p>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-cafe-900 p-1 rounded-xl border border-cafe-200 dark:border-gold-500/10 text-xs overflow-x-auto shadow-sm h-10">
          {[
            { key: 'ACTIVE', label: 'Active KOTs' },
            { key: 'PENDING_APPROVAL', label: 'Pending Approvals' },
            { key: 'COMPLETED', label: 'Completed' },
            { key: 'CANCELLED', label: 'Cancelled' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setTab(t.key as any);
                setPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 h-7 flex items-center justify-center ${
                tab === t.key
                  ? 'bg-gold-500 text-cafe-950 shadow-sm'
                  : 'text-cafe-600 dark:text-cream-200 hover:text-gold-600 dark:hover:text-gold-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[18px] p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="icon-input-wrap w-full md:w-72">
          <Search className="icon-input-icon w-4 h-4 text-gold-500" />
          <input
            type="text"
            placeholder="Search by KOT, Customer, Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="icon-input w-full bg-cafe-50/50 dark:bg-cafe-950 border border-cafe-200 dark:border-gold-500/15 rounded-xl !pl-12 pr-4 text-cafe-900 dark:text-cream-100 placeholder-cafe-400 outline-none focus:border-gold-500"
          />
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gold-500 flex-shrink-0" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-cafe-50/50 dark:bg-cafe-950 border border-cafe-200 dark:border-gold-500/15 rounded-xl px-3 h-[44px] text-cafe-900 dark:text-cream-100 outline-none focus:border-gold-500"
          />
          <span className="text-cafe-500 dark:text-cream-200/50 font-bold">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-cafe-50/50 dark:bg-cafe-950 border border-cafe-200 dark:border-gold-500/15 rounded-xl px-3 h-[44px] text-cafe-900 dark:text-cream-100 outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* Orders Grid / Table */}
      {loading ? (
        <div className="py-12 text-center text-gold-500 font-bold text-xs animate-pulse">
          Loading Orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[20px] p-12 text-center text-cafe-500 dark:text-cream-200/50 space-y-2">
          <ShoppingBag className="w-12 h-12 mx-auto opacity-30 text-gold-500" />
          <p className="font-bold text-sm">No {tab.toLowerCase().replace('_', ' ')} orders found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {orders.map((order) => {
            // Check 20-minute delivery notification delay mark for active orders
            const refTime = new Date(order.lastNotifiedAt || order.updatedAt || order.createdAt).getTime();
            const elapsedMins = (Date.now() - refTime) / (1000 * 60);
            const needsAdminDeliveryCheck = order.status === 'ACTIVE' && elapsedMins >= delayMins;

            const isExpanded = expandedCardIds.includes(order.id);
            const itemsToShow = isExpanded ? order.items : order.items.slice(0, 2);

            return (
              <div
                key={order.id}
                className={`bg-white dark:bg-cafe-900 border rounded-[20px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between gap-3 ${
                  needsAdminDeliveryCheck ? 'border-2 border-amber-500 shadow-lg' : 'border-cafe-200 dark:border-gold-500/10'
                }`}
              >
                <div className="space-y-3">
                  {/* Header & KOT */}
                  <div className="flex items-start justify-between pb-2.5 border-b border-cafe-100 dark:border-gold-500/10">
                    <div>
                      <span className="font-mono text-[20px] font-bold text-gold-600 dark:text-gold-300">
                        {order.kotNumber || 'PENDING KOT'}
                      </span>
                      <p className="text-[15px] text-cafe-900 dark:text-cream-100 font-bold mt-0.5 leading-tight">
                        Table {order.table?.tableNumber || order.tableId} • {order.customer?.name}
                      </p>
                      <p className="text-[13px] text-cafe-500 dark:text-cream-200/40 font-mono font-semibold">
                        +91 {order.customer?.mobile}
                      </p>
                      {order.createdAt && (
                        <p className="text-[11px] text-cafe-500 dark:text-cream-200/60 font-semibold mt-1">
                          Placed At: {new Date(order.createdAt).toLocaleString()}
                        </p>
                      )}
                      {order.paymentConfirmedAt && (
                        <p className="text-[11px] text-green-600 dark:text-green-400 font-bold mt-0.5">
                          Paid At: {new Date(order.paymentConfirmedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className="bg-gold-500/15 text-gold-700 dark:text-gold-300 border border-gold-500/20 px-3 py-1 rounded-full text-[12px] font-bold font-mono leading-none flex items-center justify-center h-6">
                      Rs.{order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Delivery notification delay banner */}
                  {needsAdminDeliveryCheck && (
                    <div className="bg-amber-500/10 border border-amber-500/35 p-2.5 rounded-2xl flex items-center justify-between text-xs h-11">
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-[12px]">
                        <BellRing className="w-4 h-4 animate-bounce" />
                        <span>Received yet?</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmCollectionAdmin(order.id)}
                          className="bg-green-500 hover:bg-green-600 text-white font-bold w-[72px] h-7 rounded-lg text-[12px] transition flex items-center justify-center shadow-sm"
                        >
                          YES
                        </button>
                        <button
                          onClick={() => handleSnoozeAdmin(order.id)}
                          className="bg-cafe-800 hover:bg-cafe-700 text-cream-200 font-bold w-[72px] h-7 rounded-lg text-[12px] transition flex items-center justify-center"
                        >
                          NOT YET
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Items List (Collapsible) */}
                  <div className="space-y-1.5">
                    <p className="text-[12px] font-bold text-cafe-400 dark:text-cream-200/40 uppercase tracking-wider">
                      Ordered Items ({order.items.length})
                    </p>
                    <div className="space-y-1 text-[14px] text-cafe-700 dark:text-cream-200 font-medium">
                      {itemsToShow.map((it) => (
                        <div key={it.id} className="flex justify-between items-center bg-cafe-50/50 dark:bg-cafe-950/40 px-3 py-1.5 rounded-xl h-9 border border-cafe-200/50">
                          <span className="truncate">{it.menuItemName}</span>
                          <span className="font-mono bg-cafe-200/50 dark:bg-gold-500/10 text-cafe-800 dark:text-gold-300 w-8 h-6 rounded text-[12px] font-bold flex items-center justify-center ml-auto flex-shrink-0">
                            x{it.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.items.length > 2 && (
                      <button
                        onClick={() => toggleExpandCard(order.id)}
                        className="text-[12px] text-gold-500 hover:text-gold-600 dark:text-gold-400 dark:hover:text-gold-300 font-bold transition focus:outline-none block mt-0.5"
                      >
                        {isExpanded ? 'Collapse Items ▲' : `Show ${order.items.length - 2} more items ▼`}
                      </button>
                    )}
                  </div>

                  {/* Totals Summary */}
                  <div className="pt-2.5 border-t border-cafe-100 dark:border-gold-500/10 space-y-1 text-[14px] text-cafe-500 dark:text-cream-200/60 font-semibold">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono text-cafe-900 dark:text-cream-100">Rs.{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 0}%):</span>
                      <span className="font-mono text-cafe-900 dark:text-cream-100">Rs.{order.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-cafe-900 dark:text-gold-300 border-t border-dashed border-cafe-100 dark:border-gold-500/10 pt-1.5 mt-1">
                      <span>Total Amount:</span>
                      <span className="font-mono text-[15px] font-bold">Rs.{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="pt-3 border-t border-cafe-100 dark:border-gold-500/10 flex items-center justify-between gap-3 h-10 mt-3">
                  <button
                    onClick={() => setPrintTargetId(order.id)}
                    className="flex-1 border border-gold-500/40 hover:bg-gold-500 hover:text-cafe-950 text-gold-600 dark:text-gold-400 h-10 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Printer className="w-4 h-4" /> Print Bill
                  </button>

                  {order.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleConfirmCollectionAdmin(order.id)}
                      className="bg-green-500 hover:bg-green-600 text-white h-10 px-4 rounded-xl text-[13px] font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Collected
                    </button>
                  )}

                  <button
                    onClick={() => setDeleteTargetId(order.id)}
                    className="w-10 h-10 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-xl transition flex items-center justify-center flex-shrink-0"
                    title="Delete Order (Requires Password)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <PasswordConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Order Record"
        message="This will permanently delete this order and its items. Admin password is required."
        onConfirm={handleDeleteConfirm}
        onClose={() => setDeleteTargetId(null)}
      />

      <ThermalPrintModal
        orderId={printTargetId}
        onClose={() => setPrintTargetId(null)}
      />
    </div>
  );
};
