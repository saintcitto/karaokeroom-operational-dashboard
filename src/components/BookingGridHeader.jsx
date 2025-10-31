import React from "react";

export default function BookingGridHeader({ activeFilter = "active", onChange = () => {} }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "🎵" },
    { id: "ending", label: "Akan Habis", icon: "⏳" },
    { id: "expired", label: "Waktu Habis", icon: "⚠️" },
  ];

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
              activeFilter === t.id ? "bg-gradient-to-r from-pink-600/30 to-purple-500/20 text-pink-400" : "bg-gray-800/40 text-gray-400"
            }`}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
