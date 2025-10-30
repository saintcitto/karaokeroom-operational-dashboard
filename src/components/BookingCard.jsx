import React, { useEffect, useState } from "react";
import { ref, update } from "firebase/database";
import { db } from "../firebaseConfig";

function formatRp(n) {
  if (typeof n !== "number") return "Rp 0";
  return "Rp " + n.toLocaleString("id-ID");
}

export default function BookingCard({ booking }) {
  const [remaining, setRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!booking || !booking.startTime || !booking.endTime) return;
    const start = new Date(booking.startTime).getTime();
    const end = new Date(booking.endTime).getTime();
    const total = Math.max(1, end - start);
    const tick = () => {
      const now = Date.now();
      const rem = Math.max(0, end - now);
      setRemaining(rem);
      const done = Math.min(1, (now - start) / total);
      setProgress(done);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [booking]);

  const cancelBooking = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await update(ref(db, `bookings/${booking.id}`), { status: "expired" });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toTime = (ms) => {
    if (ms <= 0) return "00:00:00";
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, "0");
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  };

  const start = booking.startTime ? new Date(booking.startTime) : null;
  const end = booking.endTime ? new Date(booking.endTime) : null;
  const hasPromo = booking.bonusMinutes && booking.bonusMinutes > 0;
  const totalPrice = typeof booking.totalPrice === "number" ? booking.totalPrice : 0;

  return (
    <article className="bg-gray-900/40 border border-gray-800 rounded-xl p-6 transition-transform transform hover:-translate-y-1 shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{booking.room || "—"}</h3>
          <div className="text-sm text-gray-400 mt-1">
            {start && end ? `${start.toTimeString().slice(0,5)} - ${end.toTimeString().slice(0,5)}` : "—"}
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">⏱ {booking.baseDuration || booking.durationMinutes || 0} menit</div>
          {hasPromo && <div className="mt-1 text-xs text-green-300">Bonus: +{booking.bonusMinutes} menit</div>}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-300 space-y-2">
        <div>👥 {booking.people || 0} orang</div>
        <div>🧾 Kasir: {booking.cashier || "Tidak Diketahui"}</div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
          <div>Sisa Waktu:</div>
          <div className="font-mono text-green-300">{toTime(remaining)}</div>
        </div>
        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
          <div style={{ width: `${Math.floor(progress * 100)}%` }} className="h-full bg-gradient-to-r from-green-400 to-blue-500 transition-all"></div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-300">{formatRp(totalPrice)}</div>
        </div>
        <button
          onClick={cancelBooking}
          disabled={saving}
          className={`px-4 py-2 rounded-md text-white font-medium transition ${
            saving ? "bg-red-600/60 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {saving ? "Memproses..." : "Batalkan"}
        </button>
      </div>
    </article>
  );
}
