import React, { useMemo } from "react";
import BookingCard from "./BookingCard";

export default function BookingGrid({ bookings = [], onCancel = () => {}, onExtend = () => {}, onComplete = () => {}, filter = "active" }) {
  const now = useMemo(() => new Date(), [bookings]);

  const list = Array.isArray(bookings) ? bookings : [];

  const filtered = list.filter((b) => {
    if (!b || !b.endTime) return false;
    const end = new Date(b.endTime);
    const diffMs = end.getTime() - now.getTime();
    const diffMin = diffMs / 60000;
    if (filter === "expired") return b.expired || diffMin <= 0;
    if (filter === "ending") return diffMin > 0 && diffMin <= 30;
    return diffMin > 0 && !b.expired;
  });

  if (filter === "expired") {
    if (filtered.length === 0) {
      return (
        <div className="p-6">
          <h3 className="text-2xl font-semibold mb-4">Waktu Habis — Daftar</h3>
          <div className="text-center text-gray-500 mt-20">Belum ada pemesanan waktu habis.</div>
        </div>
      );
    }
    return (
      <div className="p-6">
        <h3 className="text-2xl font-semibold mb-4">Waktu Habis — Daftar</h3>
        <div className="overflow-x-auto bg-transparent rounded">
          <table className="w-full table-auto text-left">
            <thead>
              <tr className="text-sm text-gray-400">
                <th className="px-4 py-3">Room Karaoke</th>
                <th className="px-4 py-3">Jam Masuk</th>
                <th className="px-4 py-3">Durasi</th>
                <th className="px-4 py-3">Jam Habis</th>
                <th className="px-4 py-3">Jumlah Orang</th>
                <th className="px-4 py-3">Kasir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const start = new Date(b.startTime);
                const end = new Date(b.endTime);
                const dur = Math.round(( (b.effectiveDurationMinutes || b.durationMinutes) ));
                return (
                  <tr key={b.id} className="border-t border-gray-800">
                    <td className="px-4 py-3">{b.room}</td>
                    <td className="px-4 py-3">{start.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false})}</td>
                    <td className="px-4 py-3">{dur >= 60 ? `${Math.floor(dur/60)} Jam ${dur%60} Menit` : `${dur} Menit`}</td>
                    <td className="px-4 py-3">{end.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false})}</td>
                    <td className="px-4 py-3">{b.people || 0}</td>
                    <td className="px-4 py-3">{b.cashier || "Tidak Diketahui"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-2xl font-semibold mb-4">Pemesanan Aktif</h3>
        <div className="text-center text-gray-500 mt-20">Belum ada pemesanan sesuai filter.</div>
      </div>
    );
  }

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {filtered.map((b) => (
        <BookingCard key={b.id} booking={b} onCancel={onCancel} onExtend={onExtend} onComplete={onComplete} />
      ))}
    </div>
  );
}
