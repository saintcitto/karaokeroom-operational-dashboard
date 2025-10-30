import React, { useEffect, useRef, useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebaseConfig";

export default function BookingCard({ bookingId, booking }) {
  const [remainingTime, setRemainingTime] = useState("");
  const [isEndingSoon, setIsEndingSoon] = useState(false);
  const frameRef = useRef(null);

  useEffect(() => {
    if (!booking?.endTime) return;

    const animate = () => {
      const now = Date.now();
      const end = new Date(booking.endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        update(ref(db, `bookings/${bookingId}`), { status: "expired" });
        setRemainingTime("00:00:00");
        cancelAnimationFrame(frameRef.current);
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setRemainingTime(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`);
      setIsEndingSoon(diff < 10 * 60 * 1000);

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [booking.endTime, bookingId]);

  const promo =
    booking.bonusMinutes === 30
      ? "+30 Menit Gratis"
      : booking.bonusMinutes === 60
      ? "+1 Jam Gratis"
      : null;

  const totalDurasi = booking.inputDurationMinutes + (booking.bonusMinutes || 0);
  const formatTime = (iso) => {
    const d = new Date(iso);
    return `${d.getHours().toString().padStart(2, "0")}.${d.getMinutes().toString().padStart(2, "0")}`;
  };

  const cancelBooking = async () => {
    await update(ref(db, `bookings/${bookingId}`), { status: "cancelled" });
  };

  return (
    <div
      className={`relative p-5 rounded-3xl border transition-all duration-500 backdrop-blur-xl ${
        isEndingSoon
          ? "border-red-500/40 bg-gradient-to-br from-red-900/20 to-gray-900/60 shadow-[0_0_30px_rgba(255,0,0,0.2)]"
          : "border-gray-700/60 bg-gradient-to-br from-gray-900/60 to-gray-800/30 hover:border-pink-400/40 hover:shadow-[0_0_25px_rgba(255,192,203,0.1)]"
      }`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 tracking-tight">{booking.room}</h3>
          <p className="text-sm text-gray-400 mt-1">
            ⏰ {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
          </p>
        </div>
        {promo && (
          <div className="px-2 py-1 rounded-lg bg-pink-500/20 text-pink-300 text-xs font-medium backdrop-blur-md">
            {promo}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-300 space-y-1">
        <p>👥 {booking.people} orang</p>
        <p>💳 Kasir: {booking.cashier}</p>
        <p>
          ⏱ {totalDurasi} menit{" "}
          {booking.bonusMinutes > 0 && (
            <span className="text-pink-400">(+{booking.bonusMinutes} gratis)</span>
          )}
        </p>
      </div>

      <div className="mt-4 border-t border-gray-700/60 pt-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Sisa Waktu:</span>
          <span className={`font-mono text-lg ${isEndingSoon ? "text-red-400" : "text-green-400"}`}>
            {remainingTime}
          </span>
        </div>

        <div className="flex justify-between mt-2 text-sm">
          <span className="text-gray-400">Subtotal:</span>
          <span className="text-green-400 font-semibold text-lg">
            Rp {booking.subtotal.toLocaleString("id-ID")}
          </span>
        </div>
      </div>

      <button
        onClick={cancelBooking}
        className="w-full mt-5 py-2.5 rounded-xl bg-red-600/90 hover:bg-red-700 transition-all text-white font-semibold tracking-wide"
      >
        Batalkan
      </button>
    </div>
  );
}
