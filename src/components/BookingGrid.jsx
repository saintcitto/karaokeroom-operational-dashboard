// src/components/BookingGrid.jsx
import React, { useMemo } from "react";
import BookingCard from "./BookingCard";
import ExpiredList from "./ExpiredList";

export default function BookingGrid({
  bookings = [],
  onCancel = () => {},
  onExtend = () => {},
  onComplete = () => {},
  filter = "active",
}) {
  // now computed when bookings change (useMemo dependency)
  const now = useMemo(() => new Date(), [bookings]);

  const list = Array.isArray(bookings) ? bookings : [];

  // add convenient computed fields per booking
  const prepared = list.map((b) => {
    const _start = b && b.startTime ? (b.startTime instanceof Date ? b.startTime : new Date(b.startTime)) : null;
    const _end = b && b.endTime ? (b.endTime instanceof Date ? b.endTime : new Date(b.endTime)) : null;
    const _diffMin = _end ? (_end.getTime() - now.getTime()) / 60000 : Number.POSITIVE_INFINITY;
    return { ...b, _start, _end, _diffMin };
  });

  // expired view (special: render table list)
  if (filter === "expired") {
    const expiredItems = prepared.filter((b) => b && (b.expired === true || (typeof b._diffMin === "number" && b._diffMin <= 0)));
    return <ExpiredList items={expiredItems} />;
  }

  // for 'ending' and default 'active'
  const filtered = prepared.filter((b) => {
    if (!b || !b._end) return false;
    if (filter === "ending") return b._diffMin > 0 && b._diffMin <= 30 && !b.expired;
    // default active: not expired and still positive time left
    return b._diffMin > 0 && !b.expired;
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
        <BookingCard
          key={b.id}
          booking={b}
          onCancel={() => onCancel(b.id)}
          onExtend={() => onExtend(b)}
          onComplete={() => onComplete(b.id)}
        />
      ))}
    </div>
  );
}
