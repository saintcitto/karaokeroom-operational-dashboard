import React, { useEffect, useState } from 'react';
import { Clock, Users } from 'lucide-react';

export default function BookingCard({ booking, now, onExpire, onCancel }) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!booking?.endTime || !(booking.endTime instanceof Date)) return;
    const diff = booking.endTime - now;
    if (diff <= 0) {
      onExpire(booking);
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    setRemaining(`${hours.toString().padStart(2, '0')}j ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}d`);
  }, [now, booking, onExpire]);

  if (!booking || !booking.room) return null;

  const { room, startTime, endTime, duration, totalPrice, guests } = booking;
  const safeStart = startTime instanceof Date ? startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Invalid';
  const safeEnd = endTime instanceof Date ? endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Invalid';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-white">{room}</h3>
        <Clock size={18} className="text-gray-400" />
      </div>
      <div className="text-2xl font-mono text-center text-green-400 mb-3">{remaining}</div>
      <div className="text-sm text-gray-300 space-y-1">
        <p>{safeStart} → {safeEnd}</p>
        <p>Durasi: {duration?.hours || 0}j {duration?.minutes || 0}m</p>
        <p><Users size={14} className="inline-block mr-1" />Jumlah: {guests || 0} Orang</p>
      </div>
      <div className="mt-3 border-t border-gray-700 pt-2 text-sm">
        <p>Tarif/Jam: <span className="text-green-400 font-semibold">Rp{(totalPrice / (duration?.hours || 1)).toLocaleString()}</span></p>
        <p>Total: <span className="text-green-500 font-bold">Rp{totalPrice?.toLocaleString() || 0}</span></p>
      </div>
      <button
        onClick={() => onCancel(booking.id)}
        className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white text-sm py-2 rounded-lg transition"
      >
        Batalkan Sesi Ini
      </button>
    </div>
  );
}
