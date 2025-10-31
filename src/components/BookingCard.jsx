import React, { useEffect, useState, useRef } from "react";

function playAlarmTone() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, ctx.currentTime);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
    setTimeout(() => {
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      o.stop(ctx.currentTime + 0.14);
    }, 1000);
  } catch (e) {}
}

export default function BookingCard({ booking = {}, filter = "active", onCancel = () => {}, onExtend = () => {}, onComplete = () => {} }) {
  const [remainingSec, setRemainingSec] = useState(0);
  const alarmedRef = useRef(false);

  useEffect(() => {
    function update() {
      if (!booking || !booking.endTime) {
        setRemainingSec(0);
        return;
      }
      const diff = Math.floor((new Date(booking.endTime).getTime() - Date.now()) / 1000);
      setRemainingSec(Math.max(0, diff));
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [booking]);

  useEffect(() => {
    if (remainingSec <= 0 && !alarmedRef.current) {
      alarmedRef.current = true;
      playAlarmTone();
      try {
        window.alert(`Sesi ${booking.room} telah berakhir.`);
      } catch (e) {}
    }
  }, [remainingSec, booking.room]);

  const formatHms = (s) => {
    const hh = Math.floor(s / 3600);
    const mm = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    if (hh > 0) return `${String(hh).padStart(2,"0")}:${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
    return `${String(mm).padStart(2,"0")}:${String(ss).padStart(2,"0")}`;
  };

  const totalSec = Math.max(1, Math.round((booking.durationMinutes || 0) * 60));
  const pct = totalSec ? Math.min(100, Math.round(((totalSec - remainingSec) / totalSec) * 100)) : 0;
  const isExpired = booking.expired === true || remainingSec <= 0;
  const progressColor = remainingSec <= 60 ? "bg-red-500" : "bg-green-500";

  return (
    <div className={`bg-gray-800 rounded-xl p-6 border border-gray-700 ${isExpired ? "opacity-80" : ""}`}>
      <div className="flex justify-between items-start">
        <div>
          <div className="text-lg font-semibold">{booking.room}</div>
          <div className="text-sm text-gray-400">{booking.startTime ? new Date(booking.startTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ""} — {booking.endTime ? new Date(booking.endTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : ""}</div>
        </div>
        <div className="text-sm text-gray-400">{booking.durationMinutes ? `${booking.durationMinutes} m` : ""}</div>
      </div>

      <div className="mt-3 text-sm text-gray-400">👥 {booking.people || 1} orang</div>
      <div className="mt-2 text-sm text-green-400">{booking.promoNote && booking.promoNote !== "-" ? booking.promoNote : ""}</div>

      <div className="mt-4">
        <div className="h-3 bg-gray-700 rounded-full overflow-hidden relative">
          <div style={{ width: `${pct}%` }} className={`h-full rounded-full ${progressColor} transition-all duration-500`}></div>
          <div style={{ left: `${pct}%` }} className={`absolute -top-3 w-3 h-3 rounded-full transform -translate-x-1/2 ${remainingSec <= 60 ? "animate-pulse bg-red-400" : "bg-green-300"}`}></div>
        </div>
        <div className={`text-right text-xs mt-2 ${remainingSec <= 60 ? "text-red-400 animate-pulse" : "text-green-400"}`}>{formatHms(remainingSec)}</div>
      </div>

      <div className="mt-4 text-green-300 font-semibold">Subtotal: Rp{(booking.total || booking.tarif || 0).toLocaleString()}</div>

      <div className="mt-4 flex gap-3">
        {!isExpired && (
          <button onClick={onComplete} className="bg-green-600 text-white px-4 py-2 rounded-md">Selesai</button>
        )}
        {!isExpired && (
          <button onClick={onCancel} className="bg-red-500 text-white px-4 py-2 rounded-md">Batalkan</button>
        )}
      </div>
    </div>
  );
}
