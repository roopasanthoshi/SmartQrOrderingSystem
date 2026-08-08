import React, { createContext, useContext, useEffect, useState } from 'react';
import { AdminUser, CafeSettings } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  cafeSettings: CafeSettings | null;
  isLoading: boolean;
  login: (token: string, admin: AdminUser) => void;
  logout: () => void;
  refetchSettings: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('kanchi_admin_token'));
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [cafeSettings, setCafeSettings] = useState<CafeSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) {
        setCafeSettings(res.data.settings);
      }
    } catch (err) {
      console.error('Failed to load cafe settings:', err);
    }
  };

  const fetchProfile = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data.success) {
        setAdmin(res.data.admin);
      } else {
        logout();
      }
    } catch (err) {
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    fetchProfile();
  }, [token]);

  const login = (newToken: string, newAdmin: AdminUser) => {
    localStorage.setItem('kanchi_admin_token', newToken);
    setToken(newToken);
    setAdmin(newAdmin);
  };

  const logout = () => {
    localStorage.removeItem('kanchi_admin_token');
    setToken(null);
    setAdmin(null);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        cafeSettings,
        isLoading,
        login,
        logout,
        refetchSettings: fetchSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
