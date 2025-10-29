import React, { useState, useEffect } from "react";
import { start as ToneStart, context as ToneContext } from "tone";

export default function UserLogin({ onLogin }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    const tryUnlockAudio = async () => {
      try {
        await ToneStart();
        await ToneContext.resume();
        const buffer = ToneContext.createBufferSource();
        const gain = ToneContext.createGain();
        buffer.buffer = ToneContext.createBuffer(1, 1, ToneContext.sampleRate);
        buffer.connect(gain);
        gain.connect(ToneContext.destination);
        buffer.start(0);
        setAudioUnlocked(true);
        console.log("✅ AudioContext unlocked globally.");
      } catch (err) {
        console.warn("Audio unlock failed:", err);
      }
    };

    const gestureUnlock = () => {
      tryUnlockAudio();
      window.removeEventListener("click", gestureUnlock);
      window.removeEventListener("touchstart", gestureUnlock);
    };

    window.addEventListener("click", gestureUnlock);
    window.addEventListener("touchstart", gestureUnlock);

    return () => {
      window.removeEventListener("click", gestureUnlock);
      window.removeEventListener("touchstart", gestureUnlock);
    };
  }, []);

  const users = [
    { name: "Baya Ganteng", role: "Admin" },
    { name: "Ayu", role: "Kasir" },
    { name: "Ridho", role: "Kasir" },
    { name: "Umi", role: "Kasir" },
    { name: "Faisal", role: "Petugas Karaoke" },
    { name: "Zahlul", role: "Petugas Karaoke" },
  ];

  if (!audioUnlocked) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
        <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">
        🎤 Karaoke Sonia Operational Dashboard
        </h1>
        <p className="text-sm text-gray-400 mb-4 text-center w-72">
          Klik di mana saja untuk mengaktifkan sistem audio 🎧
        </p>
        <button
          onClick={() => setAudioUnlocked(true)}
          className="px-5 py-3 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300"
        >
          🔊 Aktifkan Audio
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
        🎤 Karaoke Sonia Operational Dashboard
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
