import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";
import BookingCard from "./BookingCard";

export default function BookingGrid() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const q = ref(db, "bookings");
    const unsub = onValue(q, (snapshot) => {
      if (!snapshot.exists()) return setBookings([]);
      const data = Object.entries(snapshot.val())
        .filter(([_, b]) => b.status === "active")
        .map(([id, b]) => ({ id, ...b }))
        .sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      setBookings(data);
    });
    return () => unsub();
  }, []);

  return (
    <div className="p-6 grid gap-5 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 transition-all">
      {bookings.length > 0 ? (
        bookings.map((b) => <BookingCard key={b.id} bookingId={b.id} booking={b} />)
      ) : (
        <div className="col-span-full text-center text-gray-400 text-sm py-10">Belum ada pemesanan aktif</div>
      )}
    </div>
  );
}
