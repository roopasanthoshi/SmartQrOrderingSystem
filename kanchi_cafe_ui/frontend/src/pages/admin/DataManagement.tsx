import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { ActivityLog } from '../../types';
import { PasswordConfirmModal } from '../../components/admin/PasswordConfirmModal';
import { Database, Trash2, Calendar, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';

export const DataManagement: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Purge Form state
  const [targetEntity, setTargetEntity] = useState<'ORDERS' | 'REVIEWS' | 'ACTIVITY_LOGS' | 'CUSTOMERS'>('ORDERS');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purgeResultMsg, setPurgeResultMsg] = useState('');

  const getEntityLabel = (entity: string) => {
    switch (entity) {
      case 'ORDERS': return 'Orders';
      case 'REVIEWS': return 'Reviews';
      case 'ACTIVITY_LOGS': return 'Activity Logs';
      case 'CUSTOMERS': return 'Customer';
      default: return entity;
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/activity-logs?limit=50');
      if (res.data.success) {
        setLogs(res.data.logs || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handlePurgeConfirm = async (password: string) => {
    const res = await api.post('/data-management/purge', {
      targetEntity,
      fromDate: fromDate || undefined,
      toDate: toDate || undefined,
      password,
    });

    if (res.data.success) {
      setPurgeResultMsg(res.data.message);
      fetchLogs();
      setTimeout(() => setPurgeResultMsg(''), 4000);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
          <Database className="w-6 h-6 text-gold-500" /> Data Management & Activity Audit Logs
        </h1>
        <p className="text-xs text-cafe-600 dark:text-cream-200/70">
          View immutable security logs and perform password-protected date-range data deletion or purges
        </p>
      </div>

      {purgeResultMsg && (
        <div className="bg-green-500/20 border border-green-500/40 text-green-200 text-xs p-3 rounded-2xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {purgeResultMsg}
        </div>
      )}

      {/* Data Purge Tool Box */}
      <div className="bg-white dark:bg-cafe-900 border-2 border-red-500/30 rounded-3xl p-5 shadow-sm space-y-4">
        <h3 className="font-serif font-bold text-base text-red-400 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" /> {targetEntity === 'ORDERS' ? 'Password-Protected Data Deletion Tool' : 'Password-Protected Data Deletion & Purge Tool'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-gold-300 font-semibold mb-1">Target Section</label>
            <select
              value={targetEntity}
              onChange={(e) => setTargetEntity(e.target.value as any)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2.5 text-cafe-900 dark:text-cream-100 outline-none"
            >
              <option value="ORDERS">Orders & KOTs</option>
              <option value="REVIEWS">Customer Reviews</option>
              <option value="ACTIVITY_LOGS">Activity Logs</option>
              <option value="CUSTOMERS">Customer Records</option>
            </select>
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>

          <div>
            <label className="block text-gold-300 font-semibold mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2 text-cafe-900 dark:text-cream-100 outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow transition"
            >
              <Trash2 className="w-4 h-4" /> {targetEntity === 'ORDERS' ? 'Delete Orders' : 'Purge Records'}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300 flex items-center gap-2">
          <FileText className="w-5 h-5 text-gold-500" /> Recent Activity Audit Trail
        </h3>

        {loading ? (
          <div className="py-8 text-center text-gold-400 font-mono text-xs animate-pulse">
            Loading Activity Logs...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 dark:bg-cafe-950 text-gold-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Timestamp</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Details</th>
                  <th className="p-3">Admin Email</th>
                  <th className="p-3 rounded-r-xl">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 dark:divide-gold-500/10">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-cream-50 dark:hover:bg-cafe-800/40 transition">
                    <td className="p-3 font-mono text-cafe-500 dark:text-cream-200/60">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-gold-500">{log.action}</td>
                    <td className="p-3 text-cafe-900 dark:text-cream-100">{log.details}</td>
                    <td className="p-3 text-cafe-600 dark:text-cream-200/70">{log.adminEmail || 'SYSTEM'}</td>
                    <td className="p-3 font-mono text-cafe-500 dark:text-cream-200/60">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Confirmation Modal for Purge */}
      <PasswordConfirmModal
        isOpen={isPurgeModalOpen}
        title={targetEntity === 'ORDERS' ? 'Delete Orders' : `Purge ${targetEntity} Records`}
        message={targetEntity === 'ORDERS' ? 'Are you sure you want to delete ORDERS? This cannot be undone. Admin password required.' : `Are you sure you want to purge ${targetEntity}? This cannot be undone. Admin password required.`}
        onConfirm={handlePurgeConfirm}
        onClose={() => setIsPurgeModalOpen(false)}
      />
    </div>
  );
};
