import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { useCart } from '../../context/CartContext';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { CollectionPromptModal } from '../../components/customer/CollectionPromptModal';
import { History, RotateCcw, Calendar, CheckCircle2, XCircle, Star, MessageSquare, FileDown } from 'lucide-react';
import { MenuItem } from '../../types';

export const OrderHistory: React.FC = () => {
  const { customer, previousOrders, setPendingReviewOrder } = useCustomer();
  const { addItem } = useCart();
  const navigate = useNavigate();

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

  const handleOrderAgain = (order: any) => {
    order.items.forEach((item: any) => {
      const dummyMenuItem: MenuItem = {
        id: item.menuItemId || item.id,
        name: item.menuItemName,
        price: item.unitPrice,
        categoryId: '',
        isAvailable: true,
        isPopular: false,
        isCoffeeOrJuice: item.isCoffeeOrJuice,
        sortOrder: 0,
      };
      addItem(dummyMenuItem, item.quantity);
    });
    navigate('/cart');
  };

  const handleLeaveReview = (order: any) => {
    setPendingReviewOrder(order);
    navigate('/review');
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />
      <CollectionPromptModal />

      <main className="max-w-md mx-auto p-4 space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
            <History className="w-6 h-6 text-gold-500" /> Previous Orders
          </h2>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70">
            View order details and submit reviews for completed orders
          </p>
        </div>

        {previousOrders.length === 0 ? (
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <History className="w-12 h-12 text-gold-500/40 mx-auto" />
            <p className="text-sm font-semibold text-cafe-600 dark:text-cream-200/60">
              No previous orders found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {previousOrders.map((order) => {
              const isCompleted = order.status === 'COMPLETED';
              const hasReview = Boolean(order.review);

              return (
                <div
                  key={order.id}
                  className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-cafe-100 dark:border-gold-500/10">
                    <div>
                      <span className="font-mono text-sm font-bold text-cafe-900 dark:text-gold-300">
                        {order.kotNumber || 'Order'}
                      </span>
                      <p className="text-[11px] text-cafe-500 dark:text-cream-200/50 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(order.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        isCompleted
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                          : 'bg-red-500/20 text-red-400 border border-red-500/30'
                      }`}
                    >
                      {isCompleted ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {order.status}
                    </span>
                  </div>

                  <div className="bg-cream-50 dark:bg-cafe-950 p-2.5 rounded-xl text-xs space-y-1">
                    {order.items.map((it) => (
                      <div key={it.id} className="flex justify-between text-cafe-800 dark:text-cream-200">
                        <span>{it.menuItemName}</span>
                        <span className="font-mono">x{it.quantity} (Rs.{(it.unitPrice * it.quantity).toFixed(2)})</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-cafe-100 dark:border-gold-500/10 space-y-1 text-xs text-cafe-600 dark:text-cream-200/70">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-mono">Rs.{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST ({order.subtotal > 0 ? Math.round((order.taxAmount / order.subtotal) * 100) : 0}%):</span>
                      <span className="font-mono">Rs.{order.taxAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-cafe-50 dark:border-gold-500/5 space-y-3">
                    <span className="block font-mono text-sm font-bold text-cafe-900 dark:text-gold-300">
                      Total: Rs.{order.totalAmount.toFixed(2)}
                    </span>

                    <div className="flex flex-wrap items-stretch gap-2">
                      {/* Review Badge / Button logic */}
                      {isCompleted && (
                        hasReview ? (
                          <span className="flex-1 min-w-[130px] bg-green-500/10 text-green-400 border border-green-500/30 font-bold px-3 h-9 rounded-xl text-xs inline-flex items-center justify-center gap-1">
                            <MessageSquare className="w-3.5 h-3.5 text-green-400 flex-shrink-0" /> Reviewed ✅
                          </span>
                        ) : (
                          <button
                            onClick={() => handleLeaveReview(order)}
                            className="flex-1 min-w-[130px] bg-gold-500 text-cafe-950 font-bold px-3 h-9 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow hover:bg-gold-600"
                          >
                            <Star className="w-3.5 h-3.5 fill-current text-cafe-950 flex-shrink-0" /> Leave a Review
                          </button>
                        )
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => handleDownloadInvoice(order.id)}
                          disabled={downloadingId !== null}
                          className={`flex-1 min-w-[130px] font-bold px-3 h-9 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow ${
                            downloadingId === order.id
                              ? 'bg-gold-500/50 text-cafe-950/50 cursor-not-allowed'
                              : 'bg-gold-500 hover:bg-gold-600 text-cafe-950'
                          }`}
                        >
                          <FileDown className="w-3.5 h-3.5 flex-shrink-0" />
                          {downloadingId === order.id ? 'Downloading...' : 'Download Invoice'}
                        </button>
                      )}

                      <button
                        onClick={() => handleOrderAgain(order)}
                        className="flex-1 min-w-[130px] bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 border border-gold-500/30 font-bold px-3 h-9 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <RotateCcw className="w-3.5 h-3.5 flex-shrink-0" /> Order Again
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white font-bold px-4 py-2.5 rounded-xl shadow-lg text-xs animate-bounce">
          {toastMsg}
        </div>
      )}

      <CustomerBottomNav />
    </div>
  );
};
