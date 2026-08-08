import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Coffee, ShieldCheck, Lock, Mail, AlertCircle } from 'lucide-react';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/auth/login', { 
        email: email.trim(), 
        password: password.trim() 
      });
      if (res.data && res.data.success && res.data.token && res.data.admin) {
        login(res.data.token, res.data.admin);
        navigate('/admin/dashboard');
      } else {
        setErrorMsg(res.data?.message || 'Invalid email or password.');
      }
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.message) {
        setErrorMsg(err.response.data.message);
      } else {
        setErrorMsg('Unable to connect to server. Please try again later.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-200 dark:bg-cafe-950 text-cafe-900 dark:text-cream-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-8 shadow-2xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gold-500/20 text-gold-400 border border-gold-500/30 flex items-center justify-center mx-auto shadow-inner">
            <Coffee className="w-8 h-8 text-gold-500" />
          </div>
          <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300">
            Kanchi Cafe POS Portal
          </h1>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70">
            Authorized Administrator Authentication
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs py-3 px-4 rounded-xl flex items-center gap-2.5 font-medium animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500 dark:text-red-400 align-middle" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {/* Clean Login Form - Email, Password & Button ONLY */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="login-label block text-[13px] font-semibold text-cafe-800 dark:text-gold-300 mb-1.5 tracking-wide">
              Email Address
            </label>
            <div className="icon-input-wrap">
              <Mail className="icon-input-icon w-4 h-4 text-gold-500" />
              <input
                type="email"
                required
                placeholder="admin@kanchicafe.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input icon-input w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl pr-4 text-sm text-cafe-900 dark:text-cream-100 placeholder-cafe-500/60 dark:placeholder-cream-200/50 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 !pl-12 !h-11"
              />
            </div>
          </div>

          <div>
            <label className="login-label block text-[13px] font-semibold text-cafe-800 dark:text-gold-300 mb-1.5 tracking-wide">
              Password
            </label>
            <div className="icon-input-wrap">
              <Lock className="icon-input-icon w-4 h-4 text-gold-500" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="login-input icon-input w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl pr-4 text-sm text-cafe-900 dark:text-cream-100 placeholder-cafe-500/60 dark:placeholder-cream-200/50 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 transition-all duration-200 !pl-12 !h-11"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3 px-4 rounded-xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all duration-150 disabled:opacity-50 mt-4 h-11"
          >
            <ShieldCheck className="w-4 h-4 flex-shrink-0 align-middle" />
            <span className="leading-none align-middle">{isSubmitting ? 'Authenticating...' : 'Sign In to POS Portal'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
