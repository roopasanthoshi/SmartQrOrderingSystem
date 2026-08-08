import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../../services/api';
import { Table } from '../../types';
import { PasswordConfirmModal } from '../../components/admin/PasswordConfirmModal';
import { QrCode, Plus, Trash2, Edit3, Download, Printer, Users, ShoppingBag } from 'lucide-react';

export const TableQRManager: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTableNum, setNewTableNum] = useState('');
  const [editingTable, setEditingTable] = useState<Table | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const fetchTables = async () => {
    setLoading(true);
    try {
      const res = await api.get('/tables');
      if (res.data.success) {
        setTables(res.data.tables || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableNum || isNaN(Number(newTableNum))) return;

    try {
      await api.post('/tables', { tableNumber: Number(newTableNum) });
      setNewTableNum('');
      fetchTables();
    } catch (err: any) {
      alert(err.message || 'Failed to add table');
    }
  };

  const handleUpdateTable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTable) return;

    try {
      await api.put(`/tables/${editingTable.id}`, { tableNumber: editingTable.tableNumber });
      setEditingTable(null);
      fetchTables();
    } catch (err: any) {
      alert(err.message || 'Failed to edit table');
    }
  };

  const handleDeleteTableConfirm = async (password: string) => {
    if (!deleteTargetId) return;
    await api.post(`/tables/${deleteTargetId}/delete`, { password });
    fetchTables();
  };

  const handlePrintQrSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-gold-500" /> Table & QR Code Management
          </h1>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70">
            Manage cafe table QR stickers, print batch layouts, and view active customer counters
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintQrSheet}
            className="bg-cafe-800 hover:bg-cafe-700 text-gold-300 border border-gold-500/30 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow"
          >
            <Printer className="w-4 h-4" /> Print All QRs Sheet
          </button>
        </div>
      </div>

      {/* Add New Table Form */}
      <form onSubmit={handleAddTable} className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm flex items-center gap-3 max-w-md">
        <input
          type="number"
          required
          placeholder="Enter Table Number (e.g. 16)"
          value={newTableNum}
          onChange={(e) => setNewTableNum(e.target.value)}
          className="flex-1 bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl py-2 px-3 text-xs text-cafe-900 dark:text-cream-100 outline-none"
        />
        <button
          type="submit"
          className="bg-gold-500 hover:bg-gold-600 text-cafe-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1 transition shadow"
        >
          <Plus className="w-4 h-4" /> Add Table
        </button>
      </form>

      {/* Tables 15 Grid Display */}
      {loading ? (
        <div className="py-12 text-center text-gold-400 font-mono text-xs animate-pulse">
          Loading Tables...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print-area">
          {tables.map((table) => {
            const tableLandingUrl = `${window.location.origin}/table/${table.tableNumber}`;

            return (
              <div
                key={table.id}
                className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-5 shadow-md flex flex-col justify-between space-y-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-lg text-cafe-900 dark:text-gold-300">
                    Table {table.tableNumber}
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingTable(table)}
                      className="p-1 text-gold-400 hover:text-gold-300 transition"
                      title="Edit Table Number"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(table.id)}
                      className="p-1 text-red-400 hover:text-red-300 transition"
                      title="Delete Table (Requires Password)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* QR Display */}
                <div className="bg-white p-3 rounded-2xl border border-cafe-200 text-center mx-auto shadow-inner">
                  <QRCodeSVG value={tableLandingUrl} size={130} level="M" />
                  <p className="font-mono text-[10px] text-cafe-500 mt-1 font-semibold">
                    /table/{table.tableNumber}
                  </p>
                </div>

                {/* Active Counters strictly complying with NO Available/Occupied requirement */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="bg-cream-50 dark:bg-cafe-950 p-2 rounded-xl border border-cafe-200 dark:border-gold-500/10">
                    <Users className="w-4 h-4 text-gold-500 mx-auto mb-0.5" />
                    <span className="font-mono font-bold text-cafe-900 dark:text-gold-300 block">
                      {table.activeCustomers}
                    </span>
                    <span className="text-[10px] text-cafe-500 dark:text-cream-200/50">Active Customers</span>
                  </div>

                  <div className="bg-cream-50 dark:bg-cafe-950 p-2 rounded-xl border border-cafe-200 dark:border-gold-500/10">
                    <ShoppingBag className="w-4 h-4 text-gold-500 mx-auto mb-0.5" />
                    <span className="font-mono font-bold text-cafe-900 dark:text-gold-300 block">
                      {table.activeOrders}
                    </span>
                    <span className="text-[10px] text-cafe-500 dark:text-cream-200/50">Active KOTs</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Table Modal */}
      {editingTable && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cafe-900 border-2 border-gold-500/40 rounded-3xl p-6 max-w-sm w-full text-cream-100 shadow-2xl space-y-4">
            <h3 className="font-serif text-lg font-bold text-gold-300">Edit Table Number</h3>
            <form onSubmit={handleUpdateTable} className="space-y-4">
              <input
                type="number"
                required
                value={editingTable.tableNumber}
                onChange={(e) => setEditingTable({ ...editingTable, tableNumber: Number(e.target.value) })}
                className="w-full bg-cafe-950 border border-gold-500/30 rounded-xl p-2.5 text-cream-100 outline-none text-sm font-mono"
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTable(null)}
                  className="bg-cafe-800 text-cream-200 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-gold-500 text-cafe-950 font-bold py-2 rounded-xl text-xs shadow"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Password Modal */}
      <PasswordConfirmModal
        isOpen={!!deleteTargetId}
        title="Delete Table"
        message="This will permanently delete this table. Admin password is required."
        onConfirm={handleDeleteTableConfirm}
        onClose={() => setDeleteTargetId(null)}
      />
    </div>
  );
};
