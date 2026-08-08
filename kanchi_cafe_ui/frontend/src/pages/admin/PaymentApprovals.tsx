import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Order } from '../../types';
import { ThermalPrintModal } from '../../components/admin/ThermalPrintModal';
import { CheckCircle2, XCircle, Clock, ShieldCheck, QrCode } from 'lucide-react';

export const PaymentApprovals: React.FC = () => {
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Single Print Order popup state
  const [printOrderId, setPrintOrderId] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingOrder, setRejectingOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Payment not received in UPI');
  const [customMsg, setCustomMsg] = useState('');

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/orders/active');
      if (res.data.success) {
        const orders: Order[] = res.data.orders || [];
        setPendingOrders(orders.filter((o) => o.status === 'PENDING_APPROVAL'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const handleApprovePayment = async (orderId: string) => {
    try {
      const res = await api.post(`/orders/${orderId}/approve`);
      if (res.data.success) {
        // Open single Print Order modal
        setPrintOrderId(orderId);
        fetchPendingApprovals();
      }
    } catch (err: any) {
      alert(err.message || 'Payment approval failed');
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return;
    try {
      const res = await api.post(`/orders/${rejectingOrder.id}/reject`, {
        reason: rejectReason,
        customMessage: customMsg,
      });

      if (res.data.success) {
        setRejectingOrder(null);
        setCustomMsg('');
        fetchPendingApprovals();
      }
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-gold-500" /> Payment Approvals Queue
        </h1>
        <p className="text-xs text-cafe-600 dark:text-cream-200/70">
          Verify incoming customer UPI payments. Approval generates next sequential KOT and opens single Print Order popup.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gold-400 font-mono text-xs animate-pulse">
          Loading Pending Approvals Queue...
        </div>
      ) : pendingOrders.length === 0 ? (
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-8 text-center space-y-2 shadow-sm">
          <CheckCircle2 className="w-12 h-12 text-green-500/40 mx-auto" />
          <h3 className="font-bold text-base text-cafe-900 dark:text-gold-300">
            No Pending Approvals
          </h3>
          <p className="text-xs text-cafe-500 dark:text-cream-200/60">
            All customer payments have been processed and approved.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {pendingOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-5 shadow-lg space-y-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start pb-3 border-b border-cafe-100 dark:border-gold-500/10">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-amber-500 tracking-wider">
                      PAYMENT PENDING
                    </span>
                    <h3 className="font-serif text-lg font-bold text-cafe-900 dark:text-gold-300">
                      Table {order.table?.tableNumber}
                    </h3>
                  </div>

                  <span className="font-mono text-lg font-bold text-gold-600 dark:text-gold-400">
                    Rs.{order.totalAmount.toFixed(2)}
                  </span>
                </div>

                <div className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                    <span>Customer: <strong>{order.customer?.name}</strong></span>
                    <span className="font-mono">{order.customer?.mobile}</span>
                  </div>

                  <div className="bg-cream-50 dark:bg-cafe-950 p-3 rounded-2xl border border-cafe-200 dark:border-gold-500/10 space-y-1">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-cafe-900 dark:text-cream-100 font-medium">
                        <span>{it.menuItemName}</span>
                        <span className="font-mono">x{it.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-cafe-100 dark:border-gold-500/10 space-y-1 text-xs">
                    {order.createdAt && (
                      <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                        <span>Placed At:</span>
                        <span className="font-mono">{new Date(order.createdAt).toLocaleString()}</span>
                      </div>
                    )}
                    {order.paymentConfirmedAt && (
                      <div className="flex justify-between text-green-600 dark:text-green-400 font-bold">
                        <span>Customer Claimed Paid At:</span>
                        <span className="font-mono">{new Date(order.paymentConfirmedAt).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                      <span>Subtotal:</span>
                      <span className="font-mono">Rs.{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                      <span>GST ({order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 0}%):</span>
                      <span className="font-mono">Rs.{order.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-cafe-900 dark:text-gold-300">
                      <span>Grand Total:</span>
                      <span className="font-mono text-sm">Rs.{order.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval & Rejection Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setRejectingOrder(order)}
                  className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <XCircle className="w-4 h-4" /> Reject Payment
                </button>

                <button
                  onClick={() => handleApprovePayment(order.id)}
                  className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 shadow transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve & Print Order
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Print Order Popup */}
      <ThermalPrintModal
        orderId={printOrderId}
        onClose={() => setPrintOrderId(null)}
        onPrintedSuccess={() => fetchPendingApprovals()}
      />

      {/* Rejection Reasons Modal */}
      {rejectingOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 max-w-sm w-full text-cream-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-gold-300">
              Reject Payment Request
            </h3>
            <p className="text-xs text-cream-200/70">
              Select rejection reason to notify Table {rejectingOrder.table?.tableNumber}:
            </p>

            <div className="space-y-2 text-xs">
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
              >
                <option value="Payment not received in UPI">Payment not received in UPI</option>
                <option value="Incorrect amount paid">Incorrect amount paid</option>
                <option value="Kitchen is closed for item">Kitchen is closed for item</option>
                <option value="Other">Other (Specify Custom Reason)</option>
              </select>

              {rejectReason === 'Other' && (
                <textarea
                  rows={3}
                  placeholder="Enter custom rejection reason..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2 text-cream-100 outline-none"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 text-xs">
              <button
                onClick={() => setRejectingOrder(null)}
                className="bg-cafe-800 text-cream-200 py-2.5 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="bg-red-600 text-white font-bold py-2.5 rounded-xl shadow"
              >
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
