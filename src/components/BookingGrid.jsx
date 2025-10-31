// src/components/BookingGrid.jsx
import React, { useMemo } from "react";
import BookingCard from "./BookingCard";
import { formatTime } from "../utils/helpers";

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
    const diffMin = (end.getTime() - now.getTime()) / 60000;
    if (filter === "expired") return diffMin <= 0 || !!b.expired;
    if (filter === "ending") return diffMin > 0 && diffMin <= 30 && !b.expired;
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

  // expired view: render a table list (user requested)
  if (filter === "expired") {
    return (
      <div className="p-6">
        <h3 className="text-2xl font-semibold mb-4">Waktu Habis — Daftar</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-300">
            <thead className="text-gray-400">
              <tr>
                <th className="py-2 px-3">Room</th>
                <th className="py-2 px-3">Jam Masuk</th>
                <th className="py-2 px-3">Jam Habis</th>
                <th className="py-2 px-3">Durasi</th>
                <th className="py-2 px-3">Orang</th>
                <th className="py-2 px-3">Kasir</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-gray-700 hover:bg-gray-800/30">
                  <td className="py-2 px-3">{b.room}</td>
                  <td className="py-2 px-3">{b.startTime ? formatTime(b.startTime) : "-"}</td>
                  <td className="py-2 px-3">{b.endTime ? formatTime(b.endTime) : "-"}</td>
                  <td className="py-2 px-3">{Math.round((b.durationMinutes || 0) / 60 * 10) / 10} jam</td>
                  <td className="py-2 px-3">{b.people || 0}</td>
                  <td className="py-2 px-3">{b.cashier || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // default: grid of cards
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {filtered.map((b) => (
        <BookingCard
          key={b.id}
          booking={b}
          onCancel={onCancel}
          onExtend={onExtend}
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
