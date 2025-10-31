import React, { useState, useEffect } from "react";
import SidebarForm from "./components/SidebarForm";
import BookingGrid from "./components/BookingGrid";
import ExpiredModal from "./components/ExpiredModal";
import useFirebaseBookings from "./hooks/useFirebaseBookings";
import KTVErrorBoundary from "./components/KTVErrorBoundary";
import UserLogin from "./components/UserLogin";
import { ROOM_NAMES } from "./data/constants";

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("currentUser") || "");
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  const {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  } = useFirebaseBookings(currentUser);

  useEffect(() => {
    if (currentUser) localStorage.setItem("currentUser", currentUser);
    else localStorage.removeItem("currentUser");
  }, [currentUser]);

  const handleLogin = (name) => setCurrentUser(name);
  const handleLogout = () => setCurrentUser("");

  const handleAddBooking = async (data) => {
    setSaving(true);
    try {
      await addBooking(data);
    } finally {
      setSaving(false);
    }
  };

  const activeRoomNames = bookings.map((b) => b.room);

  if (!currentUser) {
    return <UserLogin onLogin={handleLogin} />;
  }

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row bg-gray-950 text-white min-h-screen">
        <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col bg-gray-900 border-r border-gray-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-gray-400">Login sebagai:</div>
              <div className="text-pink-400 font-semibold">{currentUser}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-500 transition"
            >
              Logout
            </button>
          </div>

          <SidebarForm
            rooms={ROOM_NAMES}
            activeRoomNames={activeRoomNames}
            onAddBooking={handleAddBooking}
            currentUser={currentUser}
            saving={saving}
          />
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          <BookingGrid
            bookings={bookings}
            onCancel={removeBooking}
            onExtend={extendBooking}
            onComplete={completeBooking}
          />
        </main>

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
