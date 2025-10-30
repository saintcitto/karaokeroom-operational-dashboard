import React from "react";

export default function BookingGridHeader({ activeFilter, onChange }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "📋" },
    { id: "ending", label: "Akan Habis", icon: "⏳" },
    { id: "expired", label: "Waktu Habis", icon: "⚠️" },
  ];

  return (
    <div className="flex items-center gap-3 border-b border-gray-800/60 pb-3 mt-2">
      {tabs.map((tab) => {
        const active = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
              active
                ? "bg-gradient-to-r from-pink-500/30 to-purple-500/20 text-pink-400 shadow-inner"
                : "bg-gray-800/50 text-gray-400 hover:text-gray-200 hover:bg-gray-700/40"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
