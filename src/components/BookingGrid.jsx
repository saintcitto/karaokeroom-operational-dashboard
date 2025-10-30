import React, { useEffect, useState } from "react";
import { ref, onValue, off } from "firebase/database";
import { db } from "../firebaseConfig";
import BookingCard from "./BookingCard";
import BookingGridHeader from "./BookingGridHeader";

export default function BookingGrid() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");

  useEffect(() => {
    const dataRef = ref(db, "bookings");

    const handleValue = (snap) => {
      const val = snap.val() || {};
      const list = Object.entries(val)
        .map(([id, v]) => ({ id, ...v }))
        .filter(Boolean)
        .sort(
          (a, b) =>
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
        );
      setBookings(list);
    };

    onValue(dataRef, handleValue);
    return () => off(dataRef, "value", handleValue);
  }, []);

  const now = Date.now();

  const filtered = bookings.filter((b) => {
    if (!b.startTime || !b.endTime) return false;
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();

    // Filter rules
    switch (filter) {
      case "active":
        return b.status === "active" && end > now;
      case "ending":
        return b.status === "active" && end > now && end - now <= 15 * 60 * 1000;
      case "expired":
        return b.status === "expired" || end <= now;
      default:
        return false;
    }
  });

  return (
    <section className="flex-1 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold flex items-center gap-3">
          🎤 Pemesanan Aktif
        </h1>
      </div>

      <BookingGridHeader activeFilter={filter} onChange={setFilter} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filtered.length > 0 ? (
          filtered.map((b) => <BookingCard key={b.id} booking={b} />)
        ) : (
          <div className="col-span-full text-center text-gray-400 py-16 rounded-lg bg-transparent">
            Belum ada pemesanan aktif.
          </div>
        )}
      </div>
    </section>
  );
}
