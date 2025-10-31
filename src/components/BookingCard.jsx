import React, { useEffect, useState } from "react";
import { formatCurrency, formatTime } from "../utils/helpers";

export default function BookingCard({ booking, onCancel, onExtend, onComplete }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      if (!booking.endTime) return;
      const diff = new Date(booking.endTime).getTime() - Date.now();
      const sec = Math.max(0, Math.floor(diff / 1000));
      setRemaining(sec);
    }, 1000);
    return () => clearInterval(tick);
  }, [booking.endTime]);

  const durationMinutes =
    booking.durationMinutes ||
    Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000);

  const isExpired = remaining <= 0;
  const isWarning = remaining <= 10 * 60 && remaining > 0;

  const status = isExpired ? "Waktu Habis" : isWarning ? "Akan Habis" : "Aktif";
  const statusColor =
    isExpired ? "bg-red-700/30 text-red-400" :
    isWarning ? "bg-yellow-700/30 text-yellow-400" :
    "bg-green-700/30 text-green-400";

  const formatHMS = (sec) => {
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-5 shadow-lg w-full">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold">{booking.room}</h3>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColor}`}>
          {status}
        </span>
      </div>

      <div className="text-gray-400 text-sm mb-3">
        {formatTime(new Date(booking.startTime))} — {formatTime(new Date(booking.endTime))}
      </div>

      <div className="text-sm text-gray-400 mb-1">👥 {booking.people} orang</div>
      <div className="text-sm text-gray-400 mb-1">Kasir: {booking.cashier || "Tidak diketahui"}</div>
      {booking.priceMeta?.freeMinutes > 0 && (
        <div className="text-green-400 text-sm mb-2">
          Gratis {booking.priceMeta.freeMinutes} menit
        </div>
      )}

      <div className="flex items-center justify-between mt-2 mb-4">
        <div className="text-xs text-gray-400">Sisa Waktu</div>
        <div className={`font-mono ${isExpired ? "text-red-400" : "text-green-400"}`}>
          {formatHMS(remaining)}
        </div>
      </div>

      <div className="text-sm text-gray-400">Subtotal:</div>
      <div className="text-lg font-semibold text-green-400 mb-4">
        {formatCurrency(booking.priceMeta?.total || 0)}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onExtend(booking)}
          disabled={!isExpired}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
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
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
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
