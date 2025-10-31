import React, { useState } from "react";
import KTVErrorBoundary from "./components/KTVErrorBoundary";
import SidebarForm from "./components/SidebarForm";
import BookingGridHeader from "./components/BookingGridHeader";
import BookingGrid from "./components/BookingGrid";
import ExpiredModal from "./components/ExpiredModal";
import useFirebaseBookings from "./hooks/useFirebaseBookings";
import { ROOM_NAMES } from "./data/constants";
import UserLogin from "./components/UserLogin";

export default function App() {
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const [filter, setFilter] = useState("active");
  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  } = useFirebaseBookings(currentUser || "Tidak Diketahui");

  const handleLogin = (userName) => {
    localStorage.setItem("currentUser", userName);
    setCurrentUser(userName);
  };

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser("");
  };

  const handleAddBooking = async (data) => {
    setSaving(true);
    try {
      await addBooking(data);
    } finally {
      setSaving(false);
    }
  };

  if (!currentUser) {
    return <UserLogin onLogin={handleLogin} />;
  }

  const activeRooms = bookings.map((b) => b.room);

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white">
        <aside className="w-full md:w-80 lg:w-72 h-auto md:h-screen bg-gray-900 shadow-lg overflow-y-auto p-6 border-r border-gray-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-gray-400">Login sebagai:</div>
              <div className="font-semibold text-pink-400">{currentUser}</div>
            </div>
            <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-500">Logout</button>
          </div>

          <SidebarForm
            rooms={ROOM_NAMES}
            activeRoomNames={activeRooms}
            onAddBooking={handleAddBooking}
            currentUser={currentUser}
            saving={saving}
          />
        </aside>

        <main className="relative w-full md:w-2/3 lg:w-3/4 h-screen overflow-y-auto bg-gray-800/50 transition-all duration-300 ease-in-out">
          <BookingGridHeader activeFilter={filter} onChange={setFilter} />
          <div className="transition-all duration-500 ease-in-out p-6">
            <BookingGrid
              bookings={bookings}
              onCancel={removeBooking}
              onExtend={extendBooking}
              onComplete={(id) => {
                completeBooking(id);
                setActiveModal(null);
              }}
              filter={filter}
            />
          </div>
        </main>

        {activeModal && (
          <ExpiredModal
            booking={activeModal}
            onComplete={(id) => {
              completeBooking(id);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}

        {expiredBookings.length > 0 && !activeModal && (
          <ExpiredModal
            booking={expiredBookings[0]}
            onComplete={(id) => {
              completeBooking(id);
            }}
            onClose={() => {}}
          />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
