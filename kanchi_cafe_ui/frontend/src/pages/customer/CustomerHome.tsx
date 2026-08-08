import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomer } from '../../context/CustomerContext';
import { useCart } from '../../context/CartContext';
import { api } from '../../services/api';
import { Category, MenuItem, TodaysSpecial } from '../../types';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { CollectionPromptModal } from '../../components/customer/CollectionPromptModal';
import { Coffee, Flame, Plus, ArrowRight, Clock, Sparkles, Utensils, Image as ImageIcon } from 'lucide-react';

export const CustomerHome: React.FC = () => {
  const { customer, activeOrders, tableNumber } = useCustomer();
  const { addItem, totalItems, getItemQuantity } = useCart();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<Category[]>([]);
  const [todaysSpecials, setTodaysSpecials] = useState<TodaysSpecial[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catRes, menuRes, specialRes] = await Promise.all([
          api.get('/categories'),
          api.get('/menu?availableOnly=true'),
          api.get('/todays-specials'),
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories || []);

        if (menuRes.data.success) {
          const items: MenuItem[] = menuRes.data.items || [];
          setPopularItems(items.filter((i) => i.isPopular).slice(0, 6));
        }

        if (specialRes.data.success) {
          const specials: TodaysSpecial[] = specialRes.data.specials || [];
          setTodaysSpecials(specials.filter((s) => s.isAvailable));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, []);

  const handleAddSpecialToCart = (special: TodaysSpecial) => {
    // Construct dummy MenuItem for cart handling
    const dummyItem: MenuItem = {
      id: `special-${special.id}`,
      name: special.name,
      price: special.price,
      description: special.description,
      categoryId: 'specials',
      imageUrl: special.imageUrl,
      isAvailable: true,
      isPopular: true,
      isCoffeeOrJuice: false,
      sortOrder: 0,
    };
    addItem(dummyItem);
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />
      <CollectionPromptModal />

      <main className="max-w-md mx-auto p-4 space-y-6">
        {/* Welcome Header Banner */}
        <div className="bg-gradient-to-r from-cafe-800 to-cafe-900 border border-gold-500/20 rounded-[22px] p-6 text-cream-100 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <span className="inline-flex items-center gap-1 bg-gold-500/20 text-gold-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold mb-2.5 uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" /> Table {tableNumber || 1}
              </span>
              <h2 className="font-serif text-2xl font-bold text-gold-300">
                Welcome back, {customer?.name || 'Guest'}! 👋
              </h2>
              <p className="text-xs text-cream-200/80 mt-1 font-medium">
                Ready for your favourite coffee today?
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gold-500/20 border border-gold-500/30 flex items-center justify-center text-gold-300 shadow-inner">
              <Coffee className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Active KOT Status Banner */}
        {activeOrders.length > 0 && (
          <div className="bg-gold-500/10 border border-gold-500/30 rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-500/20 text-gold-600 dark:text-gold-400 flex items-center justify-center">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-cafe-900 dark:text-gold-300">
                  {activeOrders.length} Active Order{activeOrders.length > 1 ? 's' : ''}
                </h4>
                <p className="text-xs text-cafe-600 dark:text-cream-200/80">
                  {activeOrders.map((o) => o.kotNumber || 'Payment Pending').join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/active-orders')}
              className="bg-gold-500 hover:bg-gold-600 text-cafe-950 text-xs font-bold py-2 px-3 rounded-xl transition shadow"
            >
              View Status
            </button>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-4 animate-pulse">
            <div className="h-40 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[24px]" />
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-14 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-2xl" />
              <div className="h-14 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-2xl" />
              <div className="h-14 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-2xl" />
              <div className="h-14 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-2xl" />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="h-48 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[20px]" />
              <div className="h-48 bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[20px]" />
            </div>
          </div>
        )}


        {/* Categories Section */}
        {!loading && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-serif text-lg font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-gold-500" /> Menu Categories
            </h3>
            <button
              onClick={() => navigate('/menu')}
              className="text-xs font-bold text-gold-500 hover:underline flex items-center gap-1"
            >
              Browse All <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {categories.length === 0 ? (
            <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-2xl p-6 text-center text-cafe-400 dark:text-cream-200/40 text-xs font-semibold">
              No categories available right now.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => navigate('/menu')}
                  className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 hover:border-gold-500/50 rounded-2xl px-3.5 py-3 text-left shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center justify-between gap-2"
                >
                  <span className="font-bold text-xs text-cafe-900 dark:text-cream-100 leading-snug line-clamp-2">
                    {cat.name}
                  </span>
                  <ArrowRight className="w-4 h-4 text-gold-500 flex-shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Popular House Specials */}
        {!loading && popularItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-serif text-lg font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
            <Flame className="w-5 h-5 text-gold-500" /> Popular Menu Items
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {popularItems.map((item) => {
              const qtyInCart = getItemQuantity(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-[20px] p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ease-out flex flex-col justify-between h-52"
                >
                  {/* Top Section: Image on LEFT, details on RIGHT */}
                  <div className="flex gap-3">
                    <div className="w-16 h-16 rounded-xl bg-cafe-50 dark:bg-cafe-950/40 border border-cafe-100 dark:border-gold-500/10 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-inner">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-7 h-7 text-gold-500/30" />
                      )}
                    </div>
                    <div className="flex flex-col min-w-0 justify-center">
                      <h4 className="font-bold text-xs text-cafe-900 dark:text-cream-100 leading-snug line-clamp-2">
                        {item.name}
                      </h4>
                      <span className="font-sans font-bold text-xs text-gold-600 dark:text-gold-400 mt-1">
                        Rs.{item.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Section: Add button on LEFT */}
                  <div className="flex justify-start mt-2 pt-2.5 border-t border-cafe-100 dark:border-gold-500/10">
                    <button
                      onClick={() => addItem(item)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 flex items-center gap-1 h-9 flex-shrink-0 ${
                        qtyInCart > 0
                          ? 'bg-gold-500 text-cafe-950 font-extrabold ring-2 ring-gold-400'
                          : 'bg-cafe-850 hover:bg-cafe-700 text-gold-300 border border-gold-500/25'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      {qtyInCart > 0 ? `ADDED (${qtyInCart})` : 'ADD'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        )}

        {/* Floating Cart Bar */}
        {totalItems > 0 && (
          <div className="fixed bottom-24 left-4 right-4 z-30 max-w-md mx-auto animate-bounce">
            <button
              onClick={() => navigate('/cart')}
              className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3.5 px-5 rounded-2xl shadow-2xl flex items-center justify-between transition"
            >
              <span className="bg-cafe-950 text-gold-300 text-xs px-2.5 py-1 rounded-lg">
                {totalItems} Item{totalItems > 1 ? 's' : ''}
              </span>
              <span>View Cart & Proceed</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </main>

      <CustomerBottomNav />
    </div>
  );
};
