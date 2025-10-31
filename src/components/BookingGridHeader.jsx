import React from "react";

export default function BookingGridHeader({ activeFilter = "active", onChange = () => {} }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "🎵" },
    { id: "ending", label: "Akan Habis", icon: "⏳" },
    { id: "expired", label: "Waktu Habis", icon: "⚠️" },
  ];

  return (
    <div className="p-6 border-b border-gray-800/60">
      <div className="flex items-center gap-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
              activeFilter === tab.id
                ? "bg-gradient-to-r from-pink-600/30 to-purple-500/20 text-pink-400 shadow-sm"
                : "bg-gray-800/40 text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
