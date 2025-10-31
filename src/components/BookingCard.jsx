import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrency, formatTime } from "../utils/helpers";

export default function BookingCard({ booking = {}, onCancel = () => {}, onExtend = () => {}, onComplete = () => {} }) {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    if (!booking.endTime) return;
    const update = () => {
      const diff = new Date(booking.endTime).getTime() - Date.now();
      setRemainingSec(Math.max(0, Math.floor(diff / 1000)));
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [booking.endTime]);

  const totalDurationMin =
    booking.durationMinutes ||
    Math.max(0, Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000));

  const bonus = booking.priceMeta?.freeMinutes || 0;
  const totalWithBonus = totalDurationMin + bonus;
  const progressPct = totalWithBonus > 0 ? Math.min(100, ((totalWithBonus - remainingSec / 60) / totalWithBonus) * 100) : 0;

  const isExpired = remainingSec <= 0;
  const isEnding = remainingSec > 0 && remainingSec <= 30 * 60; // 30 minutes threshold for "akan habis"

  const formatHMS = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const sec = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${sec}`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.25 }}
      className="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-sm max-w-xl"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{booking.room}</h3>
          <div className="text-sm text-gray-400 mt-1">
            {formatTime(new Date(booking.startTime))} — {formatTime(new Date(booking.endTime))}
          </div>
        </div>

        <div className="text-sm text-gray-400">{Math.round(totalDurationMin)} m</div>
      </div>

      <div className="text-sm text-gray-400 mb-2">👥 {booking.people || 0} orang</div>
      <div className="text-sm text-gray-400 mb-2">Kasir: {booking.cashier || "Tidak diketahui"}</div>

      {bonus > 0 && <div className="text-green-400 mb-3">Gratis {bonus} menit</div>}

      <div className="mb-3">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div style={{ width: `${Math.max(0, progressPct)}%` }} className="h-full bg-gradient-to-r from-green-400 to-green-600" />
          </div>
          <div className={`font-mono ${isExpired ? "text-red-400" : "text-green-400"}`}>{formatHMS(remainingSec)}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs text-gray-400">Subtotal:</div>
        <div className="text-lg font-semibold text-green-400">{formatCurrency(booking.priceMeta?.total || 0)}</div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => onExtend(booking)}
          disabled={!isExpired}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isExpired ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
        >
          Perpanjang
        </button>

        <button
          onClick={() => onComplete(booking.id)}
          disabled={!isExpired}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${isExpired ? "bg-green-600 hover:bg-green-700 text-white" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
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
    </motion.div>
  );
}
