import React from "react";
import { motion, useAnimation } from "framer-motion";
import { start as ToneStart, context as ToneContext } from "tone";

export default function UserLogin({ onLogin }) {
  const users = [
    { id: "USR-001", name: "Baya Ganteng", role: "Admin" },
    { id: "USR-002", name: "Ayu", role: "Kasir" },
    { id: "USR-003", name: "Ridho", role: "Kasir" },
    { id: "USR-004", name: "Umi", role: "Kasir" },
    { id: "USR-005", name: "Faisal", role: "Petugas Karaoke" },
    { id: "USR-006", name: "Zahlul", role: "Petugas Karaoke" },
  ];

  const unlockAudio = async (user) => {
    try {
      await ToneStart();
      await ToneContext.resume();
    } catch {}
    onLogin(user.name);
  };

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-gray-950 text-white overflow-hidden">
      <h1 className="text-3xl font-bold mb-10 text-pink-400 tracking-wide drop-shadow-[0_0_12px_rgba(244,114,182,0.3)]">
        🎤 Karaoke Sonia Operational Dashboard
      </h1>

      <div className="grid grid-cols-2 gap-4 w-80">
        {users.map((user) => (
          <motion.button
            key={user.id}
            whileHover={{
              scale: 1.08,
              boxShadow: "0 0 15px rgba(244,114,182,0.4)",
              backgroundColor: "rgba(236,72,153,0.15)",
            }}
            whileTap={{ scale: 0.96 }}
            onClick={() => unlockAudio(user)}
            className="px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl hover:border-pink-500 text-sm font-medium text-white transition-all duration-200 shadow-lg hover:shadow-pink-500/30 relative group"
          >
            <span className="text-white">{user.name}</span>
            <div className="text-[11px] text-gray-400">{user.role}</div>
            <motion.span
              initial={{ opacity: 0, y: 5 }}
              whileHover={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-1 right-2 text-[10px] text-gray-500 group-hover:text-pink-400"
            >
              #{user.id}
            </motion.span>
          </motion.button>
        ))}
      </div>

      {/* 🌌 Living Footer */}
      <footer className="absolute bottom-8 w-full flex items-center justify-center">
        <LivingFooter />
      </footer>
    </div>
  );
}

function LivingFooter() {
  const controls = useAnimation();

  React.useEffect(() => {
    const pulse = async () => {
      while (true) {
        await controls.start({
          textShadow: [
            "0 0 0px rgba(244,114,182,0)",
            "0 0 12px rgba(244,114,182,0.4)",
            "0 0 20px rgba(244,114,182,0.6)",
            "0 0 0px rgba(244,114,182,0)",
          ],
          opacity: [0.6, 1, 0.9, 1],
          scale: [1, 1.03, 1],
          transition: { duration: 6, ease: "easeInOut" },
        });
      }
    };
    pulse();
  }, [controls]);

  return (
    <motion.div
      animate={controls}
      className="font-light tracking-[0.2em] text-gray-400 select-none relative"
    >
      {Array.from("sweet cherry pie").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, duration: 0.4, ease: "easeOut" }}
          className={char === " " ? "inline-block w-1" : "inline-block"}
        >
          {char}
        </motion.span>
      ))}
      <motion.span
        animate={{
          rotate: [0, 15, -15, 10, -10, 0],
          scale: [1, 1.1, 1],
          y: [0, -2, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="inline-block ml-2 text-pink-400 drop-shadow-[0_0_10px_rgba(244,114,182,0.5)]"
      >
        🍰
      </motion.span>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0.05, 0.2, 0.05],
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-[1px] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent blur-[2px]"
      />
    </motion.div>
  );
}
