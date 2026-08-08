import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Category, MenuItem, TodaysSpecial } from '../../types';
import { useCart } from '../../context/CartContext';
import { CustomerNavbar } from '../../components/customer/CustomerNavbar';
import { CustomerBottomNav } from '../../components/customer/CustomerBottomNav';
import { CollectionPromptModal } from '../../components/customer/CollectionPromptModal';
import { Search, Plus, Sparkles, Image as ImageIcon, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CustomerMenu: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [todaysSpecials, setTodaysSpecials] = useState<TodaysSpecial[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const { addItem, getItemQuantity, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const [catRes, menuRes, specialRes] = await Promise.all([
          api.get('/categories'),
          api.get('/menu?availableOnly=true'),
          api.get('/todays-specials'),
        ]);

        if (catRes.data.success) setCategories(catRes.data.categories || []);
        if (menuRes.data.success) setMenuItems(menuRes.data.items || []);
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
    fetchMenu();
  }, []);

  const handleAddSpecialToCart = (special: TodaysSpecial) => {
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

  // Filter Logic (Category or Virtual Today's Special Category)
  const filteredItems = menuItems.filter((item) => {
    let matchesCat = true;
    if (selectedCategory !== 'all' && selectedCategory !== 'todays-special') {
      matchesCat = item.categoryId === selectedCategory;
    }

    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-cafe-100 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 pb-28">
      <CustomerNavbar />
      <CollectionPromptModal />

      {/* Sticky Top Header */}
      <div className="sticky top-14 z-20 bg-cafe-100/95 dark:bg-cafe-950/95 backdrop-blur-md border-b border-cafe-200 dark:border-gold-500/10 p-4 space-y-3 shadow-sm max-w-6xl mx-auto w-full px-4 rounded-[20px] mt-4">
        {/* Search Bar */}
        <div className="icon-input-wrap">
          <Search className="icon-input-icon w-4 h-4 text-gold-500" />
          <input
            type="text"
            placeholder="Search idly, dosa, coffee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="icon-input w-full bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/25 rounded-2xl pr-4 text-[13px] text-cafe-900 dark:text-cream-100 placeholder-cafe-400 outline-none focus:border-gold-500 shadow-sm"
          />
        </div>

        {/* Horizontal Category Chips */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shadow-sm ${
              selectedCategory === 'all'
                ? 'bg-gold-500 text-cafe-950 shadow-md scale-105'
                : 'bg-white dark:bg-cafe-900 text-cafe-700 dark:text-cream-200 border border-cafe-200 dark:border-gold-500/10'
            }`}
          >
            All Items
          </button>

          {todaysSpecials.length > 0 && (
            <button
              onClick={() => setSelectedCategory('todays-special')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1 shadow-sm ${
                selectedCategory === 'todays-special'
                  ? 'bg-gold-500 text-cafe-950 shadow-md scale-105'
                  : 'bg-gradient-to-r from-amber-950/20 to-cafe-900 text-gold-300 border border-gold-500/30'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 fill-current animate-pulse" /> Today's Special ⭐
            </button>
          )}

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shadow-sm ${
                selectedCategory === cat.id
                  ? 'bg-gold-500 text-cafe-950 shadow-md scale-105'
                  : 'bg-white dark:bg-cafe-900 text-cafe-700 dark:text-cream-200 border border-cafe-200 dark:border-gold-500/10'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 space-y-4 w-full">
        {/* Category Header Label */}
        <div className="flex justify-between items-center px-1 text-xs text-cafe-500 dark:text-cream-200/60 font-semibold uppercase tracking-wider">
          <span>
            Category:{' '}
            {selectedCategory === 'all'
              ? 'All Menu Items'
              : selectedCategory === 'todays-special'
              ? "Today's Special ⭐"
              : categories.find((c) => c.id === selectedCategory)?.name}
          </span>
          <span className="font-mono text-gold-500 font-bold bg-gold-500/10 px-2 py-0.5 rounded border border-gold-500/20">
            {selectedCategory === 'todays-special' ? todaysSpecials.length : filteredItems.length} Dishes
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 py-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="h-[360px] bg-cafe-200/55 dark:bg-cafe-800/30 rounded-[20px] animate-pulse border border-cafe-200 dark:border-gold-500/10" />
            ))}
          </div>
        ) : selectedCategory === 'todays-special' ? (
          /* Render Independent Today's Specials Category View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todaysSpecials.map((s) => {
              const dummyId = `special-${s.id}`;
              const qtyInCart = getItemQuantity(dummyId);

              return (
                <div
                  key={s.id}
                  className="bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-[20px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[360px]"
                >
                  <div>
                    {/* Image Area */}
                    <div className="w-full h-40 rounded-xl bg-cafe-50 dark:bg-cafe-950 flex items-center justify-center overflow-hidden mb-3 border border-cafe-100 dark:border-gold-500/10 shadow-inner relative">
                      {s.imageUrl ? (
                        <img src={s.imageUrl} alt={s.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-gold-500/30" />
                      )}

                      {/* Today's Special Badge */}
                      <span className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-gold-500 text-cafe-950 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide shadow-md border border-white/40">
                        Specials
                      </span>
                    </div>

                    <h4 className="font-serif font-bold text-sm text-cafe-900 dark:text-cream-100 line-clamp-1">
                      {s.name}
                    </h4>
                    {s.description && (
                      <p className="text-[10px] text-cafe-500 dark:text-cream-200/50 line-clamp-2 mt-1 leading-normal">
                        {s.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-cafe-100 dark:border-gold-500/10">
                    <div>
                      <span className="text-[10px] text-cafe-400 dark:text-cream-200/40 uppercase block font-semibold">Price</span>
                      <span className="font-mono font-bold text-sm text-gold-600 dark:text-gold-400">
                        Rs.{s.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddSpecialToCart(s)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 flex items-center gap-1 h-9 ${
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
        ) : filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[20px] p-12 text-center space-y-3 shadow-sm max-w-md mx-auto my-6">
            <ShoppingBag className="w-12 h-12 text-gold-500/40 mx-auto" />
            <p className="text-xs font-bold text-cafe-500 dark:text-cream-200/60">
              No menu items match your search / category filter.
            </p>
          </div>
        ) : (
          /* High-Density Menu Items Rows responsive columns */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const qtyInCart = getItemQuantity(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/10 rounded-[20px] p-4 shadow-[0_10px_30px_rgba(0,0,0,0.05)] hover:shadow-[0_15px_35px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[360px]"
                >
                  <div>
                    {/* Image Area */}
                    <div className="w-full h-40 rounded-xl bg-cafe-50 dark:bg-cafe-950 flex items-center justify-center overflow-hidden mb-3 border border-cafe-100 dark:border-gold-500/10 shadow-inner relative">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-10 h-10 text-gold-500/30" />
                      )}

                      {/* Popular / Feature tag */}
                      {item.isPopular && (
                        <span className="absolute top-2 right-2 bg-gradient-to-r from-gold-400 to-gold-600 text-cafe-950 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide shadow-md border border-white/40 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Popular
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-bold text-sm text-cafe-900 dark:text-cream-100 line-clamp-1">
                      {item.name}
                    </h4>
                    {item.description && (
                      <p className="text-[10px] text-cafe-500 dark:text-cream-200/50 line-clamp-2 mt-1 leading-normal">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-cafe-100 dark:border-gold-500/10">
                    <div>
                      <span className="text-[10px] text-cafe-400 dark:text-cream-200/40 uppercase block font-semibold">Price</span>
                      <span className="font-mono font-bold text-sm text-gold-600 dark:text-gold-400">
                        Rs.{item.price.toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={() => addItem(item)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all duration-200 flex items-center gap-1 h-9 ${
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
        )}

        {/* Floating Cart Button */}
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
