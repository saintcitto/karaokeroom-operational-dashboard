import React, { useEffect, useState } from "react";

export default function BookingCard({ booking, onCancel }) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(booking.endTime) - new Date();
      if (diff <= 0) {
        setRemaining("Waktu Habis");
        clearInterval(timer);
      } else {
        const h = Math.floor(diff / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);
        setRemaining(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [booking.endTime]);

  return (
    <div className="bg-[#151821]/80 border border-gray-700/50 rounded-3xl p-5 shadow-[0_0_25px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all hover:scale-[1.01]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-white/90">{booking.room}</h3>
        {booking.bonusMinutes > 0 && (
          <span className="text-xs px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
            +{booking.bonusMinutes} menit promo
          </span>
        )}
      </div>
      <p className="text-gray-400 text-sm">
        ⏰ {new Date(booking.startTime).toTimeString().slice(0, 5)} – {new Date(booking.endTime).toTimeString().slice(0, 5)}
      </p>
      <p className="text-gray-400 text-sm">👥 {booking.people} orang</p>
      <p className="text-gray-400 text-sm">💳 Kasir: {booking.cashier}</p>
      <div className="mt-3 flex justify-between items-center">
        <p className="text-green-400 font-mono text-sm">{remaining}</p>
        <p className="font-semibold text-green-300">Rp {booking.totalPrice.toLocaleString("id-ID")}</p>
      </div>
      <button
        onClick={() => onCancel(booking.id)}
        className="mt-4 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold"
      >
        Batalkan
      </button>
    </div>
  );
}
