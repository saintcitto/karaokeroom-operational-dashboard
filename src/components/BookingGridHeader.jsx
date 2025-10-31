// src/components/BookingGrid.jsx
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

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {filtered.map((b) => (
        <BookingCard key={b.id} booking={b} onCancel={onCancel} onExtend={onExtend} onComplete={onComplete} />
      ))}
    </div>
  );
}
