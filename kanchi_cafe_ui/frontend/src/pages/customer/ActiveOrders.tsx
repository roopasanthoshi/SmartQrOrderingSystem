import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { CollectionPromptModal } from '../../components/customer/CollectionPromptModal';
import { Clock, Hourglass, Plus, CheckCircle2, ShoppingBag, CheckSquare, FileDown } from 'lucide-react';
import { Order } from '../../types';

export const ActiveOrders: React.FC = () => {
  const { customer, activeOrders, tableNumber, refreshOrders, setPendingReviewOrder } = useCustomer();
  const navigate = useNavigate();

  // Confirmation modal state for RECEIVED ORDER button click
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const handleDownloadInvoice = async (orderId: string) => {
    if (!customer?.mobile || downloadingId) return;
    setDownloadingId(orderId);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || '/api'}/orders/${orderId}/invoice?mobile=${encodeURIComponent(customer.mobile)}`
      );
      if (!response.ok) throw new Error('Failed download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      const contentDisposition = response.headers.get('content-disposition');
      let filename = `Invoice_${orderId}.pdf`;
      if (contentDisposition) {
        const matches = /filename="?([^"]+)"?/.exec(contentDisposition);
        if (matches && matches[1]) {
          filename = matches[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setToastMsg('Unable to download invoice. Please try again.');
      setTimeout(() => setToastMsg(null), 3000);
    } finally {
      setDownloadingId(null);
    }
  };

  const handleConfirmReceivedYes = async () => {
    if (!confirmingOrder) return;
    const targetOrder = confirmingOrder;
    setConfirmingOrder(null);

    try {
      await api.post(`/orders/${targetOrder.id}/confirm-collection`, { confirmedBy: 'CUSTOMER' });
      setPendingReviewOrder(targetOrder);
      await refreshOrders();
      navigate('/review');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />
      <CollectionPromptModal />

      <main className="max-w-md mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300">
              Current Orders
            </h2>
            <p className="text-xs text-cafe-600 dark:text-cream-200/70">
              Live order status for Table {tableNumber || 1}
            </p>
          </div>
          <button
            onClick={() => navigate('/menu')}
            className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow transition"
          >
            <Plus className="w-4 h-4" /> Order More
          </button>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-8 text-center space-y-4 shadow-sm">
            <ShoppingBag className="w-14 h-14 text-gold-500/40 mx-auto" />
            <h3 className="font-bold text-base text-cafe-800 dark:text-gold-300">
              No Active Orders
            </h3>
            <p className="text-xs text-cafe-600 dark:text-cream-200/60 max-w-xs mx-auto">
              You don't have any active orders right now. Browse the menu to place an order.
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-2.5 px-6 rounded-xl shadow text-xs transition"
            >
              Order Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeOrders.map((order) => {
              const isApproved = (order.paymentStatus === 'APPROVED' || order.status === 'ACTIVE') && Boolean(order.kotNumber);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-5 shadow-lg space-y-4"
                >
                  {/* Status Banner */}
                  <div className="flex items-center justify-between pb-3 border-b border-cafe-100 dark:border-gold-500/20">
                    <div>
                      {isApproved ? (
                        <>
                          <span className="text-[10px] uppercase font-bold text-gold-500 tracking-wider">
                            KOT NUMBER
                          </span>
                          <h3 className="font-mono text-2xl font-extrabold text-cafe-900 dark:text-gold-300">
                            {order.kotNumber}
                          </h3>
                        </>
                      ) : (
                        <div>
                          <span className="text-[10px] uppercase font-bold text-amber-500 tracking-wider">
                            ORDER STATUS
                          </span>
                          <h3 className="font-serif text-lg font-bold text-amber-400">
                            Payment Submitted
                          </h3>
                        </div>
                      )}
                    </div>

                    <div>
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 bg-green-500/20 text-green-400 border border-green-500/40 px-3 py-1 rounded-full text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4" /> Payment Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                          <Hourglass className="w-4 h-4" /> Waiting for Cafe Approval
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Items Summary */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-cafe-600 dark:text-cream-200/70">
                      Items Ordered:
                    </p>
                    <div className="bg-cream-50 dark:bg-cafe-950 p-3 rounded-2xl border border-cafe-200 dark:border-gold-500/10 space-y-1.5 text-xs">
                      {order.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-cafe-900 dark:text-cream-100 font-medium">
                          <span>{it.menuItemName}</span>
                          <div className="flex items-center gap-3 font-mono">
                            <span className="text-cafe-500 dark:text-cream-200/60">x{it.quantity}</span>
                            <span className="text-gold-600 dark:text-gold-400 font-bold">
                              Rs.{(it.unitPrice * it.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Received Order Button Section */}
                  {isApproved ? (
                    <div className="space-y-3">
                      <div className="bg-gold-500/10 border border-gold-500/30 p-3 rounded-2xl text-center space-y-1">
                        <p className="text-xs font-bold text-gold-400 flex items-center justify-center gap-1.5">
                          <Clock className="w-4 h-4" /> Order is being prepared by kitchen.
                        </p>
                      </div>

                      {/* PROMINENT RECEIVED ORDER BUTTON */}
                      <button
                        onClick={() => setConfirmingOrder(order)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-extrabold py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition"
                      >
                        <CheckSquare className="w-5 h-5" /> ✓ RECEIVED ORDER
                      </button>

                      {/* DOWNLOAD INVOICE BUTTON */}
                      <button
                        onClick={() => handleDownloadInvoice(order.id)}
                        disabled={downloadingId !== null}
                        className={`w-full font-extrabold py-3.5 px-4 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-sm transition ${
                          downloadingId === order.id
                            ? 'bg-gold-500/50 text-cafe-950/50 cursor-not-allowed'
                            : 'bg-gold-500 hover:bg-gold-600 text-cafe-950'
                        }`}
                      >
                        <FileDown className="w-5 h-5" />
                        {downloadingId === order.id ? 'Downloading...' : 'Download Invoice'}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-2xl text-center space-y-1">
                      <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                        Waiting for Cafe Approval
                      </p>
                      <p className="text-[11px] text-cafe-600 dark:text-cream-200/70">
                        Please wait... KOT number will be assigned as soon as payment is verified.
                      </p>
                    </div>
                  )}

                  {/* Total Bill Footer */}
                  <div className="pt-2 border-t border-cafe-100 dark:border-gold-500/10 text-xs space-y-1">
                    <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                      <span>Subtotal:</span>
                      <span className="font-mono">Rs.{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-cafe-600 dark:text-cream-200/70">
                      <span>GST ({order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 0}%):</span>
                      <span className="font-mono">Rs.{order.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between font-bold text-cafe-900 dark:text-gold-300 pt-1">
                      <span className="text-cafe-600 dark:text-cream-200/60 font-normal">
                        Order Time: {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="font-mono text-base font-bold">
                        Total: Rs.{order.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Confirmation Modal when Customer clicks RECEIVED ORDER */}
      {confirmingOrder && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cafe-800 border-2 border-gold-500 rounded-3xl p-6 max-w-sm w-full text-cream-100 text-center space-y-4 shadow-2xl">
            <div className="w-14 h-14 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto border border-green-500/40">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-gold-400 tracking-wider">
                CONFIRM COLLECTION
              </span>
              <h3 className="font-serif text-xl font-bold text-gold-300 mt-1">
                Have you received your order?
              </h3>
              <p className="text-xs text-cream-200/80 mt-1 font-mono">
                Order {confirmingOrder.kotNumber}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleConfirmReceivedYes}
                className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3 px-4 rounded-xl text-xs shadow transition flex items-center justify-center gap-1"
              >
                YES
              </button>
              <button
                onClick={() => setConfirmingOrder(null)}
                className="w-full bg-cafe-700 hover:bg-cafe-600 text-cream-200 font-semibold py-3 px-4 rounded-xl text-xs transition"
              >
                NOT YET
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg text-xs animate-bounce">
          {toastMsg}
        </div>
      )}

      <CustomerBottomNav />
    </div>
  );
};
