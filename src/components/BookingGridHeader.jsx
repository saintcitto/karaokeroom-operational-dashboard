import React from "react";

export default function BookingGridHeader({ activeFilter, onChange }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "📋" },
    { id: "ending", label: "Akan Habis", icon: "⏳" },
    { id: "expired", label: "Waktu Habis", icon: "⚠️" },
  ];

  return (
    <div className="flex items-center justify-start gap-3 mb-6 border-b border-gray-800 pb-3 backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-300 ${
              isActive
                ? "bg-gradient-to-br from-pink-500/30 to-pink-600/20 text-pink-300 border border-pink-400/30 shadow-[0_0_15px_rgba(255,192,203,0.25)]"
                : "bg-gray-800/40 text-gray-400 hover:bg-gray-700/50 hover:text-gray-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
            {isActive && <div className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" />}
          </button>
        );
      })}
    </div>
  );
}
