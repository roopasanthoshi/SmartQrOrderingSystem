import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Order, Review } from '../../types';
import {
  ShoppingBag,
  IndianRupee,
  Clock,
  CheckSquare,
  Star,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    todayOrders: 0,
    todayRevenue: 0,
    pendingApprovals: 0,
    activeOrders: 0,
    totalReviews: 0,
    avgRating: 5.0,
  });

  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [pendingPayments, setPendingPayments] = useState<Order[]>([]);
  const [recentReviews, setRecentReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/dashboard/stats');
      if (res.data.success) {
        setStats({
          todayOrders: res.data.stats.todayOrders,
          todayRevenue: res.data.stats.todayRevenue,
          pendingApprovals: res.data.stats.pendingApprovals,
          activeOrders: res.data.stats.activeOrders,
          totalReviews: res.data.stats.totalReviews,
          avgRating: res.data.stats.avgRating,
        });
        setRecentOrders(res.data.recentOrders || []);
        setPendingPayments(res.data.pendingPayments || []);
        setRecentReviews(res.data.recentReviews || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    {
      title: "Today's Orders",
      value: stats.todayOrders,
      subtitle: 'Total completed & active',
      icon: ShoppingBag,
      action: () => navigate('/admin/orders'),
    },
    {
      title: "Today's Revenue",
      value: `Rs.${stats.todayRevenue.toFixed(2)}`,
      subtitle: 'Verified UPI earnings',
      icon: IndianRupee,
      action: () => navigate('/admin/reports'),
    },
    {
      title: 'Pending Approvals',
      value: stats.pendingApprovals,
      subtitle: 'Awaiting UPI verification',
      icon: CheckSquare,
      action: () => navigate('/admin/approvals'),
    },
    {
      title: 'Active KOT Orders',
      value: stats.activeOrders,
      subtitle: 'Kitchen & bar processing',
      icon: Clock,
      action: () => navigate('/admin/orders'),
    },
    {
      title: 'Customer Reviews',
      value: stats.totalReviews,
      subtitle: '5-star feedback entries',
      icon: Star,
      action: () => navigate('/admin/reviews'),
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Welcome Title */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-[28px] font-bold text-[#3E2A1F] leading-tight">
            Cafe POS Dashboard
          </h1>
          <p className="text-[15px] font-medium text-[#666666]">
            Real-time overview of Kanchi Cafe POS operations
          </p>
        </div>
        <span className="text-[12px] font-bold bg-[#C89B3C]/10 text-[#C89B3C] dark:text-gold-300 px-4 py-2 rounded-xl border border-[#C89B3C]/30 tracking-wider uppercase">
          Live Updates Active
        </span>
      </div>

      {/* Minimal 5 Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {cards.map((c, i) => {
          const Icon = c.icon;
          return (
            <button
              key={i}
              onClick={c.action}
              className="bg-white dark:bg-cafe-900 border border-[#E9E2D7] dark:border-gold-500/10 rounded-[20px] p-5 text-left shadow-[0_10px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.07)] hover:-translate-y-0.5 transition-all duration-150 flex flex-col justify-between h-[140px] w-full"
            >
              <div className="flex justify-between items-start w-full gap-4">
                <span className="text-[14px] font-semibold text-[#666666] dark:text-cream-200/50 leading-tight block">{c.title}</span>
                <div className="w-10 h-10 rounded-xl bg-[#C89B3C]/10 dark:bg-[#C89B3C]/20 flex items-center justify-center text-[#C89B3C] dark:text-gold-300 flex-shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-auto">
                <span className="font-mono text-[30px] font-bold text-[#222222] dark:text-gold-300 leading-none block">{c.value}</span>
                <span className="text-[14px] text-[#666666] dark:text-cream-200/50 block mt-1 leading-none">{c.subtitle}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Grid Below: Recent Orders & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-2">
        {/* Pending Approval Requests */}
        <div className="bg-white dark:bg-cafe-900 border border-[#E9E2D7] dark:border-gold-500/15 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-[#E9E2D7] dark:border-gold-500/10">
            <h3 className="text-[20px] font-bold text-[#3E2A1F] dark:text-gold-300 flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-amber-500" /> Pending Verification ({pendingPayments.length})
            </h3>
            <button
              onClick={() => navigate('/admin/approvals')}
              className="text-[14px] text-[#C89B3C] hover:underline flex items-center gap-1 font-bold transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {pendingPayments.length === 0 ? (
            <p className="text-[14px] text-center py-10 text-[#666666] dark:text-cream-200/50 font-medium">
              No pending payment approvals at the moment.
            </p>
          ) : (
            <div className="space-y-4">
              {pendingPayments.map((o) => (
                <div
                  key={o.id}
                  className="bg-[#F8F6F2]/40 dark:bg-cafe-950/40 p-5 rounded-xl border border-[#E9E2D7] dark:border-gold-500/10 flex items-center justify-between transition duration-150 hover:bg-[#F8F6F2] h-20"
                >
                  <div className="space-y-1 flex-1 pr-4">
                    <span className="font-mono font-bold text-[#C89B3C] text-[14px]">{o.kotNumber}</span>
                    <p className="text-[#222222] dark:text-cream-100 font-bold text-[14px] truncate">
                      Table {o.table?.tableNumber} • {o.customer?.name}
                    </p>
                    <p className="text-[14px] text-[#666666] dark:text-cream-200/50 font-semibold font-mono leading-none">
                      +91 {o.customer?.mobile}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="font-mono font-bold text-[16px] text-[#222222] dark:text-gold-300">
                      Rs.{o.totalAmount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => navigate('/admin/approvals')}
                      className="bg-[#C89B3C] hover:bg-[#B5872E] text-[#3E2A1F] px-4 rounded-xl text-[14px] font-bold shadow-sm transition h-10 flex items-center justify-center"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent KOT Orders Feed */}
        <div className="bg-white dark:bg-cafe-900 border border-[#E9E2D7] dark:border-gold-500/15 rounded-[20px] p-6 shadow-[0_10px_30px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-[#E9E2D7] dark:border-gold-500/10">
            <h3 className="text-[20px] font-bold text-[#3E2A1F] dark:text-gold-300 flex items-center gap-3">
              <TrendingUp className="w-6 h-6 text-[#C89B3C]" /> Recent KOT Orders
            </h3>
            <button
              onClick={() => navigate('/admin/orders')}
              className="text-[14px] text-[#C89B3C] hover:underline flex items-center gap-1 font-bold transition-colors"
            >
              View All <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {recentOrders.map((o) => (
              <div
                key={o.id}
                className="bg-[#F8F6F2]/40 dark:bg-cafe-950/40 p-5 rounded-xl border border-[#E9E2D7] dark:border-gold-500/10 flex items-center justify-between transition duration-150 hover:bg-[#F8F6F2] h-20"
              >
                <div className="space-y-1 flex-1 pr-4">
                  <span className="font-mono font-bold text-[#222222] dark:text-gold-300 text-[14px]">{o.kotNumber}</span>
                  <p className="text-[#222222] dark:text-cream-100 font-bold text-[14px] truncate">
                    Table {o.table?.tableNumber} • {o.items.length} items
                  </p>
                </div>
                <div className="text-right space-y-1 flex-shrink-0">
                  <span className="font-mono font-bold text-[#C89B3C] text-[16px] block">
                    Rs.{o.totalAmount.toFixed(2)}
                  </span>
                  <span className="inline-block text-[12px] uppercase font-bold px-3 py-0.5 rounded-full bg-[#C89B3C]/10 text-[#C89B3C] dark:text-gold-300 border border-[#C89B3C]/20 leading-none">
                    {o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
