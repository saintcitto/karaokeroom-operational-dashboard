import React from "react";
import BookingCard from "./BookingCard";
import BookingGridHeader from "./BookingGridHeader";

export default function BookingGrid({ bookings = [], activeFilter = "active", onFilterChange = () => {} }) {
  const list = Array.isArray(bookings) ? bookings : Object.keys(bookings || {}).map((k) => ({ ...bookings[k], id: k }));

  const filtered = list.filter((b) => {
    if (activeFilter === "active") return b.status === "active";
    if (activeFilter === "ending") {
      const end = b.endTime ? new Date(b.endTime) : null;
      if (!end) return false;
      const diffMin = (end.getTime() - Date.now()) / 60000;
      return diffMin > 0 && diffMin <= 30;
    }
    if (activeFilter === "expired") {
      const end = b.endTime ? new Date(b.endTime) : null;
      return end && end.getTime() <= Date.now();
    }
    return true;
  });

  return (
    <section className="flex-1 px-8 py-6">
      <div className="mb-6">
        <div className="text-2xl font-bold text-white flex items-center gap-3">🎤 Pemesanan Aktif</div>
        <BookingGridHeader activeFilter={activeFilter} onChange={onFilterChange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-gray-400">Belum ada pemesanan aktif.</div>
        ) : (
          filtered.map((b) => <BookingCard key={b.id || b.room} booking={b} />)
        )}
      </div>
    </section>
  );
}
