import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Category, MenuItem, TodaysSpecial } from '../../types';
import {
  Utensils,
  Plus,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Coffee,
  Search,
  Printer,
  Image as ImageIcon,
  X,
} from 'lucide-react';

export const MenuManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [todaysSpecials, setTodaysSpecials] = useState<TodaysSpecial[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [isSpecialModalOpen, setIsSpecialModalOpen] = useState(false);

  // Category form state
  const [catName, setCatName] = useState('');
  const [catOrder, setCatOrder] = useState(0);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Menu Item form state
  const [itemForm, setItemForm] = useState({
    id: '',
    name: '',
    description: '',
    price: 0,
    categoryId: '',
    imageUrl: '',
    isAvailable: true,
    isPopular: false,
    isCoffeeOrJuice: false,
  });

  // Independent Today's Special form state
  const [specialForm, setSpecialForm] = useState({
    id: '',
    name: '',
    price: 0,
    description: '',
    imageUrl: '',
    isAvailable: true,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [catRes, menuRes, specialRes] = await Promise.all([
        api.get('/categories'),
        api.get('/menu'),
        api.get('/todays-specials'),
      ]);

      if (catRes.data.success) setCategories(catRes.data.categories || []);
      if (menuRes.data.success) setMenuItems(menuRes.data.items || []);
      if (specialRes.data.success) setTodaysSpecials(specialRes.data.specials || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Category Handlers ---
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCatId) {
        await api.put(`/categories/${editingCatId}`, { name: catName, sortOrder: catOrder });
      } else {
        await api.post('/categories', { name: catName, sortOrder: catOrder });
      }
      setIsCatModalOpen(false);
      setCatName('');
      setEditingCatId(null);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Delete category? All items inside will be affected.')) return;
    try {
      await api.delete(`/categories/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Menu Item Handlers ---
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File is too large. Max size is 5MB.');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setUploading(true);
    try {
      const res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (res.data.success && res.data.imageUrl) {
        setItemForm((prev) => ({ ...prev, imageUrl: res.data.imageUrl }));
      } else {
        alert(res.data.message || 'Failed to upload image');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (itemForm.id) {
        await api.put(`/menu/${itemForm.id}`, itemForm);
      } else {
        await api.post('/menu', itemForm);
      }
      setIsItemModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu item');
    }
  };

  const handleToggleAvailability = async (id: string) => {
    try {
      await api.patch(`/menu/${id}/toggle-availability`);
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleDeleteMenuItem = async (id: string) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/menu/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // --- Independent Today's Special Handlers ---
  const handleSaveSpecial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (specialForm.id) {
        await api.put(`/todays-specials/${specialForm.id}`, specialForm);
      } else {
        await api.post('/todays-specials', specialForm);
      }
      setIsSpecialModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Failed to save Today's Special");
    }
  };

  const handleDeleteSpecial = async (id: string) => {
    if (!window.confirm("Remove this Today's Special?")) return;
    try {
      await api.delete(`/todays-specials/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleSpecialAvailability = async (id: string) => {
    try {
      await api.patch(`/todays-specials/${id}/toggle-availability`);
      fetchData();
    } catch (err: any) {
      console.error(err);
    }
  };

  const openAddSpecialModal = () => {
    setSpecialForm({
      id: '',
      name: '',
      price: 149,
      description: '',
      imageUrl: '',
      isAvailable: true,
    });
    setIsSpecialModalOpen(true);
  };

  const openEditSpecialModal = (s: TodaysSpecial) => {
    setSpecialForm({
      id: s.id,
      name: s.name,
      price: s.price,
      description: s.description || '',
      imageUrl: s.imageUrl || '',
      isAvailable: s.isAvailable,
    });
    setIsSpecialModalOpen(true);
  };

  const openAddItemModal = () => {
    setItemForm({
      id: '',
      name: '',
      description: '',
      price: 50,
      categoryId: categories[0]?.id || '',
      imageUrl: '',
      isAvailable: true,
      isPopular: false,
      isCoffeeOrJuice: false,
    });
    setIsItemModalOpen(true);
  };

  const openEditItemModal = (item: MenuItem) => {
    setItemForm({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      categoryId: item.categoryId,
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable,
      isPopular: item.isPopular,
      isCoffeeOrJuice: item.isCoffeeOrJuice,
    });
    setIsItemModalOpen(true);
  };

  // Filtered Menu Items for Table View
  const filteredMenuItems = menuItems.filter((item) => {
    const matchesCat = selectedCatId === 'all' || item.categoryId === selectedCatId;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
            <Utensils className="w-6 h-6 text-gold-500" /> Menu & Today's Specials Management
          </h1>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70">
            Independent Today's Specials creator and commercial table view menu editor
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCatName('');
              setEditingCatId(null);
              setIsCatModalOpen(true);
            }}
            className="bg-cafe-800 hover:bg-cafe-700 text-gold-300 border border-gold-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" /> Add Category
          </button>
          <button
            onClick={openAddItemModal}
            className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition shadow"
          >
            <Plus className="w-4 h-4" /> Add Menu Item
          </button>
        </div>
      </div>

      {/* 1. INDEPENDENT TODAY'S SPECIALS SECTION */}
      <div className="bg-gradient-to-r from-cafe-900 via-cafe-900 to-amber-950/80 border-2 border-gold-500/40 rounded-3xl p-5 text-cream-100 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gold-500/20">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center">
              <Sparkles className="w-5 h-5 fill-current animate-pulse" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-gold-300">
                Today's Specials (Independent Collection)
              </h3>
              <p className="text-xs text-cream-200/70">
                Create new independent daily specials (e.g. Sunday Combo, Special Mini Meals) without picking from normal menu
              </p>
            </div>
          </div>

          <button
            onClick={openAddSpecialModal}
            className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Plus className="w-4 h-4" /> Add Today's Special
          </button>
        </div>

        {todaysSpecials.length === 0 ? (
          <p className="text-xs text-cream-200/50 italic py-2">
            No Today's Specials created yet. Click "+ Add Today's Special" to create independent specials.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {todaysSpecials.map((s) => (
              <div
                key={s.id}
                className="bg-cafe-950/90 border border-gold-500/30 p-3.5 rounded-2xl flex items-center justify-between gap-3 shadow-inner"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="text-gold-400 font-bold text-lg">⭐</span>
                  <div className="truncate">
                    <h5 className="font-bold text-xs text-cream-100 truncate">{s.name}</h5>
                    {s.description && (
                      <p className="text-[11px] text-cream-200/60 truncate">{s.description}</p>
                    )}
                    <p className="font-mono text-xs font-bold text-gold-400 mt-0.5">Rs.{s.price.toFixed(2)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => openEditSpecialModal(s)}
                    className="p-1.5 bg-gold-500/20 text-gold-400 rounded-lg hover:bg-gold-500/30 transition"
                    title="Edit Special"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteSpecial(s.id)}
                    className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition"
                    title="Delete Special"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Search & Category Filters Bar */}
      <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="icon-input-wrap">
          <Search className="icon-input-icon w-4 h-4 text-gold-500" />
          <input
            type="text"
            placeholder="Search menu items by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="icon-input w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl pr-4 text-xs text-cafe-900 dark:text-cream-100 placeholder-cafe-400 dark:placeholder-cream-200/40 outline-none focus:border-gold-500"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setSelectedCatId('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              selectedCatId === 'all'
                ? 'bg-gold-500 text-cafe-950 shadow'
                : 'bg-cream-100 dark:bg-cafe-950 text-cafe-700 dark:text-cream-200 border border-cafe-200 dark:border-gold-500/20'
            }`}
          >
            [ All ({menuItems.length}) ]
          </button>
          {categories.map((cat) => {
            const count = menuItems.filter((i) => i.categoryId === cat.id).length;
            return (
              <div key={cat.id} className="flex items-center gap-1">
                <button
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCatId === cat.id
                      ? 'bg-gold-500 text-cafe-950 shadow'
                      : 'bg-cream-100 dark:bg-cafe-950 text-cafe-700 dark:text-cream-200 border border-cafe-200 dark:border-gold-500/20'
                  }`}
                >
                  [ {cat.name} ({count}) ]
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. MENU LIST TABLE VIEW */}
      <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-4 shadow-md space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-cafe-100 dark:border-gold-500/10 text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">
          <span>Displaying {filteredMenuItems.length} Menu Items</span>
          {selectedCatId !== 'all' && (
            <span className="text-gold-500 font-bold">
              Filtered by Category: {categories.find((c) => c.id === selectedCatId)?.name}
            </span>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-gold-400 font-mono text-xs animate-pulse">
            Loading Menu List Table...
          </div>
        ) : filteredMenuItems.length === 0 ? (
          <div className="py-12 text-center text-cafe-500 dark:text-cream-200/50 text-xs">
            No items found in this category / search query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-cream-100 dark:bg-cafe-950 text-gold-500 font-bold uppercase text-[10px] border-b border-gold-500/20">
                <tr>
                  <th className="p-3 rounded-l-xl">Image</th>
                  <th className="p-3">Item Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price</th>
                  <th className="p-3">Printer</th>
                  <th className="p-3 text-center">Available</th>
                  <th className="p-3 text-right rounded-r-xl">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 dark:divide-gold-500/10">
                {filteredMenuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-50 dark:hover:bg-cafe-800/40 transition">
                    <td className="p-3">
                      {item.imageUrl ? (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-10 h-10 object-cover rounded-xl border border-cafe-200 dark:border-gold-500/20"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-cafe-100 dark:bg-cafe-950 text-cafe-400 dark:text-cream-200/40 flex items-center justify-center border border-cafe-200 dark:border-gold-500/10">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>

                    <td className="p-3">
                      <h4 className="font-bold text-cafe-900 dark:text-cream-100">
                        {item.name}
                      </h4>
                      {item.description && (
                        <p className="text-[11px] text-cafe-500 dark:text-cream-200/50 line-clamp-1">
                          {item.description}
                        </p>
                      )}
                    </td>

                    <td className="p-3 font-semibold text-cafe-700 dark:text-cream-200">
                      {item.category?.name || 'Category'}
                    </td>

                    <td className="p-3 font-mono font-bold text-gold-600 dark:text-gold-400">
                      Rs.{item.price.toFixed(2)}
                    </td>

                    <td className="p-3">
                      {item.isCoffeeOrJuice ? (
                        <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                          <Coffee className="w-3 h-3" /> Beverage Bar
                        </span>
                      ) : (
                        <span className="bg-cafe-100 dark:bg-cafe-800 text-cafe-700 dark:text-cream-200 border border-cafe-200 dark:border-gold-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold inline-flex items-center gap-1">
                          <Printer className="w-3 h-3 text-gold-500" /> Kitchen
                        </span>
                      )}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleToggleAvailability(item.id)}
                        className={`inline-flex items-center gap-1 font-bold px-2.5 py-1 rounded-xl text-[11px] transition ${
                          item.isAvailable
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {item.isAvailable ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4 text-red-400" />}
                        <span>{item.isAvailable ? 'YES' : 'NO'}</span>
                      </button>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditItemModal(item)}
                          className="p-1.5 bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 rounded-lg transition"
                          title="Edit Item"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMenuItem(item.id)}
                          className="p-1.5 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg transition"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Independent Today's Special Modal */}
      {isSpecialModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 max-w-md w-full text-cream-100 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gold-500/20">
              <h3 className="font-serif text-lg font-bold text-gold-300">
                {specialForm.id ? "Edit Today's Special" : "Create Today's Special"}
              </h3>
              <button onClick={() => setIsSpecialModalOpen(false)} className="text-cream-200/70 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSpecial} className="space-y-3 text-xs">
              <div>
                <label className="block text-gold-300 font-semibold mb-1">Special Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunday Combo, Special Mini Meals"
                  value={specialForm.name}
                  onChange={(e) => setSpecialForm({ ...specialForm, name: e.target.value })}
                  className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gold-300 font-semibold mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={specialForm.price}
                    onChange={(e) => setSpecialForm({ ...specialForm, price: Number(e.target.value) })}
                    className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gold-300 font-semibold mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={specialForm.imageUrl}
                    onChange={(e) => setSpecialForm({ ...specialForm, imageUrl: e.target.value })}
                    className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gold-300 font-semibold mb-1">Description (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Includes Sambar rice, curd rice, puri, vada & dessert"
                  value={specialForm.description}
                  onChange={(e) => setSpecialForm({ ...specialForm, description: e.target.value })}
                  className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={specialForm.isAvailable}
                    onChange={(e) => setSpecialForm({ ...specialForm, isAvailable: e.target.checked })}
                    className="accent-gold-500 w-4 h-4"
                  />
                  <span className="font-semibold text-gold-300">Available Today</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSpecialModalOpen(false)}
                  className="bg-cafe-800 text-cream-200 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 text-cafe-950 font-bold py-2.5 rounded-xl shadow"
                >
                  Save Special
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 max-w-sm w-full text-cream-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-gold-300">
              {editingCatId ? 'Edit Category' : 'Create New Category'}
            </h3>
            <form onSubmit={handleSaveCategory} className="space-y-4 text-xs">
              <div>
                <label className="block text-gold-300 font-semibold mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IDLY SECTION"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="bg-cafe-800 text-cream-200 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 text-cafe-950 font-bold py-2.5 rounded-xl shadow"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Menu Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 max-w-md w-full text-cream-100 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif text-lg font-bold text-gold-300">
              {itemForm.id ? 'Edit Menu Item' : 'Create Menu Item'}
            </h3>

            <form onSubmit={handleSaveMenuItem} className="space-y-3 text-xs">
              <div>
                <label className="block text-gold-300 font-semibold mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ghee Podi Idly"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-gold-300 font-semibold mb-1">Category *</label>
                <select
                  required
                  value={itemForm.categoryId}
                  onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                  className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gold-300 font-semibold mb-1">Price (Rs.) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                    className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-gold-300 font-semibold mb-1">Image URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={itemForm.imageUrl}
                    onChange={(e) => setItemForm({ ...itemForm, imageUrl: e.target.value })}
                    className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none"
                  />
                  <div className="mt-2">
                    <label className="block text-gold-300 font-semibold mb-1">Or Upload Image File</label>
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/jpg, image/webp"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-1.5 text-cream-100 outline-none text-xs cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-gold-500 file:text-cafe-950 hover:file:bg-gold-600 disabled:opacity-50"
                    />
                    {uploading && (
                      <span className="text-[10px] text-gold-400 mt-1 block">Uploading image...</span>
                    )}
                    {itemForm.imageUrl && !uploading && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-[10px] text-cream-200/60">Preview:</span>
                        <img
                          src={itemForm.imageUrl}
                          alt="Preview"
                          className="w-10 h-10 rounded-lg object-cover border border-gold-500/30"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-gold-500/10">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isCoffeeOrJuice}
                    onChange={(e) => setItemForm({ ...itemForm, isCoffeeOrJuice: e.target.checked })}
                    className="accent-gold-500 w-4 h-4"
                  />
                  <span className="font-semibold text-cream-100">
                    Route to Beverage Bar Printer 2 (Juices & Beverages)
                  </span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={itemForm.isPopular}
                    onChange={(e) => setItemForm({ ...itemForm, isPopular: e.target.checked })}
                    className="accent-gold-500 w-4 h-4"
                  />
                  <span className="font-semibold text-cream-100">Mark as Popular Special</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="bg-cafe-800 text-cream-200 py-2.5 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 text-cafe-950 font-bold py-2.5 rounded-xl shadow"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
