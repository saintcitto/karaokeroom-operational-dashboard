import React, { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../utils/helpers";

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
  onComplete = () => {},
}) {
  const [remaining, setRemaining] = useState(0);

  const startTime = booking.startTime ? new Date(booking.startTime) : null;
  const endTime = booking.endTime ? new Date(booking.endTime) : null;

  useEffect(() => {
    const tick = () => {
      if (!endTime) return setRemaining(0);
      const now = new Date();
      const sec = Math.max(0, Math.floor((endTime - now) / 1000));
      setRemaining(sec);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [booking.endTime]);

  const durationMinutes = booking.durationMinutes || (() => {
    if (startTime && endTime) {
      return Math.max(0, Math.round((endTime - startTime) / 60000));
    }
    return 0;
  })();

  const cashier = booking.cashier || "Tidak diketahui";
  const people = booking.people || 0;

  // --- handle promo / priceMeta safely ---
  const priceMeta = booking.priceMeta || {};
  const bonusMinutes = priceMeta.freeMinutes || 0;
  const promoNote = priceMeta.promoNote || "-";
  const totalPrice = priceMeta.total || booking.total || 0;

  const totalMinutesWithBonus = durationMinutes + bonusMinutes;

  const progressPct = useMemo(() => {
    if (!endTime || !startTime) return 0;
    const total = (endTime - startTime) / 1000;
    const elapsed = total - remaining;
    return Math.max(0, Math.min(100, (elapsed / total) * 100));
  }, [startTime, endTime, remaining]);

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md w-full flex flex-col gap-4 transition hover:border-pink-500/40 hover:shadow-pink-500/10">
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-semibold">{booking.room || "–"}</div>
          <div className="text-sm text-gray-400">
            {startTime
              ? `${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "--"}{" "}
            —{" "}
            {endTime
              ? `${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : "--"}
          </div>
        </div>
        <div className="text-sm text-gray-300">{durationMinutes} m</div>
      </div>

      <div className="text-sm text-gray-400 space-y-1">
        <div>👥 {people} orang</div>
        <div>Kasir: <span className="text-gray-200">{cashier}</span></div>
        {promoNote !== "-" && (
          <div className="text-green-400 font-medium">{promoNote}</div>
        )}
      </div>

      <div className="mt-2">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-gray-700 rounded-full mr-4 overflow-hidden">
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>
          <div className="text-green-400 monospace text-sm">{secondsToHMS(remaining)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(totalPrice)}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onExtend(booking)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm"
          >
            Perpanjang
          </button>
          <button
            onClick={() => onComplete(booking.id)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-white text-sm"
          >
            Selesai
          </button>
          <button
            onClick={() => onCancel(booking.id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white text-sm"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
