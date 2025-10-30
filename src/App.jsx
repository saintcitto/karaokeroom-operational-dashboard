import React, { useEffect } from "react";
import { start as ToneStart, context as ToneContext } from "tone";
import { motion, useAnimation } from "framer-motion";

export default function UserLogin({ onLogin }) {
  const controls = useAnimation();

  const users = [
    { id: 1, name: "Baya Ganteng", role: "Admin" },
    { id: 2, name: "Ayu", role: "Kasir" },
    { id: 3, name: "Ridho", role: "Kasir" },
    { id: 4, name: "Umi", role: "Kasir" },
    { id: 5, name: "Faisal", role: "Petugas Karaoke" },
    { id: 6, name: "Zahlul", role: "Petugas Karaoke" },
  ];

  useEffect(() => {
    const loop = async () => {
      while (true) {
        await controls.start({
          opacity: [0.7, 1, 0.9, 1],
          scale: [1, 1.03, 1],
          textShadow: [
            "0 0 0px rgba(244,114,182,0)",
            "0 0 8px rgba(244,114,182,0.4)",
            "0 0 18px rgba(244,114,182,0.7)",
            "0 0 0px rgba(244,114,182,0)",
          ],
          transition: { duration: 5, ease: "easeInOut" },
        });
      }
    };
    loop();
  }, [controls]);

  const unlockAudio = async (user) => {
    try {
      await ToneStart();
      await ToneContext.resume();
      if (onLogin && typeof onLogin === "function") {
        onLogin(user);
      }
    } catch (err) {
      console.error("⚠️ Tone.js error:", err);
      if (onLogin) onLogin(user);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">
        🎤 Karaoke Sonia Operational Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 w-80">
        {users.length > 0 ? (
          users.map((user) => (
            <button
              key={user.id}
              onClick={() => unlockAudio(user.name)}
              className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-pink-600 hover:border-pink-500 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
            >
              {user.name}
              <div className="text-[11px] text-gray-400">{user.role}</div>
            </button>
          ))
        ) : (
          <div className="text-gray-400 text-sm mt-4">No users available</div>
        )}
      </div>

      <motion.footer
        animate={controls}
        className="absolute bottom-10 w-full flex flex-col items-center justify-center text-gray-400 select-none"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-sm font-light tracking-[0.2em]"
        >
          sweet cherry pie 🍰
        </motion.div>
      </motion.footer>
    </div>
  );
}
