import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { MODAL_TIMEOUT } from '../data/constants';

const ExpiredModal = ({ booking, onComplete, onExtend }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete(booking.id);
    }, MODAL_TIMEOUT);
    
    return () => clearTimeout(timer);
  }, [booking, onComplete]);

  if (!booking) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 p-6 rounded-lg shadow-2xl max-w-sm w-full border border-red-500">
        <div className="flex flex-col items-center text-center">
          <AlertTriangle size={48} className="text-red-500 mb-4 animate-pulse" />
          <h2 className="text-2xl font-bold text-white mb-2">Waktu Habis!</h2>
          <p className="text-lg text-gray-300 mb-6">
            Pemesanan untuk <span className="font-bold text-white">{booking.room}</span> telah selesai.
          </p>
          <div className="w-full space-y-3">
            <button
              onClick={() => onExtend(booking)}
              className="w-full px-4 py-3 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 transition-colors"
            >
              Tambah Waktu
            </button>
            <button
              onClick={() => onComplete(booking.id)}
              className="w-full px-4 py-3 bg-gray-600 text-gray-200 font-medium rounded-md hover:bg-gray-500 transition-colors"
            >
              Selesaikan Sesi (Hapus)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiredModal;
