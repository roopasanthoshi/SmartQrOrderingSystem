import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { PasswordConfirmModal } from '../../components/admin/PasswordConfirmModal';
import { Archive, Download, Upload, ShieldCheck, CheckCircle2, Clock } from 'lucide-react';

export const BackupManager: React.FC = () => {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<'CREATE' | 'RESTORE' | null>(null);

  // Restore file state
  const [restoreJson, setRestoreJson] = useState<any | null>(null);
  const [restoreFileName, setRestoreFileName] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/backups');
      if (res.data.success) {
        setBackups(res.data.backups || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setRestoreJson(json);
      } catch (err) {
        alert('Invalid JSON backup file format');
      }
    };
    reader.readAsText(file);
  };

  const handlePasswordConfirm = async (password: string) => {
    if (activeAction === 'CREATE') {
      const res = await api.post('/backups/create', { password });
      if (res.data.success) {
        // Trigger browser JSON download
        const blob = new Blob([JSON.stringify(res.data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = res.data.backup.filename;
        a.click();

        setStatusMsg(`Backup ${res.data.backup.filename} created & downloaded!`);
        fetchBackups();
        setTimeout(() => setStatusMsg(''), 4000);
      }
    } else if (activeAction === 'RESTORE' && restoreJson) {
      const res = await api.post('/backups/restore', { backupData: restoreJson, password });
      if (res.data.success) {
        setStatusMsg('Database restored successfully from backup!');
        setRestoreJson(null);
        setRestoreFileName('');
        fetchBackups();
        setTimeout(() => setStatusMsg(''), 4000);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
          <Archive className="w-6 h-6 text-gold-500" /> Database Backup & Restoration
        </h1>
        <p className="text-xs text-cafe-600 dark:text-cream-200/70">
          Create encrypted database snapshots, download backups, and perform password-protected restores
        </p>
      </div>

      {statusMsg && (
        <div className="bg-green-500/20 border border-green-500/40 text-green-200 text-xs p-3 rounded-2xl flex items-center gap-2 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> {statusMsg}
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Create Backup */}
        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300">
                  Create New Backup
                </h3>
                <p className="text-xs text-cafe-600 dark:text-cream-200/70">
                  Export complete JSON database snapshot of menu, tables, orders & settings
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => setActiveAction('CREATE')}
            className="w-full bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 shadow transition"
          >
            <ShieldCheck className="w-4 h-4" /> Create & Download Backup (Password Required)
          </button>
        </div>

        {/* Card 2: Restore Backup */}
        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-2xl bg-gold-500/20 text-gold-400 border border-gold-500/40 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300">
                  Restore Database
                </h3>
                <p className="text-xs text-cafe-600 dark:text-cream-200/70">
                  Upload a previously downloaded JSON backup file to restore cafe data
                </p>
              </div>
            </div>

            <div className="mt-3">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="w-full bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2 text-xs text-cafe-900 dark:text-cream-100 outline-none"
              />
              {restoreFileName && (
                <p className="text-xs font-mono text-gold-400 mt-1">Loaded: {restoreFileName}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => {
              if (!restoreJson) {
                alert('Please select a JSON backup file first');
                return;
              }
              setActiveAction('RESTORE');
            }}
            disabled={!restoreJson}
            className="w-full bg-cafe-800 hover:bg-cafe-700 text-gold-300 border border-gold-500/30 font-bold py-3 px-4 rounded-2xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" /> Restore Database (Password Required)
          </button>
        </div>
      </div>

      {/* Backup History Table */}
      <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-5 shadow-sm space-y-3">
        <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gold-500" /> Recent Backup History Log
        </h3>

        {loading ? (
          <div className="py-8 text-center text-gold-400 font-mono text-xs animate-pulse">
            Loading Backups...
          </div>
        ) : backups.length === 0 ? (
          <p className="text-xs text-center py-6 text-cafe-500 dark:text-cream-200/50">
            No previous backups created yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 dark:bg-cafe-950 text-gold-400 font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3 rounded-l-xl">Date & Time</th>
                  <th className="p-3">Filename</th>
                  <th className="p-3">File Size</th>
                  <th className="p-3 rounded-r-xl">Records Summary</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cafe-100 dark:divide-gold-500/10">
                {backups.map((b) => (
                  <tr key={b.id} className="hover:bg-cream-50 dark:hover:bg-cafe-800/40 transition">
                    <td className="p-3 font-mono text-cafe-500 dark:text-cream-200/60">
                      {new Date(b.createdAt).toLocaleString()}
                    </td>
                    <td className="p-3 font-mono font-bold text-gold-400">{b.filename}</td>
                    <td className="p-3 font-mono text-cafe-700 dark:text-cream-200">{b.fileSize}</td>
                    <td className="p-3 text-cafe-600 dark:text-cream-200/70">{b.recordCounts || 'Complete snapshot'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Password Confirmation Modal */}
      <PasswordConfirmModal
        isOpen={!!activeAction}
        title={activeAction === 'CREATE' ? 'Create Database Backup' : 'Restore Database Snapshot'}
        message={
          activeAction === 'CREATE'
            ? 'Creating a new backup snapshot requires admin password verification.'
            : 'Restoring database will overwrite current items with backup data. Password required.'
        }
        onConfirm={handlePasswordConfirm}
        onClose={() => setActiveAction(null)}
      />
    </div>
  );
};
