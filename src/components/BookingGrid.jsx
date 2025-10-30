import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import BookingCard from "./BookingCard";
import BookingGridHeader from "./BookingGridHeader";

export default function BookingGrid() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    const r = ref(db, "bookings");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter(Boolean)
        .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
      setBookings(arr);
    });
    return () => r.off && r.off("value");
  }, []);

  const now = Date.now();
  const filtered = bookings.filter((b) => {
    if (!b || !b.startTime || !b.endTime) return false;
    const s = new Date(b.startTime).getTime();
    const e = new Date(b.endTime).getTime();
    if (filter === "active") return b.status === "active" && e > now;
    if (filter === "ending") return b.status === "active" && e - now <= 15 * 60 * 1000 && e > now;
    if (filter === "expired") return e <= now || b.status === "expired";
    return true;
  });

  return (
    <section className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          <span>🎤</span> Pemesanan Aktif
        </h1>
      </div>

      <BookingGridHeader activeFilter={filter} onChange={setFilter} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-16 rounded-lg bg-transparent">
            Belum ada pemesanan aktif.
          </div>
        ) : (
          filtered.map((b) => <BookingCard key={b.id} booking={b} />)
        )}
      </div>
    </section>
  );
}
