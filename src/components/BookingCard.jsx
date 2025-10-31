import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency, formatTime } from "../utils/helpers";

function secondsToHMS(sec) {
  if (typeof sec !== "number" || isNaN(sec)) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function BookingCard({
  booking = {},
  onCancel = () => {},
  onExtend = () => {},
  onComplete = () => {}
}) {
  const [remainingSec, setRemainingSec] = useState(0);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const end = booking.endTime ? new Date(booking.endTime) : booking.end ? new Date(booking.end) : null;
      const sec = end ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) : 0;
      setRemainingSec(sec);
    };
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [booking.endTime, booking.end]);

  const durationMinutes = booking.durationMinutes || (booking.endTime && booking.startTime ? Math.max(0, Math.round((new Date(booking.endTime) - new Date(booking.startTime)) / 60000)) : 0);

  const bonusMinutes = useMemo(() => {
    if (booking.freeMinutes != null) return Number(booking.freeMinutes);
    if (durationMinutes === 120) return 30;
    if (durationMinutes === 180) return 60;
    return 0;
  }, [booking.freeMinutes, durationMinutes]);

  const totalMinutesWithBonus = Math.max(1, durationMinutes + bonusMinutes);

  const progressPct = useMemo(() => {
    const elapsed = Math.max(0, totalMinutesWithBonus * 60 - remainingSec);
    if (!totalMinutesWithBonus) return 0;
    return Math.min(100, Math.round((elapsed / (totalMinutesWithBonus * 60)) * 100));
  }, [totalMinutesWithBonus, remainingSec]);

  const subtotal = useMemo(() => {
    const unit = booking.pricePer30Min || booking.priceMeta?.tarif || 0;
    const blocks = Math.ceil(totalMinutesWithBonus / 30);
    return blocks * unit;
  }, [totalMinutesWithBonus, booking]);

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm w-full">
      <div className="flex justify-between items-start mb-3">
        <div className="text-lg font-semibold">{booking.room || "—"}</div>
        <div className="text-sm text-gray-300">{durationMinutes ? `${durationMinutes} m` : ""}</div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        <div>{booking.startTime ? formatTime(new Date(booking.startTime)) : booking.start ? formatTime(new Date(booking.start)) : "--"} — {booking.endTime ? formatTime(new Date(booking.endTime)) : booking.end ? formatTime(new Date(booking.end)) : "--"}</div>
        <div className="mt-2">👥 {Number(booking.people || booking.count || 0)} orang</div>
        <div>Kasir: {booking.cashier || booking.handledBy || "Tidak Diketahui"}</div>
        {bonusMinutes > 0 && <div className="text-green-400 mt-2">Bonus: +{bonusMinutes} menit</div>}
        {booking.promoNote && <div className="text-blue-300 mt-1">{booking.promoNote}</div>}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-gray-700 rounded-full mr-4 overflow-hidden">
            <div style={{ width: `${progressPct}%` }} className="h-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500" />
          </div>
          <div className="text-green-400 monospace text-sm">{secondsToHMS(remainingSec)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(subtotal || booking.totalPrice || 0)}</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onExtend(booking)} className="px-3 py-2 bg-blue-600 text-white rounded-lg">Perpanjang</button>
          <button onClick={() => onComplete(booking.id)} className="px-3 py-2 bg-emerald-600 text-white rounded-lg">Selesai</button>
          <button onClick={() => onCancel(booking.id)} className="px-3 py-2 bg-red-600 text-white rounded-lg">Batalkan</button>
        </div>
      </div>
    </div>
  );
}
