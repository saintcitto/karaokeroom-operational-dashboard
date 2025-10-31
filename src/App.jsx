import React, { useState, useEffect, useRef } from "react";
import BookingGrid from "./components/BookingGrid";
import BookingGridHeader from "./components/BookingGridHeader";
import SidebarForm from "./components/SidebarForm";
import ExpiredModal from "./components/ExpiredModal";
import useFirebaseBookings from "./hooks/useFirebaseBookings";
import { ROOM_NAMES } from "./data/constants";
import KTVErrorBoundary from "./components/KTVErrorBoundary";

export default function App() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const { bookings, expiredBookings, addBooking, removeBooking, extendBooking, completeBooking } = useFirebaseBookings(currentUser);
  const [filter, setFilter] = useState("active");
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const alarmRef = useRef(null);

  useEffect(() => {
    if (expiredBookings && expiredBookings.length > 0) {
      try {
        if (!alarmRef.current) {
          alarmRef.current = new Audio("/alarm.mp3");
        }
        alarmRef.current.currentTime = 0;
        alarmRef.current.play().catch(() => {});
      } catch (e) {}
    } else {
      try {
        if (alarmRef.current) {
          alarmRef.current.pause();
          alarmRef.current.currentTime = 0;
        }
      } catch (e) {}
    }
  }, [expiredBookings]);

  const handleAddBooking = async (data) => {
    setSaving(true);
    await addBooking(data);
    setSaving(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser("");
  };

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row bg-gray-950 text-white min-h-screen overflow-hidden">
        <SidebarForm
          rooms={ROOM_NAMES}
          activeRoomNames={bookings.map(b => b.room)}
          onAddBooking={handleAddBooking}
          currentUser={currentUser}
          onLogout={handleLogout}
          saving={saving}
        />
        <main className="flex-1 overflow-y-auto">
          <BookingGridHeader activeFilter={filter} onChange={setFilter} />
          <BookingGrid
            bookings={bookings}
            expiredBookings={expiredBookings}
            onCancel={(id) => removeBooking(id)}
            onExtend={(b) => extendBooking(b)}
            onComplete={(id) => {
              completeBooking(id, currentUser);
              setActiveModal(null);
            }}
            filter={filter}
          />
        </main>
        {activeModal && (
          <ExpiredModal
            booking={activeModal}
            onComplete={(id) => { completeBooking(id, currentUser); setActiveModal(null); }}
            onCancel={() => setActiveModal(null)}
          />
        )}
        {!activeModal && expiredBookings.length > 0 && (
          <ExpiredModal
            booking={expiredBookings[0]}
            onComplete={(id) => { completeBooking(id, currentUser); }}
            onCancel={() => {}}
          />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
