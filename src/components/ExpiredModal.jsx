import React from "react";

export default function ExpiredModal({ booking = {}, onComplete = () => {}, onCancel = () => {} }) {
  const roomLabel = booking.room || "Ruangan";

  const handleComplete = () => {
    if (!booking.id) return;
    onComplete(booking.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-xl p-8 w-96 text-center">
        <div className="inline-block bg-red-500 text-white px-3 py-1 rounded-full text-sm mb-4">⚠️ Waktu Habis</div>
        <h3 className="text-lg font-semibold mb-2">{roomLabel}</h3>
        <p className="text-sm text-gray-300 mb-6">Waktu karaoke telah berakhir. Pilih tindakan untuk menyelesaikan sesi.</p>
        <div className="flex gap-4 justify-center">
          <button onClick={handleComplete} className="px-5 py-2 bg-red-600 rounded text-white">Selesaikan Sesi</button>
          <button onClick={onCancel} className="px-5 py-2 bg-gray-600 rounded text-white">Batal</button>
        </div>
        <div className="mt-4 text-xs text-gray-400">Pastikan mencatat laporan setelah sesi diselesaikan.</div>
      </div>
    </div>
  );
}
