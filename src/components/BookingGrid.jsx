import React, { useState } from "react";
import BookingCard from "./BookingCard";
import BookingGridHeader from "./BookingGridHeader";

export default function BookingGrid({
  bookings = [],
  onCancel = () => {},
  pricing,
  promotions,
}) {
  const [filter, setFilter] = useState("active");
  const list = Array.isArray(bookings) ? bookings : [];

  const filtered = list.filter((b) => {
    if (!b || !b.endTime) return false;
    const now = new Date();
    const end = new Date(b.endTime);
    if (filter === "expired") return end <= now;
    if (filter === "ending")
      return end > now && end - now <= 30 * 60 * 1000;
    return end > now;
  });

  return (
    <div className="p-6">
      <BookingGridHeader activeFilter={filter} onChange={setFilter} />
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-20">
          Belum ada pemesanan aktif.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((b) => (
            <BookingCard
              key={b.id}
              booking={b}
              onCancel={onCancel}
              pricing={pricing}
              promotions={promotions}
            />
          ))}
        </div>
      )}
    </div>
  );
}
