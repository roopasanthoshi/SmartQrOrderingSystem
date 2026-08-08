import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { api } from '../../services/api';
import { Coffee, Phone, User, ArrowRight, Sparkles } from 'lucide-react';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';

export const TableLanding: React.FC = () => {
  const { tableNumber: urlTableNum } = useParams<{ tableNumber: string }>();
  const { setTableNumber, setCustomerInfo, customer, activeOrders } = useCustomer();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [isExistingChecked, setIsExistingChecked] = useState(false);
  const [needName, setNeedName] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlTableNum && !isNaN(Number(urlTableNum))) {
      setTableNumber(Number(urlTableNum));
    }
  }, [urlTableNum]);

  // Handle mobile submit
  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!mobile || mobile.trim().length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/identify', { mobile: mobile.trim() });
      if (res.data.success) {
        if (res.data.exists && res.data.customer) {
          setCustomerInfo(res.data.customer);
          setIsExistingChecked(true);
        } else {
          // New customer needs name
          setNeedName(true);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify mobile');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterNewCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/customer/identify', {
        mobile: mobile.trim(),
        name: name.trim(),
      });

      if (res.data.success && res.data.customer) {
        setCustomerInfo(res.data.customer);
        navigate('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cafe-100 via-white to-cafe-100 dark:from-cafe-950 dark:via-cafe-900 dark:to-cafe-950 text-cafe-900 dark:text-cream-100 flex flex-col justify-between transition-colors duration-300">
      <CustomerNavbar />

      <main className="flex-1 max-w-md mx-auto w-full p-6 flex flex-col justify-center">
        {/* Welcome Card Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gold-500/15 border-2 border-gold-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-gold-600 dark:text-gold-300 shadow-lg">
            <Coffee className="w-10 h-10" />
          </div>
          <h2 className="font-serif text-3xl font-bold text-cafe-900 dark:text-gold-300 mb-1">
            Welcome to Kanchi Cafe
          </h2>
          <p className="text-xs text-cafe-600 dark:text-cream-200/80 font-medium">
            Authentic South Indian Cuisine & Fresh Coffee
          </p>

          {/* Info Badges Grid */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            <span className="inline-flex items-center gap-1 bg-cafe-200/50 dark:bg-cafe-800/40 text-cafe-800 dark:text-cream-100 text-[10px] px-2.5 py-1 rounded-full font-bold">
              📍 Nagole, Hyderabad
            </span>
            <span className="inline-flex items-center gap-1 bg-gold-500/10 text-gold-700 dark:text-gold-300 text-[10px] px-2.5 py-1 rounded-full font-bold border border-gold-500/20">
              ⭐ Premium Cafe
            </span>
            <span className="inline-flex items-center gap-1 bg-green-500/10 text-green-700 dark:text-green-400 text-[10px] px-2.5 py-1 rounded-full font-bold border border-green-500/20">
              🕘 Open Today
            </span>
          </div>

          <p className="text-xs text-cafe-500 dark:text-cream-200/60 mt-4 font-medium">
            Scanning Table <strong className="text-gold-600 dark:text-gold-400 font-extrabold">{urlTableNum || '1'}</strong>. Let's register to start ordering.
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[24px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.08)] space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs py-3 px-4 rounded-xl font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Screen 1: Welcome Back (If Customer already identified) */}
          {isExistingChecked && customer ? (
            <div className="text-center space-y-5">
              <div className="inline-flex items-center gap-1.5 bg-gold-500/15 text-gold-700 dark:text-gold-300 px-3 py-1 rounded-full text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" /> Welcome Back!
              </div>
              <h3 className="font-serif text-2xl font-bold text-cafe-900 dark:text-cream-100">
                Hello, {customer.name}!
              </h3>
              <p className="text-xs text-cafe-600 dark:text-cream-200/70">
                Mobile: {customer.mobile} | Visits: {customer.totalVisits}
              </p>

              {activeOrders.length > 0 && (
                <div className="bg-gold-500/5 border border-gold-500/20 p-4 rounded-2xl text-left text-xs space-y-1.5">
                  <span className="text-gold-600 dark:text-gold-400 font-bold">Active Orders ({activeOrders.length}):</span>
                  {activeOrders.map((o) => (
                    <div key={o.id} className="flex justify-between text-cafe-800 dark:text-cream-200 font-medium">
                      <span>{o.kotNumber}</span>
                      <span className="font-mono text-gold-600 dark:text-gold-400 font-bold">Rs.{o.totalAmount}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-3 pt-2">
                {activeOrders.length > 0 && (
                  <button
                    onClick={() => navigate('/active-orders')}
                    className="w-full bg-cafe-50 hover:bg-cafe-100 text-cafe-800 border border-cafe-200 dark:bg-cafe-800 dark:hover:bg-cafe-700 dark:text-gold-300 dark:border-gold-500/30 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 text-xs"
                  >
                    View Current Orders ({activeOrders.length})
                  </button>
                )}
                <button
                  onClick={() => navigate('/menu')}
                  className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
                >
                  Order More <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : needName ? (
            /* Screen 2: Ask Name for new mobile */
            <form onSubmit={handleRegisterNewCustomer} className="space-y-4">
              <div className="text-center mb-2">
                <h3 className="font-serif text-xl font-bold text-cafe-900 dark:text-gold-300">
                  New Customer
                </h3>
                <p className="text-xs text-cafe-500 dark:text-cream-200/70">
                  Please enter your name to personalize your order.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-cafe-700 dark:text-gold-300 tracking-wide">
                  Mobile Number
                </label>
                <input
                  type="text"
                  disabled
                  value={mobile}
                  className="w-full bg-cafe-50 border border-cafe-200 dark:bg-cafe-950 dark:border-gold-500/20 rounded-xl px-4 text-cafe-500 dark:text-cream-200/60 text-sm font-mono cursor-not-allowed !h-11"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-cafe-700 dark:text-gold-300 tracking-wide">
                  Full Name *
                </label>
                <div className="icon-input-wrap">
                  <User className="icon-input-icon w-4 h-4 text-gold-500" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="login-input icon-input w-full bg-white border border-cafe-200 rounded-xl pr-4 text-cafe-900 placeholder-cafe-400 dark:bg-cafe-950 dark:border-gold-500/30 dark:text-cream-100 dark:placeholder-cream-200/50 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 !pl-12 !h-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 mt-4 text-xs"
              >
                {loading ? 'Saving...' : 'Start Ordering'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            /* Screen 3: Ask Mobile */
            <form onSubmit={handleCheckMobile} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-semibold text-cafe-700 dark:text-gold-300 tracking-wide">
                  Mobile Number *
                </label>
                <div className="icon-input-wrap">
                  <Phone className="icon-input-icon w-4 h-4 text-gold-500" />
                  <input
                    type="tel"
                    maxLength={10}
                    required
                    placeholder="Enter 10-digit Mobile"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                    className="login-input icon-input w-full bg-white border border-cafe-200 rounded-xl pr-4 text-cafe-900 font-mono tracking-wider placeholder-cafe-400 dark:bg-cafe-950 dark:border-gold-500/30 dark:text-cream-100 dark:placeholder-cream-200/50 text-sm outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 !pl-12 !h-11"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs"
              >
                {loading ? 'Verifying...' : 'Continue'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Under-button features checklist */}
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-cafe-100 dark:border-gold-500/10 text-[10px] text-cafe-500 dark:text-cream-200/60 font-semibold">
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">✓ Secure Login</div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">✓ One Tap Ordering</div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">✓ GST Billing</div>
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400">✓ Fast Checkout</div>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-cafe-500 dark:text-cream-200/40 border-t border-cafe-100/50 dark:border-gold-500/5">
        © Kanchi Cafe POS System • Alkapuri Chourasta, Nagole
      </footer>
    </div>
  );
};
