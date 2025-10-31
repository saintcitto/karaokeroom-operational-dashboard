// src/components/BookingGrid.jsx
import React, { useMemo } from "react";
import BookingCard from "./BookingCard";
import { formatTime } from "../utils/helpers";

export default function BookingGrid({
  bookings = [],
  onCancel = () => {},
  onExtend = () => {},
  onComplete = () => {},
  filter = "active"
}) {
  const now = useMemo(() => new Date(), [bookings]);

  const list = Array.isArray(bookings) ? bookings : [];

  // helper filter
  const filtered = list.filter((b) => {
    if (!b || !b.endTime) return false;
    const end = b.endTime instanceof Date ? b.endTime : new Date(b.endTime);
    const diffMin = (end.getTime() - now.getTime()) / 60000;
    if (filter === "expired") return diffMin <= 0;
    if (filter === "ending") return diffMin > 0 && diffMin <= 30;
    // active
    return diffMin > 0;
  });

  // EXPIRED TABLE view
  if (filter === "expired") {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-semibold mb-6">Waktu Habis — Daftar</h2>
        {filtered.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">Belum ada pemesanan waktu habis.</div>
        ) : (
          <div className="overflow-x-auto bg-gray-900/50 p-4 rounded-lg border border-gray-800">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-gray-400">
                <tr>
                  <th className="py-2 px-3">Room</th>
                  <th className="py-2 px-3">Jam Masuk</th>
                  <th className="py-2 px-3">Durasi</th>
                  <th className="py-2 px-3">Jam Habis</th>
                  <th className="py-2 px-3">Jumlah Orang</th>
                  <th className="py-2 px-3">Kasir</th>
                  <th className="py-2 px-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => {
                  const dur = Math.round((b.durationMinutes || 0) / 60 * 10) / 10;
                  return (
                    <tr key={b.id} className="border-b border-gray-800 hover:bg-gray-800/30">
                      <td className="py-2 px-3">{b.room}</td>
                      <td className="py-2 px-3">{b.startTime ? formatTime(b.startTime) : "-"}</td>
                      <td className="py-2 px-3">{(b.durationMinutes || 0) >= 60 ? `${Math.round((b.durationMinutes||0)/60)} jam` : `${b.durationMinutes || 0} m`}</td>
                      <td className="py-2 px-3">{b.endTime ? formatTime(b.endTime) : "-"}</td>
                      <td className="py-2 px-3">{b.people || 0}</td>
                      <td className="py-2 px-3">{b.cashier || "-"}</td>
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <button onClick={() => onComplete(b.id)} className="px-3 py-1 bg-red-600 rounded-md text-sm">Selesaikan</button>
                          <button onClick={() => onCancel(b.id)} className="px-3 py-1 bg-gray-700 rounded-md text-sm">Batal</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // GRID (default) — cards
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
