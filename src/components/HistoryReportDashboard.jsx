import React, { useEffect, useState } from 'react';
import { getDatabase, ref, onValue } from 'firebase/database';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import { TrendingUp, Clock } from 'lucide-react';

const HistoryReportDashboard = () => {
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalMorning: 0,
    totalEvening: 0,
    totalToday: 0,
    topCashier: null,
  });

  useEffect(() => {
    const db = getDatabase();
    const historyRef = ref(db, 'history');

    onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.values(data);

      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const todayHistory = list.filter((h) => h.date?.startsWith(todayStr));

      const morning = todayHistory.filter((h) => new Date(h.startTime).getHours() < 18);
      const evening = todayHistory.filter((h) => new Date(h.startTime).getHours() >= 18);

      const totalMorning = morning.reduce((sum, h) => sum + (h.totalPrice || 0), 0);
      const totalEvening = evening.reduce((sum, h) => sum + (h.totalPrice || 0), 0);

      const totalByCashier = {};
      todayHistory.forEach((h) => {
        if (!totalByCashier[h.cashier]) totalByCashier[h.cashier] = 0;
        totalByCashier[h.cashier] += 1;
      });

      const topCashier = Object.entries(totalByCashier).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

      setSummary({
        totalMorning,
        totalEvening,
        totalToday: totalMorning + totalEvening,
        topCashier,
      });

      setHistory(todayHistory);
    });
  }, []);

  const chartData = Object.entries(
    history.reduce((acc, h) => {
      acc[h.cashier] = (acc[h.cashier] || 0) + 1;
      return acc;
    }, {})
  ).map(([cashier, transaksi]) => ({ cashier, transaksi }));

  return (
    <div className="text-white p-6 space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-4">
        <TrendingUp className="text-blue-400" /> Laporan Harian
      </h2>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl p-4 shadow-lg">
          <h3 className="text-gray-300 text-sm">Pendapatan Shift Pagi</h3>
          <p className="text-2xl font-semibold text-green-400">
            Rp {summary.totalMorning.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-violet-900 to-violet-700 rounded-xl p-4 shadow-lg">
          <h3 className="text-gray-300 text-sm">Pendapatan Shift Malam</h3>
          <p className="text-2xl font-semibold text-green-400">
            Rp {summary.totalEvening.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-xl p-4 shadow-lg">
          <h3 className="text-gray-300 text-sm">Total Pendapatan Hari Ini</h3>
          <p className="text-2xl font-semibold text-yellow-400">
            Rp {summary.totalToday.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg">
        <h3 className="font-semibold text-gray-200 mb-3">📊 Grafik Transaksi per Kasir</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="cashier" stroke="#aaa" />
            <YAxis stroke="#aaa" />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.05)' }}
              contentStyle={{
                backgroundColor: '#1f2937',
                borderRadius: '8px',
                border: '1px solid #333',
              }}
            />
            <Bar dataKey="transaksi" fill="url(#colorUv)" radius={[6, 6, 0, 0]}>
              <LabelList dataKey="transaksi" position="top" fill="#fff" />
            </Bar>
            <defs>
              <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.9} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.6} />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
        <p className="text-sm mt-3 text-gray-400">
          🏆 Kasir paling aktif hari ini: <span className="text-pink-400 font-semibold">{summary.topCashier}</span>
        </p>
      </div>

      {/* Activity List */}
      <div className="bg-gray-800 p-5 rounded-xl shadow-md">
        <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
          <Clock size={18} /> Aktivitas Pemesanan Hari Ini
        </h3>
        {history.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Belum ada transaksi hari ini.</p>
        ) : (
          <div className="space-y-3">
            {history
              .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
              .map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-700/60 rounded-lg p-3 flex justify-between items-center hover:bg-gray-600/60 transition-colors"
                >
                  <div>
                    <p className="text-sm text-gray-200">
                      <span className="font-semibold text-blue-400">{item.cashier}</span> - {item.room}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(item.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} · {item.people} orang
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-green-400">
                    Rp {item.totalPrice.toLocaleString('id-ID')}
                  </p>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryReportDashboard;
