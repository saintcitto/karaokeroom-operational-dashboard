import React, { useMemo } from 'react';
import { formatCurrency, formatTime } from '../utils/helpers';

const HistoryReport = ({ history }) => {
  const getMinutes = (date) => date.getHours() * 60 + date.getMinutes();

  const morningBookings = useMemo(() => {
    return history.filter((b) => {
      const start = getMinutes(b.startTime);
      return start >= 600 && start <= 1004;
    });
  }, [history]);

  const nightBookings = useMemo(() => {
    return history.filter((b) => {
      const start = getMinutes(b.startTime);
      return start >= 1005 || start < 600;
    });
  }, [history]);

  const calcSummary = (bookings) => {
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const totalGuests = bookings.reduce((sum, b) => sum + (b.people || 0), 0);
    const totalDuration = bookings.reduce(
      (sum, b) => sum + b.durationInMinutes + (b.freeMinutes || 0),
      0
    );
    const roomFrequency = {};
    bookings.forEach((b) => {
      roomFrequency[b.room] = (roomFrequency[b.room] || 0) + 1;
    });
    const mostUsedRoom =
      Object.keys(roomFrequency).length > 0
        ? Object.entries(roomFrequency).sort((a, b) => b[1] - a[1])[0][0]
        : '-';
    return { totalRevenue, totalGuests, totalDuration, mostUsedRoom };
  };

  const morningSummary = calcSummary(morningBookings);
  const nightSummary = calcSummary(nightBookings);
  const fullSummary = calcSummary(history);

  const renderTable = (title, data, summary) => (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300 border border-gray-700 rounded-lg overflow-hidden">
          <thead className="bg-gray-700 text-gray-200">
            <tr>
              <th className="py-2 px-3">Tanggal</th>
              <th className="py-2 px-3">Room</th>
              <th className="py-2 px-3">Jam</th>
              <th className="py-2 px-3">Durasi</th>
              <th className="py-2 px-3">Orang</th>
              <th className="py-2 px-3">Promo</th>
              <th className="py-2 px-3 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/30">
                <td className="py-2 px-3">{b.startTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</td>
                <td className="py-2 px-3">{b.room}</td>
                <td className="py-2 px-3">{formatTime(b.startTime)} → {formatTime(b.endTime)}</td>
                <td className="py-2 px-3">{Math.round((b.durationInMinutes + (b.freeMinutes || 0)) / 60 * 10) / 10} jam</td>
                <td className="py-2 px-3">{b.people}</td>
                <td className="py-2 px-3 text-blue-400">{b.promoNote || '-'}</td>
                <td className="py-2 px-3 text-right text-green-400 font-medium">
                  {formatCurrency(b.totalPrice)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length > 0 && (
        <div className="mt-4 text-right text-gray-300">
          <p>Total Durasi: {Math.round(summary.totalDuration / 60 * 10) / 10} jam</p>
          <p>Total Tamu: {summary.totalGuests}</p>
          <p>Room Terfavorit: {summary.mostUsedRoom}</p>
          <p className="font-bold text-green-400 text-lg mt-1">
            Total Pendapatan: {formatCurrency(summary.totalRevenue)}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold text-white mb-6">Laporan Pendapatan Harian</h2>
      {renderTable('🎵 Karaoke Pagi (10.00 - 16.44)', morningBookings, morningSummary)}
      {renderTable('🌙 Karaoke Malam (16.45 - 00.00)', nightBookings, nightSummary)}
      <div className="border-t border-gray-600 pt-4 mt-4">
        <h3 className="text-lg font-bold text-white mb-2">🧾 Total Pendapatan Harian</h3>
        <p className="text-gray-300">Total Durasi: {Math.round(fullSummary.totalDuration / 60 * 10) / 10} jam</p>
        <p className="text-gray-300">Jumlah Tamu: {fullSummary.totalGuests}</p>
        <p className="text-gray-300">Room Terfavorit: {fullSummary.mostUsedRoom}</p>
        <p className="font-bold text-green-400 text-xl mt-2">
          Total Pendapatan Hari Ini: {formatCurrency(fullSummary.totalRevenue)}
        </p>
      </div>
    </div>
  );
};

export default HistoryReport;
