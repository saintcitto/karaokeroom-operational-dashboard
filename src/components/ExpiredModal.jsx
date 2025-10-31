// src/components/ExpiredModal.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpiredModal({ booking, onComplete, onExtend }) {
  if (!booking) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="expired-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.97, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.97, opacity: 0, y: -12 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700/60 w-[92%] max-w-md p-7 relative"
        >
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-red-600 rounded-full text-xs font-semibold shadow-md">
            ⚠️ Waktu Habis
          </div>

          <div className="pt-4 pb-2 text-center">
            <h2 className="text-lg font-bold text-red-400 mb-1">{booking.room || "Ruangan"}</h2>
            <p className="text-gray-300 text-sm mb-5">
              Waktu karaoke telah berakhir. Silakan tekan <span className="font-semibold">Selesaikan Sesi</span> untuk memindahkan sesi ke laporan.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                // only complete action (no extend)
                if (typeof onComplete === "function") onComplete(booking.id);
              }}
              className="flex-1 px-5 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-red-600/30"
            >
              Selesaikan Sesi
            </button>
          </div>

          <div className="mt-6 text-xs text-center text-gray-400 border-t border-gray-700/60 pt-3">
            Pastikan mencatat laporan setelah sesi diselesaikan.
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
