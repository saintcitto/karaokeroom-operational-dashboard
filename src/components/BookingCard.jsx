// src/components/BookingCard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatTime } from "../utils/helpers";

function secondsToHMS(sec) {
  if (typeof sec !== "number" || isNaN(sec)) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BookingCard({ booking = {}, onCancel = () => {}, onExtend = () => {}, onComplete = () => {} }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const end = booking.endTime ? new Date(booking.endTime) : null;
      const sec = end ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) : 0;
      setRemaining(sec);
    };
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [booking.endTime]);

  const durationMinutes = booking.durationMinutes || (booking.startTime && booking.endTime ? Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000) : 0);

  const bonusText = booking.priceMeta && booking.priceMeta.freeMinutes ? `Gratis ${booking.priceMeta.freeMinutes} menit` : null;
  const subtotal = booking.priceMeta ? booking.priceMeta.total : 0;

  const progressPercent = (() => {
    const total = (durationMinutes + (booking.priceMeta?.freeMinutes || 0)) || 1;
    const elapsed = total - Math.round(remaining / 60);
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  })();

  const isExpired = booking.expired || remaining <= 0;

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm w-full overflow-hidden relative">
      <div className="flex justify-between items-start mb-3">
        <div className="text-lg font-semibold"> {booking.room || "—"} </div>
        <div className="text-sm text-gray-300">{durationMinutes ? `${durationMinutes} menit` : ""}</div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        <div>{booking.startTime ? formatTime(new Date(booking.startTime)) : "--"} — {booking.endTime ? formatTime(new Date(booking.endTime)) : "--"}</div>
        <div className="mt-2">👥 {booking.people || 0} orang</div>
        <div>Kasir: {booking.cashier || "Tidak Diketahui"}</div>
        {bonusText && <div className="text-green-400 mt-2">{bonusText}</div>}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-gray-700 rounded-full mr-4 overflow-hidden">
            <div style={{ width: `${progressPercent}%` }} className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all" />
          </div>
          <div className={`monospace text-sm ${isExpired ? "text-red-400" : "text-green-400"}`}>{secondsToHMS(remaining)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(subtotal)}</div>
        </div>

        {/* button group inside card */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onExtend(booking)}
            disabled={isExpired}
            className={`px-4 py-2 rounded-lg text-white text-sm ${isExpired ? "bg-gray-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Perpanjang
          </button>

          <button
            onClick={() => onComplete(booking.id)}
            disabled={isExpired}
            className={`px-4 py-2 rounded-lg text-white text-sm ${isExpired ? "bg-gray-700" : "bg-emerald-600 hover:bg-emerald-700"}`}
          >
            Selesai
          </button>

          <button
            onClick={() => onCancel(booking.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
