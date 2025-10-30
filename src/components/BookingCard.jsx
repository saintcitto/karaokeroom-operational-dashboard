import React, { useEffect, useMemo, useState } from "react";
import { remove, ref, update } from "firebase/database";
import { db } from "../firebaseConfig";

export default function BookingCard({ booking }) {
  const [now, setNow] = useState(new Date());
  const id = booking?.id || booking?.key || null;

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = useMemo(() => (booking?.startTime ? new Date(booking.startTime) : null), [booking]);
  const end = useMemo(() => (booking?.endTime ? new Date(booking.endTime) : null), [booking]);

  const remainingMs = end && now ? Math.max(0, end.getTime() - now.getTime()) : 0;
  const remaining = {
    hours: String(Math.floor(remainingMs / 3600000)).padStart(2, "0"),
    minutes: String(Math.floor((remainingMs % 3600000) / 60000)).padStart(2, "0"),
    seconds: String(Math.floor((remainingMs % 60000) / 1000)).padStart(2, "0"),
  };

  const formatCurrency = (v) => {
    const n = Number.isFinite(Number(v)) ? Number(v) : 0;
    return new Intl.NumberFormat("id-ID").format(n);
  };

  const totalPrice = Number.isFinite(Number(booking?.totalPrice)) ? Number(booking.totalPrice) : 0;
  const bonusMinutes = Number.isFinite(Number(booking?.bonusMinutes)) ? Number(booking.bonusMinutes) : 0;

  const handleCancel = async () => {
    if (!id) return;
    await remove(ref(db, `bookings/${id}`));
  };

  return (
    <div className="bg-[#0f1720] rounded-2xl p-5 w-full max-w-md border border-gray-800 shadow-lg">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-lg font-bold text-white mb-1">{booking?.room || "—"}</div>
          <div className="text-sm text-gray-400">
            {start && end ? `${start.toTimeString().slice(0, 5)} · ${end.toTimeString().slice(0, 5)}` : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-300">⏱ {booking?.durationTotalMinutes || booking?.durationMinutes || 0} menit</div>
        </div>
      </div>

      <div className="text-sm text-gray-300 mb-3">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-gray-400">👥</span>
          <span>{booking?.people || 0} orang</span>
        </div>
        <div className="flex items-center gap-3 mb-1">
          <span className="text-gray-400">🏷</span>
          <span>Kasir: {booking?.cashier || "Tidak Diketahui"}</span>
        </div>
        {bonusMinutes > 0 && (
          <div className="mt-2 inline-block px-3 py-1 rounded-full bg-pink-600/10 text-pink-300 text-xs font-semibold">
            BONUS {bonusMinutes} menit
          </div>
        )}
      </div>

      <div className="mt-3 mb-4">
        <div className="text-xs text-gray-400 mb-1">Sisa Waktu:</div>
        <div className="flex items-center justify-between">
          <div className="text-green-400 font-mono text-lg">{`${remaining.hours}:${remaining.minutes}:${remaining.seconds}`}</div>
          <div className="w-3/5 bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              style={{
                width: start && end ? `${Math.max(0, Math.min(100, ((end.getTime() - now.getTime()) / (end.getTime() - start.getTime())) * 100))}%` : "0%",
              }}
              className="h-2 bg-gradient-to-r from-green-400 to-blue-400 transition-width duration-500"
            />
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 pt-4 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-green-300 font-semibold text-lg">Rp {formatCurrency(totalPrice)}</div>
        </div>
        <button onClick={handleCancel} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-white font-semibold">
          Batalkan
        </button>
      </div>
    </div>
  );
}
