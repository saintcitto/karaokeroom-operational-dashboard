import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/helpers";

function secondsToHMS(sec) {
  if (typeof sec !== "number" || isNaN(sec)) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
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

  const durationMinutes = booking.durationMinutes || (() => {
    if (booking.startTime && booking.endTime) {
      const s = new Date(booking.startTime);
      const e = new Date(booking.endTime);
      return Math.max(0, Math.round((e - s) / 60000));
    }
    return 0;
  })();

  const bonusMinutes = booking.priceMeta && booking.priceMeta.freeMinutes ? booking.priceMeta.freeMinutes : 0;
  const totalMinutesWithBonus = durationMinutes + bonusMinutes;
  const progressPercent = totalMinutesWithBonus > 0 ? Math.max(0, Math.min(100, ((totalMinutesWithBonus - Math.floor(remaining/60)) / totalMinutesWithBonus) * 100)) : 0;
  const subtotal = booking.priceMeta ? booking.priceMeta.total : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm w-full relative">
      <div className="flex justify-between items-start mb-3">
        <div className="text-lg font-semibold"> {booking.room || "—"} </div>
        <div className="text-sm text-gray-300">{totalMinutesWithBonus ? `${totalMinutesWithBonus} m` : ""}</div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        <div>{booking.startTime ? new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "--"} — {booking.endTime ? new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : "--"}</div>
        <div className="mt-2">👥 {booking.people || 0} orang</div>
        <div>Kasir: {booking.cashier || "Tidak Diketahui"}</div>
        {bonusMinutes > 0 && <div className="text-green-400 mt-2">Gratis {bonusMinutes} menit</div>}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-gray-700 rounded-full mr-4 overflow-hidden">
            <div style={{width: `${progressPercent}%`}} className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-700"></div>
          </div>
          <div className="text-green-400 monospace text-sm">{secondsToHMS(remaining)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 gap-4">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(subtotal)}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onExtend(booking.id)} disabled className="px-4 py-2 bg-blue-600 text-white rounded-lg opacity-50 cursor-not-allowed">Perpanjang</button>
          <button onClick={() => onComplete(booking.id)} className="px-4 py-2 bg-green-600 text-white rounded-lg">Selesai</button>
          <button onClick={() => onCancel(booking.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Batalkan</button>
        </div>
      </div>
    </div>
  );
}
