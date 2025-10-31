import React, { useState } from "react";
import BookingGrid from "./components/BookingGrid";
import BookingGridHeader from "./components/BookingGridHeader";
import SidebarForm from "./components/SidebarForm";
import ExpiredModal from "./components/ExpiredModal";
import useFirebaseBookings from "./hooks/useFirebaseBookings";
import { ROOM_NAMES } from "./data/constants";
import KTVErrorBoundary from "./components/KTVErrorBoundary";

export default function App() {
  const {
  bookings,
  expiredBookings,
  addBooking,
  removeBooking,
  extendBooking,
  completeBooking,
} = useFirebaseBookings(currentUser);

  const [filter, setFilter] = useState("active");
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const handleAddBooking = async (data) => {
    setSaving(true);
    await addBooking(data);
    setSaving(false);
  };

  const activeRooms = bookings.map((b) => b.room);

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row bg-gray-950 text-white min-h-screen overflow-hidden">
        <SidebarForm
          rooms={ROOM_NAMES}
          activeRooms={activeRooms}
          onAddBooking={handleAddBooking}
          saving={saving}
        />

        <main className="flex-1 overflow-y-auto">
          <BookingGridHeader activeFilter={filter} onChange={setFilter} />
          <BookingGrid
            bookings={bookings}
            onCancel={removeBooking}
            filter={filter}
          />
        </main>

        {activeModal && (
          <ExpiredModal
            booking={activeModal}
            onExtend={(b) => {
              extendBooking(b);
              setActiveModal(null);
            }}
            onComplete={(id) => {
              completeBooking(id);
              setActiveModal(null);
            }}
          />
        )}

        {expiredBookings.length > 0 && !activeModal && (
          <ExpiredModal
            booking={expiredBookings[0]}
            onExtend={(b) => {
              extendBooking(b);
              setActiveModal(null);
            }}
            onComplete={(id) => {
              completeBooking(id);
              setActiveModal(null);
            }}
          />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
