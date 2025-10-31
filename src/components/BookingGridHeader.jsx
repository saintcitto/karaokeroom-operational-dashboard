// src/components/BookingGridHeader.jsx
import React from "react";

export default function BookingGridHeader({ activeFilter = "active", onChange = () => {} }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "🎵" },
    { id: "ending", label: "Akan Habis", icon: "⏳" },
    { id: "expired", label: "Waktu Habis", icon: "⚠️" },
  ];

  return (
    <div className="px-6 pt-6">
      <div className="flex items-center gap-3 mb-4">
        {tabs.map((tab) => {
          const active = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              aria-pressed={active}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none ${
                active
                  ? "bg-gradient-to-r from-pink-600/30 to-purple-500/20 text-pink-400 shadow-sm"
                  : "bg-gray-800/40 text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
              }`}
            >
              <span aria-hidden>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
      <hr className="border-t border-gray-800/50" />
    </div>
  );
}
