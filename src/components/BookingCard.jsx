import React, { useEffect, useState, useMemo } from "react";

function formatCurrency(value) {
  try {
    return value.toLocaleString("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    });
  } catch {
    return "Rp 0";
  }
}

function secondsToHMS(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(
    2,
    "0"
  )}:${String(s).padStart(2, "0")}`;
}

export default function BookingCard({
  booking = {},
  onCancel = () => {},
  pricing = { ratePer30Min: 22500 },
  promotions = { 120: 30, 180: 60 },
}) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (!booking.endTime) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const end = new Date(booking.endTime).getTime();
      setRemaining(Math.max(0, Math.floor((end - now) / 1000)));
    }, 1000);
    return () => clearInterval(interval);
  }, [booking.endTime]);

  const durationMinutes = booking.durationMinutes || (() => {
    if (booking.startTime && booking.endTime) {
      const start = new Date(booking.startTime);
      const end = new Date(booking.endTime);
      return Math.round((end - start) / 60000);
    }
    return 0;
  })();

  const bonusMinutes = useMemo(() => {
    const keys = Object.keys(promotions).map((k) => parseInt(k, 10));
    for (let k of keys.sort((a, b) => b - a)) {
      if (durationMinutes >= k) return promotions[k] || 0;
    }
    return 0;
  }, [durationMinutes, promotions]);

  const totalMinutes = durationMinutes + bonusMinutes;
  const price = useMemo(() => {
    const rate = pricing.ratePer30Min;
    const blocks = Math.ceil(totalMinutes / 30);
    return blocks * rate;
  }, [pricing, totalMinutes]);

  const progress =
    totalMinutes > 0
      ? Math.min(
          100,
          ((totalMinutes - remaining / 60) / totalMinutes) * 100
        )
      : 0;

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-md hover:shadow-lg transition-all duration-300">
      <div className="flex justify-between items-start mb-3">
        <div className="text-lg font-semibold text-white">
          {booking.room || "—"}
        </div>
        <div className="text-sm text-gray-400">
          {durationMinutes ? `${durationMinutes} menit` : ""}
        </div>
      </div>

      <div className="text-sm text-gray-400 mb-4 space-y-1">
        <div>
          {booking.startTime
            ? new Date(booking.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--"}{" "}
          —{" "}
          {booking.endTime
            ? new Date(booking.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "--"}
        </div>
        <div>👥 {booking.people || 0} orang</div>
        <div>Kasir: {booking.cashier || "Tidak diketahui"}</div>
        {bonusMinutes > 0 && (
          <div className="text-green-400 mt-1">
            Bonus: +{bonusMinutes} menit
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-gray-700 rounded-full mr-4 overflow-hidden">
            <div
              style={{ width: `${progress}%` }}
              className="h-full bg-gradient-to-r from-green-400 to-green-600"
            />
          </div>
          <span className="text-green-400 text-sm font-mono">
            {secondsToHMS(remaining)}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          <p className="text-xs text-gray-400">Subtotal</p>
          <p className="text-lg font-semibold text-green-400">
            {formatCurrency(price)}
          </p>
        </div>
        <button
          onClick={() => onCancel(booking.id)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-semibold transition-all"
        >
          Batalkan
        </button>
      </div>
    </div>
  );
}
