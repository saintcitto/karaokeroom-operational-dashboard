// src/components/BookingCard.jsx
import React, { useEffect, useMemo, useState } from "react";

function formatCurrency(n) {
  try {
    return n.toLocaleString("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  } catch {
    return "Rp0";
  }
}

function secondsToHMS(sec) {
  if (typeof sec !== "number" || Number.isNaN(sec)) sec = 0;
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
  pricing = { ratePerHour: 45000 },
  promotions = { 120: 30, 180: 60 }, // minutes => bonus minutes
}) {
  // normalize incoming times
  const startTime = booking.startTime ? (booking.startTime instanceof Date ? booking.startTime : new Date(booking.startTime)) : null;
  const endTime = booking.endTime ? (booking.endTime instanceof Date ? booking.endTime : new Date(booking.endTime)) : null;

  // compute duration minutes (original) and bonus
  const durationMinutes = booking.durationMinutes || (startTime && endTime ? Math.max(0, Math.round((endTime - startTime) / 60000)) : 0);

  const bonusMinutes = useMemo(() => {
    const keys = Object.keys(promotions || {}).map((k) => parseInt(k, 10)).filter(Boolean);
    for (let k of keys.sort((a, b) => b - a)) {
      if (durationMinutes >= k) return promotions[k] || 0;
    }
    return 0;
  }, [durationMinutes, promotions]);

  const totalMinutesWithBonus = durationMinutes + (bonusMinutes || 0);

  // compute price: billing is by hour blocks (as in original logic)
  const subtotal = useMemo(() => {
    const rateHour = pricing.ratePerHour || 0;
    const hoursToBill = Math.ceil(totalMinutesWithBonus / 60);
    return hoursToBill * rateHour;
  }, [totalMinutesWithBonus, pricing]);

  // live remaining seconds
  const [remainingSec, setRemainingSec] = useState(() => {
    if (!endTime) return 0;
    return Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000));
  });

  useEffect(() => {
    const compute = () => {
      if (!endTime) {
        setRemainingSec(0);
        return;
      }
      setRemainingSec(Math.max(0, Math.floor((endTime.getTime() - Date.now()) / 1000)));
    };
    compute();
    const t = setInterval(compute, 1000);
    return () => clearInterval(t);
  }, [endTime]);

  // progress: percent elapsed of totalMinutesWithBonus
  const progressPercent = useMemo(() => {
    if (!startTime || !endTime || totalMinutesWithBonus <= 0) return 0;
    const totalSec = totalMinutesWithBonus * 60;
    const elapsedSec = Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 1000));
    return Math.max(0, Math.min(100, (elapsedSec / totalSec) * 100));
  }, [startTime, endTime, totalMinutesWithBonus, remainingSec]);

  const isExpired = remainingSec <= 0 || !!booking.expired;
  // Buttons: Perpanjang & Selesai only enabled when expired (matching your UX request)
  const canExtendOrComplete = isExpired;

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm w-full relative">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-lg font-semibold">{booking.room || "—"}</div>
          <div className="text-xs text-gray-400 mt-1">
            {startTime ? startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"} —{" "}
            {endTime ? endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "--"}
          </div>
        </div>
        <div className="text-sm text-gray-300">{totalMinutesWithBonus} m</div>
      </div>

      <div className="text-sm text-gray-400 mb-4">
        <div>👥 {booking.people || 0} orang</div>
        <div>Kasir: {booking.cashier || "Tidak Diketahui"}</div>
        {bonusMinutes > 0 && <div className="text-green-400 mt-2">Gratis {bonusMinutes} menit</div>}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              style={{ width: `${progressPercent}%` }}
              className={`h-full ${isExpired ? "bg-red-500" : "bg-gradient-to-r from-green-400 to-green-600"}`}
            />
          </div>
          <div className={`monospace text-sm ${isExpired ? "text-red-400" : "text-green-400"}`}>{secondsToHMS(remainingSec)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(subtotal)}</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onExtend(booking)}
            disabled={!canExtendOrComplete}
            className={`px-4 py-2 rounded-lg text-white text-sm transition ${
              canExtendOrComplete ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Perpanjang
          </button>

          <button
            onClick={() => onComplete(booking.id)}
            disabled={!canExtendOrComplete}
            className={`px-4 py-2 rounded-lg text-white text-sm transition ${
              canExtendOrComplete ? "bg-emerald-600 hover:bg-emerald-700" : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            Selesai
          </button>

          <button
            onClick={() => onCancel(booking.id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
          >
            Batalkan
          </button>
        </div>
      </div>
    </div>
  );
}
