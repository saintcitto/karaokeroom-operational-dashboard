import React from "react";
import useFirebaseBookings from "../hooks/useFirebaseBookings";
import { formatCurrency, formatTime } from "../utils/helpers";

export default function MonitorView() {
  const { bookings, extendBooking, completeBooking, expiredBookings } = useFirebaseBookings();

  const activeBookings = bookings.filter(b => !b.expired);
  const expiredNow = expiredBookings.length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-pink-400 tracking-wide">
          🎧 Monitor & Kasir Karaoke
        </h1>
        <div className="flex gap-2 mt-3 sm:mt-0">
          <a
            href="/"
            className="text-sm bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg font-semibold transition-all"
          >
            ⬅️ Dashboard
          </a>
        </div>
      </header>

      {activeBookings.length === 0 ? (
        <p className="text-gray-400 text-center mt-20">Tidak ada pemesanan aktif saat ini.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {activeBookings.map((b) => {
            const now = new Date();
            const isExpired = now > b.endTime;
            const timeLeft = Math.max(0, (b.endTime - now) / 60000);
            const isWarning = !isExpired && timeLeft <= 10;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-lg shadow-lg border-2 transition-all ${
                  isExpired
                    ? "border-red-500 animate-pulse bg-red-900/40"
                    : isWarning
                    ? "border-yellow-400 bg-yellow-800/20"
                    : "border-green-500 bg-green-800/20"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold">{b.room}</h2>
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-md">
                    {isExpired ? "Expired" : isWarning ? "Akan Habis" : "Aktif"}
                  </span>
                </div>

                <p className="text-sm text-gray-300">
                  ⏱ <span className="font-semibold">Sisa:</span>{" "}
                  {isExpired ? "Waktu Habis" : `${Math.floor(timeLeft)} menit`}
                </p>
                <p className="text-sm text-gray-300">
                  🕓 <span className="font-semibold">Masuk:</span> {formatTime(b.startTime)}
                </p>
                <p className="text-sm text-gray-300">
                  ⏰ <span className="font-semibold">Keluar:</span> {formatTime(b.endTime)}
                </p>
                <p className="text-sm mt-2">
                  👥 <span className="font-semibold">Jumlah:</span> {b.people || 0}
                </p>
                <p className="mt-1 text-sm font-semibold text-pink-400">
                  💵 Total: {formatCurrency(b.totalPrice || 0)}
                </p>

                <div className="mt-3 flex gap-2">
                  {!isExpired && (
                    <button
                      onClick={() => extendBooking(b)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-sm transition-colors"
                    >
                      ➕ Perpanjang
                    </button>
                  )}
                  <button
                    onClick={() => completeBooking(b.id)}
                    className="flex-1 bg-red-700 hover:bg-red-800 text-white py-1 rounded-md text-sm transition-colors"
                  >
                    ✅ Selesai
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {expiredNow && (
        <div className="mt-10 text-center text-red-400 text-sm font-semibold animate-pulse">
          ⚠️ Ada ruangan yang sudah habis waktu — mohon cek dashboard utama.
        </div>
      )}
    </div>
  );
}
