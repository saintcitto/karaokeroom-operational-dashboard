import React from "react";
import { motion } from "framer-motion";

export default function LoginScreen({ onSelectKasir }) {
  const users = [
    { name: "Baya Ganteng", role: "Admin" },
    { name: "Ayu", role: "Kasir" },
    { name: "Ridho", role: "Kasir" },
    { name: "Umi", role: "Kasir" },
    { name: "Faisal", role: "Petugas Karaoke" },
    { name: "Zahlul", role: "Petugas Karaoke" },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white relative overflow-hidden">
      {/* subtle floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(40)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-pink-500/10 rounded-full blur-xl"
            style={{
              width: Math.random() * 8 + 4,
              height: Math.random() * 8 + 4,
              top: Math.random() * 100 + "%",
              left: Math.random() * 100 + "%",
            }}
            animate={{
              y: [0, -15, 0],
              opacity: [0.4, 0.8, 0.4],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: Math.random() * 6 + 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* title section */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative z-10 text-center mb-10"
      >
        <h1 className="text-2xl md:text-3xl font-bold text-pink-400 tracking-wide">
          🎤 Karaoke Sonia Operational Dashboard
        </h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="text-pink-300 mt-3 text-sm md:text-base font-medium italic drop-shadow-md"
        >
          Sweet Cherry Pie 🍰
        </motion.p>
      </motion.div>

      {/* user selection */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        className="grid grid-cols-2 gap-4 md:gap-6 relative z-10"
      >
        {users.map((user, i) => (
          <motion.button
            key={user.name}
            onClick={() => onSelectKasir(user)}
            whileHover={{
              scale: 1.05,
              boxShadow: "0 0 25px rgba(255, 105, 180, 0.3)",
            }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-4 rounded-xl bg-gray-800/70 backdrop-blur-lg border border-pink-500/20 hover:border-pink-400/50 hover:bg-gray-800/90 text-left shadow-lg"
          >
            <p className="font-semibold text-white">{user.name}</p>
            <p className="text-sm text-gray-400">{user.role}</p>
          </motion.button>
        ))}
      </motion.div>

      {/* footer shimmer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-6 text-xs text-gray-500 tracking-wider"
      >
        <span className="text-pink-400/80">Sonia System</span> © 2025 — crafted with 🍰 by Sweet Cherry Logic
      </motion.div>
    </div>
  );
}
