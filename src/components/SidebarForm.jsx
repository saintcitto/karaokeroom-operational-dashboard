import React from "react";

export default function SidebarForm({
  rooms = [],
  onAddBooking = () => {},
  currentUser = null,
  onLogout = () => {},
  saving = false,
}) {
  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-start bg-gray-900 p-6 text-white shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400">Login sebagai:</div>
          <div className="font-semibold text-pink-400">
            {currentUser || "Tamu"}
          </div>
        </div>
        <button
          onClick={onLogout}
          className="text-sm text-red-400 hover:text-red-500 focus:outline-none active:scale-95"
        >
          Logout
        </button>
      </div>

      {/* ...Form tetap sama seperti sebelumnya... */}
    </aside>
  );
}
