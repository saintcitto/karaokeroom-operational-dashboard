import React, { useState } from "react";
import SidebarForm from "./components/SidebarForm";
import BookingGrid from "./components/BookingGrid";
import useFirebaseBookings from "./hooks/useFirebaseBookings";

export default function App() {
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("currentUser") || ""
  );
  const { bookings, addBooking, removeBooking, completeBooking } = useFirebaseBookings();
  const [filter, setFilter] = useState("active");

  const handleLogout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser("");
  };

  const handleAddBooking = async (payload) => {
    try {
      await addBooking({
        ...payload,
        cashier: currentUser || "Tidak Diketahui",
      });
    } catch (err) {
      console.error("Gagal menambah booking:", err);
    }
  };

  return (
    <div className="flex flex-col md:flex-row bg-gray-950 text-white min-h-screen">
      <SidebarForm
        currentUser={currentUser}
        onLogout={handleLogout}
        onAddBooking={handleAddBooking}
      />
      <main className="flex-1 overflow-y-auto">
        <BookingGrid
          bookings={bookings}
          onCancel={removeBooking}
          onComplete={(id) => completeBooking(id, currentUser)}
          filter={filter}
        />
      </main>
    </div>
  );
}
