import React, { useEffect, useState, useMemo } from "react";
import { formatCurrency, formatTime } from "../utils/helpers";

function secondsToHMS(sec) {
  if (!Number.isFinite(sec)) sec = 0;
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

  const durationMinutes = booking.durationMinutes || (booking.startTime && booking.endTime ? Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000) : 0);

  // pricing stored under booking.priceMeta if exists
  const subtotal = useMemo(() => {
    if (booking.priceMeta && typeof booking.priceMeta.total === "number") return booking.priceMeta.total;
    return 0;
  }, [booking.priceMeta]);

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm w-full max-w-xl">
      <div className="flex justify-between items-start mb-3">
        <div className="text-lg font-semibold">{booking.room || "—"}</div>
        <div className="text-sm text-gray-300">{durationMinutes ? `${durationMinutes} menit` : ""}</div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        <div>{booking.startTime ? formatTime(new Date(booking.startTime)) : "--"} — {booking.endTime ? formatTime(new Date(booking.endTime)) : "--"}</div>
        <div className="mt-2">👥 {booking.people || 0} orang</div>
        <div>Kasir: {booking.cashier || booking.createdBy || "Tidak Diketahui"}</div>
        {booking.priceMeta?.freeMinutes > 0 && <div className="text-green-400 mt-2">Bonus: +{booking.priceMeta.freeMinutes} menit</div>}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              style={{
                width: `${Math.max(0, Math.min(100, ((durationMinutes + (booking.priceMeta?.freeMinutes || 0)) - Math.ceil(remaining / 60)) / (durationMinutes + (booking.priceMeta?.freeMinutes || 0)) * 100 || 0))}%`
              }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>
          <div className="text-green-400 monospace text-sm">{secondsToHMS(remaining)}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(subtotal)}</div>
        </div>

        <div className="flex gap-3 ml-auto">
          <button onClick={() => onExtend(booking)} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">Perpanjang</button>
          <button onClick={() => onComplete(booking.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg">Selesai</button>
          <button onClick={() => onCancel(booking.id)} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">Batalkan</button>
        </div>
      </div>
    </div>
  );
}
