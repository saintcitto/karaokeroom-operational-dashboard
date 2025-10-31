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
  const [currentUser, setCurrentUser] = useState(() => localStorage.getItem("currentUser") || "");
  const [filter, setFilter] = useState("active");
  const [saving, setSaving] = useState(false);
  const [activeModal, setActiveModal] = useState(null);

  // hook firebase bookings
  const {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
    isLoading,
  } = useFirebaseBookings(currentUser);

  useEffect(() => {
    if (currentUser) localStorage.setItem("currentUser", currentUser);
    else localStorage.removeItem("currentUser");
  }, [currentUser]);

  // handle login from UserLogin (or quick user select)
  const handleLogin = (username) => {
    setCurrentUser(username);
  };

  const handleLogout = () => {
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

  const activeRoomNames = Array.isArray(bookings) ? bookings.map((b) => b.room) : [];

  if (!currentUser) {
    return <UserLogin onLogin={handleLogin} />;
  }

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row bg-gray-950 text-white min-h-screen">
        <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col bg-gray-900 p-6 border-r border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm text-gray-300">Login sebagai:</div>
              <div className="font-semibold text-pink-400">{currentUser || "Tidak Diketahui"}</div>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-red-400 hover:text-red-500"
              title="Logout"
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
          <BookingGridHeader activeFilter={filter} onChange={setFilter} />
          <div className="mt-6">
            <BookingGrid
              bookings={bookings}
              filter={filter}
              onCancel={removeBooking}
              onExtend={(b) => {
                extendBooking(b);
              }}
              onComplete={(id) => completeBooking(id)}
            />
          </div>
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
