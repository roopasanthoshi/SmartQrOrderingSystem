import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (password: string) => Promise<void>;
  onClose: () => void;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onClose,
}) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Admin password is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid admin password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-cafe-900 border-2 border-red-500/40 rounded-3xl p-6 max-w-sm w-full text-cream-100 shadow-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-red-400">{title}</h3>
            <p className="text-xs text-cream-200/70">{message}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 text-xs p-2.5 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gold-300 mb-1">
              Admin Login Password Confirmation *
            </label>
            <div className="icon-input-wrap">
              <Lock className="icon-input-icon w-4 h-4 text-gold-400" />
              <input
                type="password"
                required
                placeholder="Enter current admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="icon-input w-full bg-cafe-950 border border-gold-500/30 focus:border-gold-400 rounded-xl pr-3 text-cream-100 placeholder-cream-200/30 text-xs outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-cafe-800 hover:bg-cafe-700 text-cream-200 font-semibold py-2.5 px-3 rounded-xl text-xs transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition shadow"
            >
              {loading ? 'Verifying...' : 'Confirm Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
