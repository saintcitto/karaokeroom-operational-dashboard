import React, { useMemo } from "react";
import BookingCard from "./BookingCard";

export default function BookingGrid({ bookings = [], expiredBookings = [], onCancel = () => {}, onExtend = () => {}, onComplete = () => {}, filter = "active" }) {
  const now = useMemo(() => new Date(), [bookings, expiredBookings, filter]);

  const list = Array.isArray(bookings) ? bookings : [];

  if (filter === "expired") {
    const listExpired = Array.isArray(expiredBookings) ? expiredBookings : [];
    if (listExpired.length === 0) {
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
        <div className="overflow-auto">
          <table className="w-full text-left">
            <thead>
              <tr>
                <th className="py-2">Room</th>
                <th className="py-2">Jam Masuk</th>
                <th className="py-2">Durasi</th>
                <th className="py-2">Jam Habis</th>
                <th className="py-2">Jumlah Orang</th>
              </tr>
            </thead>
            <tbody>
              {listExpired.map((b) => (
                <tr key={b.id} className="border-t border-gray-800">
                  <td className="py-3">{b.room}</td>
                  <td className="py-3">{b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</td>
                  <td className="py-3">{b.durationMinutes ? (b.durationMinutes >= 60 ? `${Math.floor(b.durationMinutes/60)} Jam` : `${b.durationMinutes} Menit`) : ""}</td>
                  <td className="py-3">{b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</td>
                  <td className="py-3">{b.people}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  const filtered = list.filter((b) => {
    if (!b || !b.endTime) return false;
    const end = new Date(b.endTime);
    const diffMs = end.getTime() - now.getTime();
    const diffMin = diffMs / 60000;
    if (filter === "ending") return diffMin > 0 && diffMin <= 30;
    return diffMin > 0 && !b.expired;
  });

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
        <BookingCard key={b.id} booking={b} filter={filter} onCancel={() => onCancel(b.id)} onExtend={() => onExtend(b.id)} onComplete={() => onComplete(b.id)} />
      ))}
    </div>
  );
}
