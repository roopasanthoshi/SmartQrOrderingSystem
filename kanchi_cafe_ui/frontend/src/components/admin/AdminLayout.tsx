import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Coffee,
  LayoutDashboard,
  ShoppingBag,
  CheckSquare,
  QrCode,
  Utensils,
  Star,
  BarChart3,
  Settings,
  Database,
  Archive,
  Sun,
  Moon,
  LogOut,
  Menu as MenuIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search as SearchIcon,
} from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { admin, logout, cafeSettings } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Orders Board', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Payment Approvals', path: '/admin/approvals', icon: CheckSquare },
    { label: 'Tables & QR', path: '/admin/tables', icon: QrCode },
    { label: 'Menu & Categories', path: '/admin/menu', icon: Utensils },
    { label: 'Customer Reviews', path: '/admin/reviews', icon: Star },
    { label: 'Analytics & Reports', path: '/admin/reports', icon: BarChart3 },
    { label: 'Cafe & System Settings', path: '/admin/settings', icon: Settings },
    { label: 'Data Management', path: '/admin/data', icon: Database },
    { label: 'Backups & Restore', path: '/admin/backups', icon: Archive },
  ];

  // Derive page title & breadcrumbs based on route
  const currentPath = location.pathname;
  const activeItem = menuItems.find(item => item.path === currentPath);
  const pageTitle = activeItem ? activeItem.label : 'POS Management';
  const breadcrumbs = ['Admin', pageTitle];

  return (
    <div className="min-h-screen bg-surface-bg dark:bg-cafe-950 text-ink dark:text-cream-100 flex transition-all duration-150">
      {/* Mobile backdrop overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation — fixed premium dark-coffee theme (independent of light/dark mode) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-sidebar border-r border-sidebar-border text-cream-100 flex flex-col justify-between transition-all duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'w-20' : 'w-[270px]'}`}
      >
        <div>
          {/* Logo & Cafe Header */}
          <div className="px-5 border-b border-sidebar-border flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-3 overflow-hidden">
              {cafeSettings?.logoUrl ? (
                <img
                  src={cafeSettings.logoUrl}
                  alt={cafeSettings.name}
                  className="w-10 h-10 rounded-full object-cover border border-gold-accent/40 flex-shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gold-accent/10 border border-gold-accent/30 flex items-center justify-center text-gold-accent flex-shrink-0">
                  <Coffee className="w-5 h-5" />
                </div>
              )}
              {!collapsed && (
                <div className="truncate">
                  <h1 className="font-serif font-bold text-[17px] text-cream-50 leading-tight truncate">
                    {cafeSettings?.name || 'Kanchi Cafe'}
                  </h1>
                  <span className="text-[10px] text-gold-accent/70 uppercase tracking-[0.15em] font-semibold">
                    POS Portal
                  </span>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-cream-200/60 hover:text-cream-50"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-152px)]">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `group relative flex items-center rounded-xl text-[14px] transition-all duration-150 ${
                      collapsed ? 'justify-center p-3' : 'gap-3 pl-4 pr-3 py-2.5'
                    } ${
                      isActive
                        ? 'bg-sidebar-active text-gold-accent font-semibold'
                        : 'text-cream-200/70 hover:bg-sidebar-hover hover:text-cream-50'
                    }`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gold-accent" />
                      )}
                      <Icon className="w-[18px] h-[18px] flex-shrink-0" strokeWidth={isActive ? 2.25 : 1.75} />
                      {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Footer Admin Info */}
        <div className="p-4 border-t border-sidebar-border flex items-center justify-between overflow-hidden">
          {!collapsed ? (
            <>
              <div className="truncate flex-1 pr-2">
                <p className="text-[13px] font-semibold text-cream-50 truncate">{admin?.name || 'Admin User'}</p>
                <p className="text-[11px] text-cream-200/50 truncate">{admin?.email}</p>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/admin/login');
                }}
                className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition flex-shrink-0"
                title="Logout Admin"
              >
                <LogOut className="w-[18px] h-[18px]" />
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                logout();
                navigate('/admin/login');
              }}
              className="p-2 text-red-400 hover:bg-red-500/10 rounded-xl transition mx-auto"
              title="Logout Admin"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-[270px]'}`}>
        {/* Top Header — clean & white */}
        <header className="sticky top-0 z-30 bg-white/95 dark:bg-cafe-900/95 backdrop-blur-md border-b border-surface-border dark:border-gold-500/10 text-ink dark:text-cream-100 px-6 h-[72px] flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gold-accent hover:bg-surface-bg dark:hover:bg-cafe-800 rounded-lg"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            {/* Collapse toggle button for large screens */}
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="hidden lg:flex p-1.5 rounded-lg border border-surface-border dark:border-gold-500/20 text-ink-muted dark:text-gold-300 hover:bg-surface-bg dark:hover:bg-cafe-800 transition"
              title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            {/* Title & Breadcrumbs */}
            <div className="hidden sm:flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5 text-[11px] text-ink-muted dark:text-cream-200/50 font-semibold uppercase tracking-wider">
                {breadcrumbs.map((bc, idx) => (
                  <React.Fragment key={bc}>
                    <span>{bc}</span>
                    {idx < breadcrumbs.length - 1 && <span className="opacity-40">/</span>}
                  </React.Fragment>
                ))}
              </div>
              <h2 className="font-serif font-bold text-[22px] text-[#3E2A1F] dark:text-gold-300 leading-none">
                {pageTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Search Box */}
            <div className="icon-input-wrap hidden md:block w-64">
              <SearchIcon className="icon-input-icon w-4 h-4 text-ink-muted" />
              <input
                type="text"
                placeholder="Search..."
                className="icon-input w-full bg-surface-bg dark:bg-cafe-950 border border-surface-border dark:border-gold-500/20 rounded-xl !pl-12 pr-4 text-[14px] text-ink dark:text-cream-100 placeholder-ink-muted dark:placeholder-cream-200/40 outline-none focus:border-gold-accent transition"
              />
            </div>

            {/* Current Date Display */}
            <span className="hidden xl:inline text-[13px] text-ink-muted dark:text-cream-200/60 font-medium whitespace-nowrap">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </span>

            {/* Notifications icon representer */}
            <button className="relative p-2 text-ink-muted dark:text-cream-200/80 hover:bg-surface-bg dark:hover:bg-cafe-800 rounded-xl transition">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-cafe-900"></span>
            </button>

            {/* Theme switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-surface-bg dark:bg-cafe-800 text-gold-accent hover:bg-[#F1ECE0] dark:hover:bg-cafe-700 transition flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Profile Avatar indicator */}
            <div className="flex items-center gap-2 border-l border-surface-border dark:border-gold-500/10 pl-4">
              <div className="w-9 h-9 rounded-full bg-gold-accent/15 border border-gold-accent/40 flex items-center justify-center text-[#8a6d1f] dark:text-gold-accent font-semibold text-sm uppercase">
                {admin?.name ? admin.name[0] : 'A'}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Outlet */}
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
