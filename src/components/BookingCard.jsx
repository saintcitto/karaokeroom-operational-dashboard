import React, { useState, useEffect, useMemo } from 'react';
import { Sun, Moon, Calendar, Timer, Users, Trash2, X } from 'lucide-react';
import { formatCurrency, formatTime, formatDuration, getBookingStatus } from '../utils/helpers';
import { TARIF_PRIME_TIME } from '../data/constants';

const BookingCard = ({ booking, now, onExpire, onCancel }) => {

  const { status, sisaWaktuStr } = useMemo(() => {
    const timeLeftMs = booking.endTime.getTime() - now.getTime();
    let sisaWaktuStr;

    if (timeLeftMs <= 0) {
      sisaWaktuStr = 'Waktu Habis';
    } else {
      const sisaDetik = Math.floor(timeLeftMs / 1000);
      const jam = Math.floor(sisaDetik / 3600);
      const menit = Math.floor((sisaDetik % 3600) / 60);
      const detik = sisaDetik % 60;
      sisaWaktuStr = `${String(jam).padStart(2, '0')}j ${String(menit).padStart(2, '0')}m ${String(detik).padStart(2, '0')}d`;
    }
    
    const status = getBookingStatus(booking.endTime, now);
    
    return { status, sisaWaktuStr };
  }, [booking.endTime, now, booking.endTime, now]);
  
  const [hasExpired, setHasExpired] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  useEffect(() => {
    if (status === 'expired' && !hasExpired) {
      setHasExpired(true);
      onExpire(booking);
    }
  }, [status, hasExpired, booking, onExpire]);

  const cardStyles = {
    normal: 'bg-gray-800 border-gray-700',
    warning: 'bg-yellow-900/50 border-yellow-700',
    expired: 'bg-red-900/50 border-red-700 animate-pulse',
  };

  const isPrimeTime = booking.tarif === TARIF_PRIME_TIME;

  return (
    <div className={`p-4 rounded-lg border shadow-lg ${cardStyles[status]} transition-all duration-300 flex flex-col`}>
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-bold">{booking.room}</h3>
        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${isPrimeTime ? 'bg-purple-600 text-purple-100' : 'bg-green-600 text-green-100'}`}>
          {isPrimeTime ? 'Prime Time' : 'Happy Hour'}
        </span>
      </div>
      
      <div className="text-center my-2 p-3 bg-black/20 rounded-lg">
        <div className="text-xs text-gray-400 uppercase">Sisa Waktu</div>
        <div className={`text-3xl font-bold ${status === 'warning' && 'text-yellow-300'} ${status === 'expired' && 'text-red-400'}`}>
          {sisaWaktuStr}
        </div>
      </div>
      
      <div className="space-y-2 text-sm mt-4">
        <div className="flex items-center gap-2">
          {isPrimeTime ? <Moon size={16} className="text-purple-400" /> : <Sun size={16} className="text-yellow-400" />}
          <span>{formatTime(booking.startTime)} &rarr; {formatTime(booking.endTime)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-gray-400" />
          <span>{booking.startTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer size={16} className="text-gray-400" />
          <span>Durasi: {formatDuration(booking.durationInMinutes)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Users size={16} className="text-gray-400" />
          <span>Jumlah: {booking.people} Orang</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-gray-700/50 space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Tarif / Jam:</span>
          <span className="font-medium">{formatCurrency(booking.tarif)}</span>
        </div>
        {booking.overCapacityCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Over Charge:</span>
            <span className="font-medium text-yellow-400">{formatCurrency(booking.overCapacityCharge)}</span>
          </div>
        )}
        <div className="flex justify-between text-lg">
          <span className="text-gray-300 font-bold">Total Harga:</span>
          <span className="font-bold text-green-400">{formatCurrency(booking.totalPrice)}</span>
        </div>
      </div>
      
      {status !== 'expired' && (
        <div className="mt-4 pt-3 border-t border-gray-600">
          {!isConfirmingCancel ? (
            <button
              onClick={() => setIsConfirmingCancel(true)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-red-800 text-red-100 text-sm font-medium rounded-md hover:bg-red-700 transition-colors duration-200"
            >
              <Trash2 size={16} />
              Batalkan Sesi Ini
            </button>
          ) : (
            <div className="text-center">
              <p className="text-sm text-yellow-400 mb-3">Yakin ingin membatalkan?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsConfirmingCancel(false)}
                  className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-500"
                >
                  <X size={16} className="inline-block mr-1" />
                  Tidak
                </button>
                <button
                  onClick={() => {
                    setIsConfirmingCancel(false);
                    onCancel(booking.id);
                  }}
                  className="flex-1 px-3 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-500"
                >
                  <Trash2 size={16} className="inline-block mr-1" />
                  Ya, Hapus
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      
    </div>
  );
};

export default BookingCard;
