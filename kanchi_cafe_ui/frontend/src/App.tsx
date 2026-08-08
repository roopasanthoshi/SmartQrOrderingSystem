import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CustomerProvider } from './context/CustomerContext';
import { CartProvider } from './context/CartContext';

// Customer Pages
import { TableLanding } from './pages/customer/TableLanding';
import { CustomerHome } from './pages/customer/CustomerHome';
import { CustomerMenu } from './pages/customer/CustomerMenu';
import { CartPage } from './pages/customer/CartPage';
import { PaymentPage } from './pages/customer/PaymentPage';
import { ActiveOrders } from './pages/customer/ActiveOrders';
import { OrderHistory } from './pages/customer/OrderHistory';
import { CustomerProfile } from './pages/customer/CustomerProfile';
import { ReviewPage } from './pages/customer/ReviewPage';

// Admin Components & Pages
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { OrdersManager } from './pages/admin/OrdersManager';
import { PaymentApprovals } from './pages/admin/PaymentApprovals';
import { TableQRManager } from './pages/admin/TableQRManager';
import { MenuManager } from './pages/admin/MenuManager';
import { ReviewsManager } from './pages/admin/ReviewsManager';
import { ReportsManager } from './pages/admin/ReportsManager';
import { SettingsManager } from './pages/admin/SettingsManager';
import { DataManagement } from './pages/admin/DataManagement';
import { BackupManager } from './pages/admin/BackupManager';

const queryClient = new QueryClient();

// Protected Admin Route wrapper
const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, isLoading } = useAuth();
  if (isLoading) return <div className="min-h-screen bg-cafe-950 text-gold-400 font-mono p-8 flex items-center justify-center">Loading POS Admin...</div>;
  if (!token) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CustomerProvider>
            <CartProvider>
              <BrowserRouter>
                <Routes>
                  {/* Default Landing */}
                  <Route path="/" element={<Navigate to="/table/1" replace />} />
                  <Route path="/table/:tableNumber" element={<TableLanding />} />

                  {/* Customer Experience Routes */}
                  <Route path="/home" element={<CustomerHome />} />
                  <Route path="/menu" element={<CustomerMenu />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/payment" element={<PaymentPage />} />
                  <Route path="/active-orders" element={<ActiveOrders />} />
                  <Route path="/history" element={<OrderHistory />} />
                  <Route path="/profile" element={<CustomerProfile />} />
                  <Route path="/review" element={<ReviewPage />} />

                  {/* Admin Auth Route */}
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Protected Admin Portal Routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedAdminRoute>
                        <AdminLayout />
                      </ProtectedAdminRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<Dashboard />} />
                    <Route path="orders" element={<OrdersManager />} />
                    <Route path="approvals" element={<PaymentApprovals />} />
                    <Route path="tables" element={<TableQRManager />} />
                    <Route path="menu" element={<MenuManager />} />
                    <Route path="reviews" element={<ReviewsManager />} />
                    <Route path="reports" element={<ReportsManager />} />
                    <Route path="settings" element={<SettingsManager />} />
                    <Route path="data" element={<DataManagement />} />
                    <Route path="backups" element={<BackupManager />} />
                  </Route>

                  {/* Fallback 404 Route */}
                  <Route path="*" element={<Navigate to="/table/1" replace />} />
                </Routes>
              </BrowserRouter>
            </CartProvider>
          </CustomerProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
