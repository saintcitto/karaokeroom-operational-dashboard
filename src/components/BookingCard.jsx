import React, { useEffect, useState, useMemo } from "react";
import { Clock, User, Trash2, AlertTriangle } from "lucide-react";

export default function BookingCard({ booking, now, onExpire, onCancel }) {
  const start = useMemo(() => new Date(booking.startTime), [booking.startTime]);
  const end = useMemo(() => new Date(booking.endTime), [booking.endTime]);
  const [remaining, setRemaining] = useState(end - now);

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining(end - new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [end]);

  useEffect(() => {
    if (remaining <= 0 && !booking.expired) {
      onExpire(booking);
    }
  }, [remaining, booking, onExpire]);

  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  const isExpiringSoon = remaining < 10 * 60 * 1000; // <10 menit
  const isExpired = remaining <= 0;

  return (
    <div
      className={`rounded-2xl p-5 shadow-md transition-all border ${
        isExpired
          ? "bg-red-900/30 border-red-600"
          : isExpiringSoon
          ? "bg-yellow-800/30 border-yellow-600"
          : "bg-gray-800/50 border-gray-700"
      } hover:shadow-lg`}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xl font-bold text-white">{booking.room}</h3>
        <span className="text-xs text-gray-400">
          {start.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          -{" "}
          {end.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-3 text-gray-300 text-sm">
        <User size={16} />
        <span>
          {booking.people || 0} orang • oleh{" "}
          <span className="font-semibold text-pink-400">
            {booking.handledBy || "Kasir"}
          </span>
        </span>
      </div>

      {isExpired ? (
        <div className="flex items-center gap-2 text-red-400 font-semibold">
          <AlertTriangle size={18} /> Waktu Habis
        </div>
      ) : (
        <div
          className={`text-lg font-semibold flex items-center gap-2 ${
            isExpiringSoon ? "text-yellow-400" : "text-green-400"
          }`}
        >
          <Clock size={20} />
          <span>
            {hours.toString().padStart(2, "0")}:
            {minutes.toString().padStart(2, "0")}:
            {seconds.toString().padStart(2, "0")}
          </span>
        </div>
      )}

      <div className="flex justify-end mt-4">
        <button
          onClick={() => onCancel(booking.id)}
          className="flex items-center gap-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm text-white transition-colors"
        >
          <Trash2 size={16} /> Batalkan
        </button>
      </div>
    </div>
  );
}
