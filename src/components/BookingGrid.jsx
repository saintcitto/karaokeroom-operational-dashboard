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
      const list = Object.entries(val).map(([id, v]) => ({ id, ...v }));
      setBookings(list);
    };

    onValue(dataRef, handleValue);
    return () => off(dataRef, "value", handleValue);
  }, []);

  const now = Date.now();
  const filtered = bookings.filter((b) => {
    if (!b.startTime || !b.endTime) return false;
    const s = new Date(b.startTime).getTime();
    const e = new Date(b.endTime).getTime();
    if (filter === "active") return b.status === "active" && e > now;
    if (filter === "ending") return b.status === "active" && e - now <= 900000 && e > now;
    if (filter === "expired") return e <= now || b.status === "expired";
    return true;
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
        {filtered.length ? (
          filtered.map((b) => <BookingCard key={b.id} booking={b} />)
        ) : (
          <div className="col-span-full text-center text-gray-400 py-16">
            Belum ada pemesanan aktif.
          </div>
        )}
      </div>
    </section>
  );
}
