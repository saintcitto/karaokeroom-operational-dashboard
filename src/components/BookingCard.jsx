import React, { useEffect, useState } from "react";
import { ref, remove } from "firebase/database";
import { db } from "../firebaseConfig";

export default function BookingCard({ booking }) {
  const [now, setNow] = useState(new Date());
  const id = booking?.id;

  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(i);
  }, []);

  const start = booking?.startTime ? new Date(booking.startTime) : null;
  const end = booking?.endTime ? new Date(booking.endTime) : null;

  const remaining =
    end && now
      ? Math.max(0, end.getTime() - now.getTime())
      : 0;

  const hrs = String(Math.floor(remaining / 3600000)).padStart(2, "0");
  const mins = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, "0");
  const secs = String(Math.floor((remaining % 60000) / 1000)).padStart(2, "0");

  const progress = end && start ? ((end - now) / (end - start)) * 100 : 0;
  const totalPrice = booking?.totalPrice || 0;
  const bonus = booking?.bonusMinutes || 0;

  const cancel = async () => {
    if (!id) return;
    await remove(ref(db, `bookings/${id}`));
  };

  return (
    <div className="bg-gradient-to-br from-[#121621] to-[#0c0f16] border border-gray-800 rounded-2xl shadow-lg p-5 hover:scale-[1.02] hover:shadow-2xl transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-bold text-white">{booking?.room || "—"}</h3>
          <p className="text-gray-400 text-sm">
            {start && end ? `${start.toTimeString().slice(0, 5)} - ${end.toTimeString().slice(0, 5)}` : "—"}
          </p>
        </div>
        {bonus > 0 && (
          <span className="text-xs bg-pink-500/20 text-pink-400 px-2 py-1 rounded-full font-medium">+{bonus} menit</span>
        )}
      </div>

      <div className="text-sm text-gray-300 space-y-1">
        <div>👥 {booking?.people || 0} orang</div>
        <div>💁‍♀️ Kasir: {booking?.cashier || "Tidak Diketahui"}</div>
        <div>⏱ Durasi: {booking?.durationTotalMinutes || booking?.durationMinutes || 0} menit</div>
      </div>

      <div className="mt-4 mb-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-400 text-sm">Sisa Waktu</span>
          <span className="font-mono text-green-400 text-lg">{`${hrs}:${mins}:${secs}`}</span>
        </div>
        <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
          <div
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
            className="h-2 bg-gradient-to-r from-green-400 to-blue-400 transition-all duration-500"
          />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-gray-800 pt-3">
        <div>
          <p className="text-xs text-gray-400">Subtotal</p>
          <p className="text-lg font-semibold text-green-400">
            Rp {new Intl.NumberFormat("id-ID").format(totalPrice)}
          </p>
        </div>
        <button
          onClick={cancel}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all"
        >
          Batalkan
        </button>
      </div>
    </div>
  );
}
