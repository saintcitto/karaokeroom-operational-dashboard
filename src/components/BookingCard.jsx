import React, { useEffect, useState } from "react";
import { formatCurrency } from "../utils/helpers";

export default function BookingCard({ booking = {}, onCancel = () => {}, onExtend = () => {}, onComplete = () => {} }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [progressPct, setProgressPct] = useState(0);
  const expired = !!booking.expired;
  const start = booking.startTime ? new Date(booking.startTime) : null;
  const end = booking.endTime ? new Date(booking.endTime) : null;
  const effectiveMinutes = Number(booking.effectiveDurationMinutes || booking.durationMinutes || 0);

  useEffect(() => {
    if (!start || !end) return;
    const tick = () => {
      const now = new Date();
      const totalMs = end.getTime() - start.getTime();
      const leftMs = Math.max(0, end.getTime() - now.getTime());
      const left = leftMs;
      const leftH = String(Math.floor(left / 3600000)).padStart(2,'0');
      const leftM = String(Math.floor((left % 3600000) / 60000)).padStart(2,'0');
      const leftS = String(Math.floor((left % 60000) / 1000)).padStart(2,'0');
      setTimeLeft(`${leftH}:${leftM}:${leftS}`);
      const pct = totalMs > 0 ? Math.max(0, Math.min(100, ((totalMs - leftMs) / totalMs) * 100)) : 100;
      setProgressPct(pct);
    };
    tick();
    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [start, end]);

  const handleExtend = () => {
    if (!booking.id) return;
    onExtend(booking.id);
  };

  const handleComplete = () => {
    if (!booking.id) return;
    onComplete(booking.id);
  };

  const handleCancel = () => {
    if (!booking.id) return;
    onCancel(booking.id);
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-inner relative">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-xl font-semibold">{booking.room}</div>
          <div className="text-sm text-gray-400 mt-2">
            {start && end ? `${start.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false})} — ${end.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false})}` : "-"}
          </div>
          <div className="text-sm text-gray-400 mt-3 flex items-center gap-2">
            <span>👥</span>
            <span>{booking.people || 0} orang</span>
          </div>
          <div className="text-sm text-gray-400 mt-2">Kasir: {booking.cashier || "Tidak Diketahui"}</div>
          {booking.priceMeta && booking.priceMeta.freeMinutes > 0 && (
            <div className="text-sm text-green-400 mt-2">Gratis {booking.priceMeta.freeMinutes} menit</div>
          )}
        </div>
        <div className="text-sm text-gray-300">{Math.round(effectiveMinutes)} m</div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="w-full bg-gray-700 rounded h-3 overflow-hidden">
          <div style={{ width: `${progressPct}%` }} className={`h-3 rounded transition-all`} />
        </div>
        <div className="text-green-400 font-mono text-sm mt-2 text-right">{timeLeft}</div>
      </div>

      <div className="mt-4">
        <div className="text-sm text-gray-400">Subtotal:</div>
        <div className="text-2xl text-green-400 font-semibold">{booking.priceMeta ? formatCurrency(booking.priceMeta.total) : "Rp0"}</div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        {!expired && (
          <>
            <button onClick={handleExtend} className="px-4 py-2 bg-blue-600 rounded text-white" type="button">Perpanjang</button>
            <button onClick={handleComplete} className="px-4 py-2 bg-green-600 rounded text-white" type="button">Selesai</button>
          </>
        )}
        <button onClick={handleCancel} className={`px-4 py-2 rounded text-white ${expired ? "bg-gray-600" : "bg-red-600"}`} type="button">Batalkan</button>
      </div>
    </div>
  );
}
