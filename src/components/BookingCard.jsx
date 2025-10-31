import React, { useEffect, useState } from "react";
import { formatCurrency, formatTime } from "../utils/helpers";

export default function BookingCard({ booking, onCancel, onExtend, onComplete }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!booking.endTime) return;
      const diff = new Date(booking.endTime) - new Date();
      setRemaining(Math.max(0, Math.floor(diff / 1000)));
    }, 1000);
    return () => clearInterval(timer);
  }, [booking.endTime]);

  const isExpired = remaining <= 0;
  const status =
    isExpired
      ? "Waktu Habis"
      : remaining <= 10 * 60
      ? "Akan Habis"
      : "Aktif";

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-xl font-bold">{booking.room}</h3>
        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${
            status === "Aktif"
              ? "bg-green-700/30 text-green-400"
              : status === "Akan Habis"
              ? "bg-yellow-700/30 text-yellow-400"
              : "bg-red-700/30 text-red-400"
          }`}
        >
          {status}
        </span>
      </div>

      <div className="text-gray-400 text-sm mb-2">
        {formatTime(new Date(booking.startTime))} — {formatTime(new Date(booking.endTime))}
      </div>

      <div className="text-sm text-gray-400 mb-2">👥 {booking.people} orang</div>
      <div className="text-sm text-gray-400 mb-2">Kasir: {booking.cashier}</div>
      {booking.priceMeta?.freeMinutes > 0 && (
        <div className="text-green-400 text-sm mb-2">Gratis {booking.priceMeta.freeMinutes} menit</div>
      )}

      <div className="flex justify-between items-center my-2">
        <span className="text-xs text-gray-400">Sisa Waktu</span>
        <span className={`font-mono ${isExpired ? "text-red-400" : "text-green-400"}`}>
          {new Date(remaining * 1000).toISOString().substr(11, 8)}
        </span>
      </div>

      <div className="text-sm text-gray-400">Subtotal:</div>
      <div className="text-lg font-semibold text-green-400 mb-4">
        {formatCurrency(booking.priceMeta?.total || 0)}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onExtend(booking)}
          disabled={!isExpired}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            isExpired
              ? "bg-blue-600 hover:bg-blue-700"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          Perpanjang
        </button>
        <button
          onClick={() => onComplete(booking.id)}
          disabled={!isExpired}
          className={`px-4 py-2 rounded-lg text-sm font-semibold ${
            isExpired
              ? "bg-green-600 hover:bg-green-700"
              : "bg-gray-700 text-gray-500 cursor-not-allowed"
          }`}
        >
          Selesai
        </button>
        <button
          onClick={() => onCancel(booking.id)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold"
        >
          Batalkan
        </button>
      </div>
    </div>
  );
}
