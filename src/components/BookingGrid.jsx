import React, { useMemo } from "react";
import BookingCard from "./BookingCard";

export default function BookingGrid({
  bookings = [],
  onCancel = () => {},
  onComplete = () => {},
  filter = "active",
}) {
  const now = useMemo(() => new Date(), [bookings]);
  const list = Array.isArray(bookings) ? bookings : [];

  const filtered = list.filter((b) => {
    if (!b || !b.endTime) return false;
    const end = new Date(b.endTime);
    const diff = end.getTime() - now.getTime();
    const diffMin = diff / 60000;
    if (filter === "expired") return b.expired || diffMin <= 0;
    if (filter === "ending") return diffMin > 0 && diffMin <= 30;
    return diffMin > 0 && !b.expired;
  });

  if (filtered.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        {filter === "expired"
          ? "Belum ada pemesanan waktu habis."
          : "Belum ada pemesanan aktif."}
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
          onComplete={onComplete}
        />
      ))}
    </div>
  );
}
