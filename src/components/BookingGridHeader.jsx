import React from "react";

export default function BookingGridHeader({ activeFilter = "active", onChange = () => {} }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "🎵" },
    { id: "ending", label: "Akan Habis", icon: "⏳" }
  ];

  return (
    <div className="px-6 py-4 border-b border-gray-800">
      <div className="flex items-center gap-3">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => onChange(t.id)} className={`px-4 py-2 rounded-full ${activeFilter === t.id ? "bg-pink-500 text-white" : "bg-gray-800 text-gray-300"}`}>
            <span className="mr-2">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
