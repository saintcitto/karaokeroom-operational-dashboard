// src/App.jsx
import React, { useState, useEffect } from "react";
import KTVErrorBoundary from "./components/KTVErrorBoundary";
import SidebarForm from "./components/SidebarForm";
import BookingGrid from "./components/BookingGrid";
import BookingGridHeader from "./components/BookingGridHeader";
import ExpiredModal from "./components/ExpiredModal";
import UserLogin from "./components/UserLogin";
import useFirebaseBookings from "./hooks/useFirebaseBookings";
import { ROOM_NAMES } from "./data/constants";

export default function App() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const [filter, setFilter] = useState("active");
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // use our refactored hook: passes currentUser for history.handledBy
  const { bookings, expiredBookings, addBooking, removeBooking, completeBooking } =
    useFirebaseBookings(currentUser);

  useEffect(() => {
    // persist currentUser
    if (currentUser) localStorage.setItem("currentUser", currentUser);
    else localStorage.removeItem("currentUser");
  }, [currentUser]);

  const handleLogin = (userName) => {
    setCurrentUser(userName);
  };

  const handleLogout = () => {
    setCurrentUser("");
    // other cleanup if needed
  };

  const handleAddBooking = async (bookingData) => {
    setSaving(true);
    await addBooking(bookingData);
    setSaving(false);
  };

  // active room names (to disable in form)
  const activeRooms = Array.isArray(bookings) ? bookings.map((b) => b.room) : [];

  if (!currentUser) {
    return <UserLogin onLogin={handleLogin} />;
  }

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
        <aside className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-screen bg-gray-800 shadow-lg overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <div>
              <div className="text-sm text-gray-300">Login sebagai:</div>
              <div className="font-semibold text-pink-400">{currentUser}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-red-400 hover:text-red-500 ml-2"
            >
              Logout
            </button>
          </div>

          <SidebarForm
            rooms={ROOM_NAMES}
            activeRoomNames={activeRooms}
            onAddBooking={handleAddBooking}
            formPrefill={null}
            onClearPrefill={() => {}}
            currentUser={currentUser}
            saving={saving}
          />
        </aside>

        <main className="relative w-full md:w-2/3 lg:w-3/4 h-screen overflow-y-auto bg-gray-800/50 transition-all duration-300 ease-in-out">
          <div className="sticky top-0 z-10 px-6 py-3 bg-gray-800/70 backdrop-blur-md border-b border-gray-700">
            <BookingGridHeader activeFilter={filter} onChange={setFilter} />
          </div>

          <div className="transition-all duration-500 ease-in-out p-6">
            <BookingGrid
              bookings={bookings}
              onCancel={removeBooking}
              onExtend={() => {}}
              onComplete={completeBooking}
              filter={filter}
            />
          </div>
        </main>

        {/* Expired modal: show top expired if any or show a modal selected via activeModal */}
        {activeModal && (
          <ExpiredModal
            booking={activeModal}
            onComplete={async (id) => {
              await completeBooking(id);
              setActiveModal(null);
            }}
            onExtend={() => {
              // intentionally left empty or can implement extend logic
              setActiveModal(null);
            }}
          />
        )}

        {!activeModal && expiredBookings.length > 0 && (
          <ExpiredModal
            booking={expiredBookings[0]}
            onComplete={async (id) => {
              await completeBooking(id);
            }}
            onExtend={() => {}}
          />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
