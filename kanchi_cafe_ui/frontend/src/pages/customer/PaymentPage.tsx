import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { QrCode, CheckCircle2, ArrowRight, Copy, Camera, ShieldCheck, Hourglass, Smartphone, Monitor } from 'lucide-react';
import { Order } from '../../types';

export const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { cafeSettings } = useAuth();
  const { clearCart } = useCart();
  const { refreshOrders } = useCustomer();

  const [order, setOrder] = useState<Order | null>(location.state?.order || null);
  const [claiming, setClaiming] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
      setIsMobile(mobileRegex.test(userAgent.toLowerCase()));
    };
    checkMobile();
  }, []);

  const upiId = cafeSettings?.upiId || '8978882601@ybl';
  const cafeName = cafeSettings?.name || 'Kanchi Cafe';
  const amount = order ? order.totalAmount : 0;

  // Standardized UPI deep link
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(cafeName)}&am=${amount.toFixed(2)}&tn=KanchiCafeOrder&cu=INR`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiDeepLink;
  };

  const handleClaimPaid = async () => {
    if (!order) return;
    setClaiming(true);

    try {
      const res = await api.post(`/orders/${order.id}/pay-claimed`, {
        paymentRef: `UPI-${Date.now().toString().slice(-6)}`,
      });

      if (res.data.success) {
        clearCart();
        await refreshOrders();
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Payment claim error:', err);
    } finally {
      setClaiming(false);
    }
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 flex flex-col">
        <CustomerNavbar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-[20px] p-8 text-center space-y-4 shadow-sm max-w-sm w-full">
            <div className="w-14 h-14 rounded-full bg-gold-500/15 text-gold-500 flex items-center justify-center mx-auto">
              <QrCode className="w-7 h-7" />
            </div>
            <p className="text-sm font-semibold text-cafe-600 dark:text-cream-200/70">
              No active payment order found
            </p>
            <button
              onClick={() => navigate('/menu')}
              className="bg-gold-500 hover:bg-gold-600 text-cafe-950 px-5 py-2.5 rounded-xl text-xs font-bold shadow transition"
            >
              Go to Menu
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
        {submitted ? (
          /* Post Submission Screen: Payment Submitted - Waiting for Cafe Approval */
          <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-8 shadow-2xl text-center space-y-4 my-6">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-500 dark:text-amber-400 border border-amber-500/40 rounded-full flex items-center justify-center mx-auto">
              <Hourglass className="w-10 h-10 animate-spin" />
            </div>

            <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300">
              Payment Submitted
            </h2>

            <p className="text-sm text-cafe-600 dark:text-cream-200/90 font-semibold">
              Waiting for Cafe Approval
            </p>

            <div className="bg-cafe-50 dark:bg-cafe-950/80 p-4 rounded-2xl border border-cafe-200 dark:border-gold-500/10 text-xs space-y-1 text-cafe-600 dark:text-cream-200/70">
              <p>Your payment notification has been sent to Kanchi Cafe Admin.</p>
              <p className="text-gold-600 dark:text-gold-400 font-bold mt-2">
                Please wait... KOT number will be assigned as soon as payment is verified.
              </p>
            </div>

            <button
              onClick={() => navigate('/active-orders')}
              className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-2xl shadow transition text-xs flex items-center justify-center gap-2"
            >
              View Order Status <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          /* UPI Payment View */
          <>
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 bg-gold-500/20 text-gold-400 border border-gold-500/30 px-3 py-1 rounded-full text-xs font-bold mb-2">
                <Camera className="w-3.5 h-3.5" /> Table UPI QR Payment
              </span>
              <h2 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300">
                {isMobile ? 'Pay via Installed UPI App' : 'Scan & Pay via Any UPI App'}
              </h2>
              {order && order.taxAmount > 0 ? (
                <div className="text-xs text-cafe-600 dark:text-cream-200/70 mt-1 space-y-0.5">
                  <p>Subtotal: Rs.{order.subtotal.toFixed(2)} | GST ({Math.round((order.taxAmount / order.subtotal) * 100)}%): Rs.{order.taxAmount.toFixed(2)}</p>
                  <p>Total Bill Amount: <strong className="font-mono text-gold-500 text-sm">Rs.{amount.toFixed(2)}</strong></p>
                </div>
              ) : (
                <p className="text-xs text-cafe-600 dark:text-cream-200/70 mt-1">
                  Total Bill Amount: <strong className="font-mono text-gold-500 text-sm">Rs.{amount.toFixed(2)}</strong>
                </p>
              )}
            </div>

            {/* QR & UPI App Card */}
            <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 shadow-2xl text-center space-y-4">
              {/* QR Code display */}
              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner border border-cafe-200">
                <QRCodeSVG value={upiDeepLink} size={190} level="H" includeMargin={true} />
              </div>

              {/* UPI ID Row */}
              <div className="bg-cafe-50 dark:bg-cafe-950 p-3 rounded-2xl border border-cafe-200 dark:border-gold-500/20 flex items-center justify-between">
                <div className="text-left">
                  <p className="text-[10px] text-cafe-500 dark:text-cream-200/50 font-semibold uppercase">UPI ID</p>
                  <p className="font-mono text-xs font-bold text-gold-600 dark:text-gold-400">{upiId}</p>
                </div>
                <button
                  onClick={handleCopyUpi}
                  className="bg-gold-500/20 hover:bg-gold-500/30 text-gold-400 p-2 rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {/* Mobile UPI Launcher Button */}
              {isMobile ? (
                <button
                  onClick={handleOpenUpiApp}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Smartphone className="w-4 h-4" /> Open GPay / PhonePe / Paytm App
                </button>
              ) : (
                <div className="text-[11px] text-cafe-500 dark:text-cream-200/60 flex items-center justify-center gap-1 font-semibold">
                  <Monitor className="w-3.5 h-3.5 text-gold-500" /> Desktop View: Scan QR above using GPay, PhonePe, or Paytm
                </div>
              )}
            </div>

            {/* Payment Process Instructions */}
            <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm text-xs space-y-2">
              <h4 className="font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold-500" /> Instructions:
              </h4>
              <ol className="list-decimal list-inside text-cafe-600 dark:text-cream-200/70 space-y-1">
                <li>Complete payment of <strong>Rs.{amount.toFixed(2)}</strong> via GPay, PhonePe, Paytm, or BHIM.</li>
                <li>After payment, click <strong>"I've Paid"</strong> below.</li>
              </ol>
            </div>

            {/* Customer Action Button: I've Paid */}
            <div className="pt-2">
              <button
                onClick={handleClaimPaid}
                disabled={claiming}
                className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-4 px-5 rounded-2xl shadow-xl flex items-center justify-center gap-2 text-base transition"
              >
                {claiming ? (
                  'Submitting Payment...'
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-cafe-950" />
                    I've Paid (Submit for Cafe Approval)
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </main>

      <CustomerBottomNav />
    </div>
  );
};
