import React, { useEffect, useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebaseConfig";

export default function BookingCard({ bookingId, booking }) {
  const [remainingTime, setRemainingTime] = useState("");
  const [isEndingSoon, setIsEndingSoon] = useState(false);

  useEffect(() => {
    if (!booking.endTime) return;
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const end = new Date(booking.endTime).getTime();
      const diff = end - now;
      if (diff <= 0) {
        update(ref(db, `bookings/${bookingId}`), { status: "expired" });
        clearInterval(interval);
        setRemainingTime("00:00:00");
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      setIsEndingSoon(diff < 10 * 60 * 1000);
    }, 1000);
    return () => clearInterval(interval);
  }, [booking.endTime, bookingId]);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}.${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const cancelBooking = async () => update(ref(db, `bookings/${bookingId}`), { status: "cancelled" });

  const promo =
    booking.bonusMinutes === 30 ? "+30 Menit Promo" :
    booking.bonusMinutes === 60 ? "+1 Jam Promo" : null;

  return (
    <div className={`relative p-5 rounded-2xl border transition-all duration-500 shadow-lg ${isEndingSoon ? "border-red-500 animate-pulse bg-gradient-to-br from-gray-800/60 to-red-900/40" : "border-gray-700 bg-gray-800/70 hover:scale-[1.02]"}`}>
      <div className="flex justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{booking.room}</h3>
          <p className="text-sm text-gray-400 mt-1">⏰ {formatTime(booking.startTime)} - {formatTime(booking.endTime)}</p>
        </div>
        {promo && <span className="text-xs bg-pink-600/30 text-pink-300 px-2 py-1 rounded-md font-medium">{promo}</span>}
      </div>

      <div className="mt-3 text-sm text-gray-300 space-y-1">
        <p>👥 {booking.people} orang</p>
        <p>💳 Kasir: {booking.cashier}</p>
        <p>⏱ {booking.inputDurationMinutes} menit {booking.bonusMinutes > 0 && <span className="text-pink-400">(+{booking.bonusMinutes} promo)</span>}</p>
      </div>

      <div className="mt-3 border-t border-gray-700 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Sisa Waktu:</span>
          <span className={`font-mono text-lg ${isEndingSoon ? "text-red-400" : "text-green-400"}`}>{remainingTime}</span>
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-400">Subtotal:</span>
          <span className="text-green-400 font-semibold text-lg">Rp {booking.subtotal.toLocaleString("id-ID")}</span>
        </div>
      </div>

      <button onClick={cancelBooking} className="w-full mt-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 font-semibold text-sm transition-all">❌ Batalkan</button>
    </div>
  );
}
