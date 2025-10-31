import React from "react";
import BookingCard from "./BookingCard";

export default function BookingGrid({ bookings = [], onCancel, onExtend, onComplete, filter = "active" }) {
  const list = Array.isArray(bookings) ? bookings : [];
  const now = new Date();

  const filtered = list.filter((b) => {
    if (!b || !b.endTime) return false;
    const end = new Date(b.endTime);
    if (filter === "expired") return end.getTime() <= now.getTime();
    if (filter === "ending") return end.getTime() - now.getTime() <= 30 * 60 * 1000 && end.getTime() > now.getTime();
    return end.getTime() > now.getTime();
  });

  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        Belum ada pemesanan aktif.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
