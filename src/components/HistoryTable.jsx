import React from 'react';
import { formatCurrency, formatTime } from '../utils/helpers';

const HistoryTable = ({ history }) => {
  const totalRevenue = history.reduce((sum, b) => sum + b.totalPrice, 0);

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-4">Data Historis Pemesanan</h2>

      {history.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada data historis.</p>
      ) : (
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-gray-400 border-b border-gray-600">
            <tr>
              <th className="py-2">Tanggal</th>
              <th className="py-2">Room</th>
              <th className="py-2">Jam</th>
              <th className="py-2">Durasi</th>
              <th className="py-2">Orang</th>
              <th className="py-2">Promo</th>
              <th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {history.map((b) => (
              <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-2">{b.startTime.toLocaleDateString('id-ID')}</td>
                <td className="py-2">{b.room}</td>
                <td className="py-2">
                  {formatTime(b.startTime)} → {formatTime(b.endTime)}
                </td>
                <td className="py-2">{Math.round((b.durationInMinutes + (b.freeMinutes || 0)) / 60)} jam</td>
                <td className="py-2">{b.people}</td>
                <td className="py-2 text-blue-400">{b.promoNote || '-'}</td>
                <td className="py-2 text-right text-green-400 font-medium">
                  {formatCurrency(b.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {history.length > 0 && (
        <div className="mt-4 text-right text-lg font-bold text-green-400 border-t border-gray-700 pt-3">
          Total Pendapatan: {formatCurrency(totalRevenue)}
        </div>
      )}
    </div>
  );
};

export default HistoryTable;
