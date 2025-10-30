import React, { useState, useEffect } from "react";
import { ref, onValue, remove } from "firebase/database";
import { db } from "../firebaseConfig";
import BookingCard from "./BookingCard";
import BookingGridHeader from "./BookingGridHeader";
import SidebarForm from "./SidebarForm";

export default function BookingGrid({ kasir }) {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState("active");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
        }));
        setBookings(parsed);
      } else {
        setBookings([]);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleCancel = async (id) => {
    await remove(ref(db, `bookings/${id}`));
  };

  const now = new Date();
  const activeBookings = bookings.filter((b) => new Date(b.endTime) > now);

  const filteredBookings =
    filter === "active"
      ? activeBookings
      : filter === "ending"
      ? activeBookings.filter((b) => {
          const diff = new Date(b.endTime) - now;
          return diff <= 15 * 60000 && diff > 0;
        })
      : bookings.filter((b) => new Date(b.endTime) <= now);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full h-screen text-white/60 font-medium">
        Memuat data pemesanan...
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 min-h-screen bg-[#0C0E13] text-white">
      {/* Sidebar */}
      <div className="lg:w-1/3 w-full">
        <SidebarForm kasir={kasir} activeBookings={activeBookings} />
      </div>

      {/* Booking Grid Section */}
      <div className="flex-1">
        <BookingGridHeader activeFilter={filter} onChange={setFilter} />
        {filteredBookings && filteredBookings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancel={handleCancel}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-500 select-none">
            <div className="text-6xl mb-3">🎤</div>
            <p className="text-gray-400 text-lg">Belum ada pemesanan aktif.</p>
          </div>
        )}
      </div>
    </div>
  );
}
