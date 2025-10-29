import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MODAL_TIMEOUT } from '../data/constants';

export default function ExpiredModal({ booking, onComplete, onExtend }) {
  useEffect(() => {
    if (!booking?.id) return;
    const timer = setTimeout(() => onComplete(booking.id), MODAL_TIMEOUT);
    return () => clearTimeout(timer);
  }, [booking, onComplete]);

  if (!booking || !booking.room) return null;

  const roomName = booking.room || '-';
  const startTime =
    booking.startTime instanceof Date
      ? booking.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '-';
  const endTime =
    booking.endTime instanceof Date
      ? booking.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '-';
  const total = booking.totalPrice ? `Rp${booking.totalPrice.toLocaleString('id-ID')}` : '-';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-sm w-full border border-red-500">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Waktu Habis!</h2>
          <p className="text-lg text-gray-300 mb-3">
            Pemesanan untuk <span className="font-bold text-white">{roomName}</span> telah selesai.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {startTime} → {endTime} <br /> Total: <span className="text-green-400 font-semibold">{total}</span>
          </p>
          <div className="w-full space-y-3">
            <button
              onClick={() => booking?.id && onExtend(booking)}
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
            >
              Tambah Waktu
            </button>
            <button
              onClick={() => booking?.id && onComplete(booking.id)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 font-medium rounded-md hover:bg-gray-500 transition-colors"
            >
              Selesaikan Sesi (Hapus)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
