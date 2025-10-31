// src/components/BookingCard.jsx
import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatTime } from "../utils/helpers";

export default function BookingCard({ booking = {}, onCancel = () => {}, onExtend = () => {}, onComplete = () => {} }) {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!booking.endTime) return;
    const update = () => {
      const end = new Date(booking.endTime).getTime();
      const diff = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setRemainingSec(diff);
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, [booking.endTime]);

  const durationMin = booking.durationMinutes || 0;
  const bonus = booking.priceMeta?.freeMinutes || 0;
  const totalMin = durationMin + bonus;

  const pct = totalMin > 0 ? Math.min(100, ((totalMin - remainingSec / 60) / totalMin) * 100) : 0;

  const isExpired = remainingSec <= 0;
  const isWarning = remainingSec > 0 && remainingSec <= 10 * 60; // 10 menit peringatan

  const hms = (s) => {
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const countdownClass = isExpired ? "text-red-400 animate-pulse" : isWarning ? "text-yellow-300" : "text-green-400";

  return (
    <motion.div layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }} className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{booking.room}</h3>
          <div className="text-sm text-gray-400 mt-1">{formatTime(new Date(booking.startTime))} — {formatTime(new Date(booking.endTime))}</div>
        </div>
        <div className="text-sm text-gray-400">{Math.round(totalMin)} m</div>
      </div>

      <div className="text-sm text-gray-400 mb-2">👥 {booking.people || 0} orang</div>
      <div className="text-sm text-gray-400 mb-2">Kasir: {booking.cashier || "Tidak diketahui"}</div>

      {bonus > 0 && <div className="text-green-400 mb-3">Gratis {bonus} menit</div>}

      <div className="mb-3">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            {/* animated width */}
            <motion.div
              animate={{ width: `${Math.max(0, pct)}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>

          <div className={`font-mono ${countdownClass} text-sm`}>
            {hms(remainingSec)}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400">Subtotal:</div>
        <div className="text-lg font-semibold text-green-400">{formatCurrency(booking.priceMeta?.total || 0)}</div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => onExtend(booking)} disabled={!isExpired} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isExpired ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}>Perpanjang</button>

        <button onClick={() => onComplete(booking.id)} disabled={!isExpired} className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isExpired ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}>Selesai</button>

        <button onClick={() => onCancel(booking.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-semibold">Batalkan</button>
      </div>
    </motion.div>
  );
}
