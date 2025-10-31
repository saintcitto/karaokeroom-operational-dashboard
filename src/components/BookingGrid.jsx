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
    if (filter === "expired") return diffMin <= 0 || !!b.expired;
    if (filter === "ending") return diffMin > 0 && diffMin <= 30; // akan habis = <= 30 minutes
    // default active
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

  // jika user pilih tab Waktu Habis => tampilkan tabel ringkas
  if (filter === "expired") {
    return (
      <div className="p-6">
        <h3 className="text-2xl font-semibold mb-4">Waktu Habis</h3>
        <div className="overflow-x-auto bg-gray-800/40 p-4 rounded-lg border border-gray-700">
          <table className="w-full text-sm text-left text-gray-300">
            <thead className="text-gray-400">
              <tr>
                <th className="py-2 px-3">Room</th>
                <th className="py-2 px-3">Jam Masuk</th>
                <th className="py-2 px-3">Durasi</th>
                <th className="py-2 px-3">Jam Habis</th>
                <th className="py-2 px-3">Jumlah Orang</th>
                <th className="py-2 px-3">Kasir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const start = b.startTime ? new Date(b.startTime) : null;
                const end = b.endTime ? new Date(b.endTime) : null;
                const durMin = b.durationMinutes || (start && end ? Math.round((end - start)/60000) : 0);
                return (
                  <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-700/20">
                    <td className="py-2 px-3">{b.room}</td>
                    <td className="py-2 px-3">{start ? start.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</td>
                    <td className="py-2 px-3">{Math.round(durMin/60)} jam</td>
                    <td className="py-2 px-3">{end ? end.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit'}) : '-'}</td>
                    <td className="py-2 px-3">{b.people || '-'}</td>
                    <td className="py-2 px-3">{b.cashier || '-'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // default: grid of cards (tidak diubah)
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {filtered.map((b) => (
        <BookingCard key={b.id} booking={b} onCancel={onCancel} onExtend={onExtend} onComplete={onComplete} />
      ))}
    </div>
  );
}
