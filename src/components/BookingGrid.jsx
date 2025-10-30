import React, { useState, useEffect } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import SidebarForm from "./SidebarForm";
import BookingCard from "./BookingCard";
import BookingGridHeader from "./BookingGridHeader";

export default function BookingGrid({ kasir }) {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = ref(db, "bookings");
    const unsub = onValue(q, (snap) => {
      const data = snap.val();
      if (data) {
        const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
        setBookings(list);
      } else setBookings([]);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const now = new Date();
  const filtered =
    filter === "active"
      ? bookings.filter((b) => new Date(b.endTime) > now)
      : filter === "ending"
      ? bookings.filter((b) => {
          const diff = (new Date(b.endTime) - now) / 60000;
          return diff <= 15 && diff > 0;
        })
      : bookings.filter((b) => new Date(b.endTime) <= now);

  return (
    <div className="flex min-h-screen bg-[#0C0E13] text-white overflow-hidden">
      <aside className="w-full md:w-[340px] xl:w-[380px] flex-shrink-0 border-r border-gray-800/70 p-6 bg-[#0E1015]">
        <SidebarForm kasir={kasir} activeBookings={bookings.filter((b) => new Date(b.endTime) > now)} />
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <h2 className="text-2xl font-semibold mb-4 tracking-tight">Pemesanan Aktif</h2>
        <BookingGridHeader activeFilter={filter} onChange={setFilter} />

        {loading ? (
          <p className="text-gray-500 text-center mt-20">Memuat data...</p>
        ) : filtered.length === 0 ? (
          <p className="text-gray-500 text-center mt-20">Belum ada pemesanan aktif.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6 pb-10">
            {filtered.map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
