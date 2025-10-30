import React from "react";

export default function BookingGridHeader({ activeFilter, onChange }) {
  const tabs = [
    { id: "active", label: "Total Aktif", icon: "📋" },
    { id: "ending", label: "Akan Habis", icon: "⏳" },
    { id: "expired", label: "Waktu Habis", icon: "⚠️" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-start gap-3 mb-6 border-b border-gray-800/70 pb-4 backdrop-blur-xl">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-[15px] font-medium transition-all duration-300 select-none ${
              isActive
                ? "bg-gradient-to-br from-pink-500/30 to-pink-600/20 text-pink-300 border border-pink-400/40 shadow-[0_0_15px_rgba(255,192,203,0.2)]"
                : "bg-gray-800/40 text-gray-400 border border-gray-700/50 hover:bg-gray-700/50 hover:text-gray-200 hover:border-gray-600/60"
            }`}
            style={{
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          >
            <span className="text-lg">{tab.icon}</span>
            <span className="tracking-tight">{tab.label}</span>
            {isActive && (
              <div className="ml-2 w-2 h-2 bg-pink-400 rounded-full animate-pulse" />
            )}
          </button>
        );
      })}
    </div>
  );
}
