import React, { useState } from "react";
import { start as ToneStart } from "tone";

export default function UserLogin({ onLogin }) {
  const [unlocked, setUnlocked] = useState(false);

  const handleUnlock = async () => {
    try {
      await ToneStart(); // 🔓 Unlock AudioContext
      setUnlocked(true);
    } catch (err) {
      console.warn("Audio unlock failed:", err);
    }
  };

  const users = [
    { name: "Baya Ganteng", role: "Admin" },
    { name: "Ayu", role: "Kasir" },
    { name: "Ridho", role: "Kasir" },
    { name: "Umi", role: "Kasir" },
    { name: "Faisal", role: "Petugas Karaoke" },
    { name: "Zahlul", role: "Petugas Karaoke" },
  ];

  if (!unlocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">
          🎤 KTV Operational Dashboard
        </h1>
        <p className="text-sm text-gray-400 mb-4 text-center w-72">
          Klik tombol di bawah untuk mengaktifkan sistem audio
        </p>
        <button
          onClick={handleUnlock}
          className="px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
        >
          🔊 Aktifkan Suara
        </button>
        <footer className="absolute bottom-6 text-sm text-gray-500">
          sweet cherry pie 🍰
        </footer>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
      <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">
        🎤 Sonia Karaoke Operational Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 w-80">
        {users.map((user) => (
          <button
            key={user.name}
            onClick={() => onLogin(user.name)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-pink-600 hover:border-pink-500 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
          >
            {user.name}
            <div className="text-[11px] text-gray-400">{user.role}</div>
          </button>
        ))}
      </div>

      <footer className="absolute bottom-6 text-sm text-gray-500">
        sweet cherry pie 🍰
      </footer>
    </div>
  );
}
