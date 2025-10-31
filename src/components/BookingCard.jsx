// src/components/BookingGrid.jsx
import React, { useEffect, useMemo, useState } from "react";
import BookingCard from "./BookingCard";

export default function BookingGrid({
  bookings = [],
  onCancel = () => {},
  onExtend = () => {},
  onComplete = () => {},
  filter = "active",
}) {
  const [now, setNow] = useState(new Date());

  // tick every second so countdowns & filters remain live
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const list = Array.isArray(bookings) ? bookings : [];

  // normalize times once per render
  const normalized = useMemo(
    () =>
      list
        .map((b) => {
          if (!b) return null;
          const startTime = b.startTime ? (b.startTime instanceof Date ? b.startTime : new Date(b.startTime)) : null;
          const endTime = b.endTime ? (b.endTime instanceof Date ? b.endTime : new Date(b.endTime)) : null;
          return { ...b, startTime, endTime };
        })
        .filter(Boolean),
    [list]
  );

  const filtered = useMemo(() => {
    return normalized.filter((b) => {
      if (!b.endTime) return false;
      const diffMs = b.endTime.getTime() - now.getTime();
      const diffMin = diffMs / 60000;
      // expired: either flagged expired OR end <= now
      if (filter === "expired") return !!b.expired || diffMin <= 0;
      // ending: >0 and <= 30 minutes
      if (filter === "ending") return diffMin > 0 && diffMin <= 30;
      // active: > 0 and not expired
      return diffMin > 0 && !b.expired;
    });
  }, [normalized, now, filter]);

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
