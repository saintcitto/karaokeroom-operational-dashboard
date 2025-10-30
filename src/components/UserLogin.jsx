import React, { useEffect } from "react";
import { start as ToneStart, context as ToneContext } from "tone";
import { motion, useAnimation } from "framer-motion";

function UserLogin({ onLogin }) {
  const controls = useAnimation();

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

  const users = [
    { id: 1, name: "Baya Ganteng", role: "Admin" },
    { id: 2, name: "Ayu", role: "Kasir" },
    { id: 3, name: "Ridho", role: "Kasir" },
    { id: 4, name: "Umi", role: "Kasir" },
    { id: 5, name: "Faisal", role: "Petugas Karaoke" },
    { id: 6, name: "Zahlul", role: "Petugas Karaoke" },
  ];

  const unlockAudio = async (user) => {
    try {
      const startPromise = ToneStart();
      if (startPromise && typeof startPromise.then === "function") {
        await startPromise.catch(() => {});
      }
      if (ToneContext.state !== "running") {
        await ToneContext.resume().catch(() => {});
      }
      console.log("🎧 Audio context unlocked or skipped.");
    } catch (err) {
      console.warn("⚠️ Tone.js context unlock failed:", err);
    }

    try {
      if (typeof onLogin === "function") {
        console.log("👤 Logging in user:", user);
        onLogin(user);
      }
    } catch (err) {
      console.error("🔥 Login handler crashed:", err);
    }
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-900 text-white relative overflow-hidden">
      <h1 className="text-2xl font-bold mb-6 text-pink-400 tracking-wide">
        🎤 Karaoke Sonia Operational Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 w-80">
        {users.map((user) => (
          <button
            key={user.id}
            onClick={() => unlockAudio(user.name)}
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-pink-600 hover:border-pink-500 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-pink-500/20"
          >
            {user.name}
            <div className="text-[11px] text-gray-400">{user.role}</div>
          </button>
        ))}
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
          {"sweet cherry pie".split("").map((char, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, duration: 0.4 }}
              className={char === " " ? "inline-block w-1" : "inline-block"}
            >
              {char}
            </motion.span>
          ))}
          <motion.span
            animate={{
              rotate: [0, 10, -10, 0],
              y: [0, -3, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block ml-2 text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
          >
            🍰
          </motion.span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.25, 0.1],
            scale: [1, 1.03, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="mt-2 w-36 h-[1px] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent blur-[2px]"
        />
      </motion.footer>
    </div>
  );
}

export default UserLogin;
