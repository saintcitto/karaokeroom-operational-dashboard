import React, { useMemo } from 'react';
import { formatCurrency } from '../utils/helpers';

export default function HistoryReportDashboard({ history }) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const reports = useMemo(() => {
    const daily = history.filter(h => h.startTime.startsWith(today));
    const weekly = history.filter(h => new Date(h.startTime) >= oneWeekAgo);
    const monthly = history.filter(h => new Date(h.startTime) >= oneMonthAgo);

    const calc = (data) => ({
      count: data.length,
      total: data.reduce((sum, h) => sum + (h.totalPrice || 0), 0),
      rooms: [...new Set(data.map(h => h.room))],
      guests: data.reduce((sum, h) => sum + (h.people || 0), 0),
    });

    return {
      daily: calc(daily),
      weekly: calc(weekly),
      monthly: calc(monthly),
    };
  }, [history]);

  return (
    <div className="p-6 border-t border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-gray-100">📈 Laporan Pendapatan</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {['daily', 'weekly', 'monthly'].map((type) => (
          <div key={type} className="bg-gray-800/60 p-4 rounded-lg shadow-md">
            <h3 className="font-semibold capitalize mb-2 text-blue-400">
              {type === 'daily' ? 'Harian' : type === 'weekly' ? 'Mingguan' : 'Bulanan'}
            </h3>
            <p>Total Pendapatan: <span className="font-bold text-green-400">{formatCurrency(reports[type].total)}</span></p>
            <p>Jumlah Pemesanan: {reports[type].count}</p>
            <p>Total Tamu: {reports[type].guests}</p>
            <p>Room Terpakai: {reports[type].rooms.join(', ') || '-'}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
