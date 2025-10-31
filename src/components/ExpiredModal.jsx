import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ExpiredModal({ booking, onComplete, onClose }) {
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
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 20 }}
          className="bg-gray-900 text-white rounded-2xl shadow-2xl border border-gray-700/50 w-[90%] max-w-md p-6"
        >
          <div className="text-center mb-4">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-red-600 text-xs font-semibold mb-3">⚠️ Waktu Habis</div>
            <h3 className="text-lg font-semibold">Ruangan {booking.room}</h3>
            <p className="text-sm text-gray-400 mt-2">Waktu karaoke telah berakhir. Pilih tindakan untuk menyelesaikan sesi.</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => onComplete && onComplete(booking.id)}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold"
            >
              Selesaikan Sesi
            </button>
            <button
              onClick={() => onClose && onClose()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-semibold"
            >
              Batal
            </button>
          </div>

          <div className="mt-4 text-xs text-center text-gray-500">Pastikan mencatat laporan setelah sesi diselesaikan.</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
