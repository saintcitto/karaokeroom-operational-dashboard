import React, { useEffect, useState } from 'react';
import { Clock, Users, Tag, XCircle } from 'lucide-react';

export default function BookingCard({ booking, now, onExpire, onCancel }) {
  if (!booking || !booking.startTime || !booking.endTime) {
    onCancel(booking?.id);
    return null;
  }

  const startTime = new Date(booking.startTime);
  const endTime = new Date(booking.endTime);
  if (isNaN(startTime) || isNaN(endTime)) {
    onCancel(booking.id);
    return null;
  }

  const [remaining, setRemaining] = useState(Math.max(0, endTime - now));
  useEffect(() => {
    const timer = setInterval(() => setRemaining(Math.max(0, endTime - new Date())), 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const totalDuration = endTime - startTime;
  const progress = totalDuration > 0 ? 100 - (remaining / totalDuration) * 100 : 0;
  const isExpired = remaining <= 0;
  const promoLabel =
    booking.promo === 'Gratis 1 jam'
      ? '🎁 +60 Menit Gratis'
      : booking.promo === 'Gratis 30 menit'
      ? '🎁 +30 Menit Gratis'
      : null;

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(
      seconds
    ).padStart(2, '0')}`;
  };

  return (
    <div
      className={`relative rounded-2xl p-5 border transition-all duration-300 shadow-lg hover:shadow-xl ${
        isExpired
          ? 'border-red-500 bg-gradient-to-br from-red-900/30 to-gray-900'
          : 'border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900'
      }`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold text-white tracking-wide">{booking.room}</h3>
        {promoLabel && (
          <div className="text-xs px-2 py-1 bg-gradient-to-r from-amber-400 to-yellow-600 rounded-full font-semibold text-gray-900 shadow-sm">
            {promoLabel}
          </div>
        )}
      </div>

      <div className="space-y-2 text-sm text-gray-300">
        <p className="flex items-center gap-2">
          <Clock size={16} className="text-blue-400" />
          <span>
            {startTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} -{' '}
            {endTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </p>
        <p className="flex items-center gap-2">
          <Users size={16} className="text-green-400" />
          <span>{booking.people} orang</span>
        </p>
        <p className="flex items-center gap-2">
          <Tag size={16} className="text-yellow-400" />
          <span>Kasir: {booking.handledBy}</span>
        </p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-gray-400">Sisa Waktu</span>
          <span className={`font-semibold ${isExpired ? 'text-red-400' : 'text-green-400'}`}>
            {formatTime(remaining)}
          </span>
        </div>
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isExpired
                ? 'bg-red-500'
                : 'bg-gradient-to-r from-green-500 to-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-5">
        <div>
          <p className="text-sm text-gray-400">Subtotal:</p>
          <p className="text-lg font-semibold text-emerald-400">
            Rp {booking.totalPrice?.toLocaleString('id-ID')}
          </p>
        </div>
        <button
          onClick={() => onCancel(booking.id)}
          className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-sm font-semibold rounded-lg transition-colors"
        >
          <XCircle size={16} />
          Batalkan
        </button>
      </div>

      {isExpired && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <p className="text-red-400 font-bold text-lg mb-1">Waktu Habis</p>
            <p className="text-xs text-gray-300">Segera perpanjang atau tutup sesi</p>
          </div>
        </div>
      )}
    </div>
  );
}
