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
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700 w-[90%] max-w-md p-6 pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="text-xl font-bold text-red-400 mb-2 text-center">⏰ Waktu Habis</h2>
          <p className="text-gray-300 text-sm text-center mb-6">
            Ruangan <span className="font-semibold text-white">{booking.room}</span> telah mencapai batas waktu. Pilih tindakan berikut:
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              type="button"
              onClick={() => onExtend(booking)}
              className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-green-600/30"
            >
              Tambah Waktu
            </button>

            <button
              type="button"
              onClick={() => onComplete(booking.id)}
              className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-red-600/30"
            >
              Selesaikan Sesi
            </button>
          </div>

          <div className="mt-6 text-xs text-center text-gray-400">Pastikan mencatat laporan setelah sesi diselesaikan.</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
