// src/components/BookingGrid.jsx
import React, { useMemo } from "react";
import BookingCard from "./BookingCard";

export default function BookingGrid({
  bookings = [],
  onCancel = () => {},
  onExtend = () => {},
  onComplete = () => {},
  filter = "active",
}) {
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

  // --- EXPIRED TABLE VIEW ---
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
        <div className="overflow-x-auto bg-transparent">
          <table className="w-full text-left">
            <thead>
              <tr className="text-sm text-gray-400">
                <th className="py-2 px-3">Room</th>
                <th className="py-2 px-3">Jam Masuk</th>
                <th className="py-2 px-3">Durasi</th>
                <th className="py-2 px-3">Jam Habis</th>
                <th className="py-2 px-3">Jumlah</th>
                <th className="py-2 px-3">Kasir</th>
                <th className="py-2 px-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => {
                const start = b.startTime ? new Date(b.startTime) : null;
                const end = b.endTime ? new Date(b.endTime) : null;
                const duration = b.durationMinutes || (start && end ? Math.round((end - start) / 60000) : 0);
                return (
                  <tr key={b.id} className="border-t border-gray-800">
                    <td className="py-3 px-3 align-top">{b.room}</td>
                    <td className="py-3 px-3 align-top">{start ? start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }) : "-"}</td>
                    <td className="py-3 px-3 align-top">{Math.floor(duration / 60) > 0 ? `${Math.floor(duration / 60)} jam ${duration % 60} m` : `${duration} m`}</td>
                    <td className="py-3 px-3 align-top">{end ? end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false }) : "-"}</td>
                    <td className="py-3 px-3 align-top">{b.people || "-"}</td>
                    <td className="py-3 px-3 align-top">{b.cashier || "-"}</td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex gap-2">
                        <button
                          className="px-3 py-1 rounded bg-red-600 text-white"
                          onClick={() => onCancel(b.id)}
                        >
                          Batalkan
                        </button>
                        <button
                          className="px-3 py-1 rounded bg-green-600 text-white"
                          onClick={() => onComplete(b.id)}
                        >
                          Selesaikan Sesi
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // --- GRID VIEW (active / ending) keep original card UI ---
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
