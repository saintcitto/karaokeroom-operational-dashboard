import React, { useEffect, useState } from "react";
import { ref, remove } from "firebase/database";
import { db } from "../firebaseConfig";

export default function BookingCard({ booking }) {
  const [now, setNow] = useState(new Date());
  const id = booking?.id;

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const start = booking?.startTime ? new Date(booking.startTime) : null;
  const end = booking?.endTime ? new Date(booking.endTime) : null;
  const remaining = end && now ? Math.max(0, end.getTime() - now.getTime()) : 0;

  const h = String(Math.floor(remaining / 3600000)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
  const s = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const totalPrice = booking?.totalPrice || 0;
  const bonus = booking?.bonusMinutes || 0;

  const handleCancel = async () => {
    if (!id) return;
    await remove(ref(db, `bookings/${id}`));
  };

  return (
    <div className="bg-[#11141b] border border-gray-800 rounded-2xl p-5 shadow-md hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{booking?.room}</h3>
          <p className="text-gray-400 text-sm">
            {start && end ? `${start.toTimeString().slice(0, 5)} - ${end.toTimeString().slice(0, 5)}` : "—"}
          </p>
        </div>
        {bonus > 0 && (
          <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full font-semibold">+{bonus}m</span>
        )}
      </div>

      <div className="text-sm text-gray-300 mb-2">
        👥 {booking?.people} orang • 💁‍♀️ Kasir: {booking?.cashier || "Tidak Diketahui"}
      </div>

      <div className="flex justify-between items-center mt-3">
        <div className="font-mono text-green-400 text-lg">
          {h}:{m}:{s}
        </div>
        <div className="text-green-300 font-semibold">
          Rp {new Intl.NumberFormat("id-ID").format(totalPrice)}
        </div>
      </div>

      <div className="w-full bg-gray-800 h-2 rounded-full mt-2 overflow-hidden">
        <div
          style={{
            width:
              start && end ? `${Math.max(0, Math.min(100, ((end - now) / (end - start)) * 100))}%` : "0%",
          }}
          className="h-2 bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-500"
        />
      </div>

      <button
        onClick={handleCancel}
        className="w-full mt-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-all"
      >
        Batalkan
      </button>
    </div>
  );
}
