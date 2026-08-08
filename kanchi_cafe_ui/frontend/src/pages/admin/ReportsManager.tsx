import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, Download, Calendar, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react';

const COLORS = ['#D4AF37', '#8C6F43', '#24140A', '#4E311B', '#B89B6D'];

export const ReportsManager: React.FC = () => {
  const [filterType, setFilterType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    averageBill: 0,
    totalCustomerVisits: 0,
  });

  const [topSelling, setTopSelling] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
  const [leastSelling, setLeastSelling] = useState<{ name: string; quantity: number; revenue: number }[]>([]);
  const [categorySales, setCategorySales] = useState<{ name: string; value: number }[]>([]);
  const [peakHours, setPeakHours] = useState<{ hour: string; orderCount: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingOrders, setExportingOrders] = useState(false);
  const [exportingRevenue, setExportingRevenue] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let url = `/reports/summary?filterType=${filterType}`;
      if (fromDate && toDate) {
        url += `&fromDate=${fromDate}&toDate=${toDate}`;
      }

      const res = await api.get(url);
      if (res.data.success) {
        setSummary(res.data.summary);
        setTopSelling(res.data.topSelling || []);
        setLeastSelling(res.data.leastSelling || []);
        setPeakHours(res.data.peakHours || []);

        // Convert categorySales object to array for PieChart
        const catMap = res.data.categorySales || {};
        const catArray = Object.entries(catMap).map(([name, value]) => ({
          name,
          value: Number(value),
        }));
        setCategorySales(catArray);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterType, fromDate, toDate]);

  const handleExportOrdersExcel = async () => {
    setExportingOrders(true);
    try {
      let url = `/reports/export-excel?exportType=orders&filterType=${filterType}`;
      if (fromDate && toDate) {
        url += `&fromDate=${fromDate}&toDate=${toDate}`;
      }
      
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Kanchi_Cafe_Orders.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export Orders report. Please try again.');
    } finally {
      setExportingOrders(false);
    }
  };

  const handleExportRevenueExcel = async () => {
    setExportingRevenue(true);
    try {
      let url = `/reports/export-excel?exportType=revenue&filterType=${filterType}`;
      if (fromDate && toDate) {
        url += `&fromDate=${fromDate}&toDate=${toDate}`;
      }
      
      const response = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'Kanchi_Cafe_Revenue.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error(err);
      alert('Failed to export Revenue report. Please try again.');
    } finally {
      setExportingRevenue(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-cafe-900 dark:text-gold-300 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-gold-500" /> Sales Reports & Business Analytics
          </h1>
          <p className="text-xs text-cafe-600 dark:text-cream-200/70">
            Analyze revenue trends, peak hours, best-selling dishes, and export financial workbooks
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportOrdersExcel}
            disabled={exportingOrders || exportingRevenue}
            className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-cafe-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-4 h-4" />
            {exportingOrders ? 'Exporting Orders...' : 'Export Orders Excel (.xlsx)'}
          </button>
          <button
            onClick={handleExportRevenueExcel}
            disabled={exportingOrders || exportingRevenue}
            className="bg-gold-500 hover:bg-gold-600 disabled:opacity-50 text-cafe-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow transition"
          >
            <Download className="w-4 h-4" />
            {exportingRevenue ? 'Exporting Revenue...' : 'Export Revenue Excel (.xlsx)'}
          </button>
        </div>
      </div>

      {/* Date Filter & Preset Tabs */}
      <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-1 bg-cream-50 dark:bg-cafe-950 p-1 rounded-xl border border-cafe-200 dark:border-gold-500/20">
          {(['daily', 'weekly', 'monthly'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilterType(type);
                setFromDate('');
                setToDate('');
              }}
              className={`px-3.5 py-1.5 rounded-lg font-bold capitalize transition ${
                filterType === type && !fromDate
                  ? 'bg-gold-500 text-cafe-950 shadow'
                  : 'text-cafe-700 dark:text-cream-200'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gold-500" />
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2 text-cafe-900 dark:text-cream-100 outline-none"
          />
          <span className="text-cafe-500">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="bg-cream-50 dark:bg-cafe-950 border border-cafe-300 dark:border-gold-500/30 rounded-xl p-2 text-cafe-900 dark:text-cream-100 outline-none"
          />
        </div>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-5 shadow-sm text-left">
          <DollarSign className="w-6 h-6 text-gold-500 mb-1" />
          <span className="font-mono text-2xl font-bold text-cafe-900 dark:text-gold-300 block">
            Rs.{summary.totalRevenue.toFixed(2)}
          </span>
          <span className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">Total Revenue</span>
        </div>

        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-5 shadow-sm text-left">
          <ShoppingBag className="w-6 h-6 text-gold-500 mb-1" />
          <span className="font-mono text-2xl font-bold text-cafe-900 dark:text-gold-300 block">
            {summary.totalOrders}
          </span>
          <span className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">Total Orders</span>
        </div>

        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-5 shadow-sm text-left">
          <TrendingUp className="w-6 h-6 text-gold-500 mb-1" />
          <span className="font-mono text-2xl font-bold text-cafe-900 dark:text-gold-300 block">
            Rs.{summary.averageBill.toFixed(2)}
          </span>
          <span className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">Average Order Bill</span>
        </div>

        <div className="bg-white dark:bg-cafe-900 border-2 border-gold-500/30 rounded-3xl p-5 shadow-sm text-left">
          <Users className="w-6 h-6 text-gold-500 mb-1" />
          <span className="font-mono text-2xl font-bold text-cafe-900 dark:text-gold-300 block">
            {summary.totalCustomerVisits}
          </span>
          <span className="text-xs text-cafe-500 dark:text-cream-200/60 font-semibold">Customer Visits</span>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Peak Hours Bar Chart */}
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300">
            Peak Ordering Hours Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={peakHours}>
                <XAxis dataKey="hour" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#24140A', border: '1px solid #D4AF37', borderRadius: '12px', color: '#FAF6EE' }}
                />
                <Bar dataKey="orderCount" fill="#D4AF37" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Sales Distribution Pie Chart */}
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-5 shadow-sm space-y-4">
          <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300">
            Category Sales Revenue Distribution
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            {categorySales.length === 0 ? (
              <p className="text-xs text-cafe-500">No category sales recorded yet</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categorySales}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categorySales.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#24140A', border: '1px solid #D4AF37', borderRadius: '12px', color: '#FAF6EE' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Top & Least Selling Items Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Dishes */}
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300">
            Top 5 Best Selling Dishes
          </h3>
          <div className="space-y-2 text-xs">
            {topSelling.map((item, idx) => (
              <div
                key={idx}
                className="bg-cream-50 dark:bg-cafe-950 p-3 rounded-2xl border border-cafe-200 dark:border-gold-500/10 flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-cafe-900 dark:text-cream-100">{item.name}</span>
                  <p className="text-[10px] text-cafe-500 dark:text-cream-200/50">
                    Total Quantity Sold: {item.quantity}
                  </p>
                </div>
                <span className="font-mono font-bold text-gold-600 dark:text-gold-400">
                  Rs.{item.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Least Selling Dishes */}
        <div className="bg-white dark:bg-cafe-900 border border-cafe-200 dark:border-gold-500/20 rounded-3xl p-5 shadow-sm space-y-3">
          <h3 className="font-serif font-bold text-base text-cafe-900 dark:text-gold-300">
            Least Selling Dishes
          </h3>
          <div className="space-y-2 text-xs">
            {leastSelling.map((item, idx) => (
              <div
                key={idx}
                className="bg-cream-50 dark:bg-cafe-950 p-3 rounded-2xl border border-cafe-200 dark:border-gold-500/10 flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-cafe-900 dark:text-cream-100">{item.name}</span>
                  <p className="text-[10px] text-cafe-500 dark:text-cream-200/50">
                    Total Quantity Sold: {item.quantity}
                  </p>
                </div>
                <span className="font-mono font-bold text-gold-600 dark:text-gold-400">
                  Rs.{item.revenue.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
