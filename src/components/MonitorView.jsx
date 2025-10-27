import React, { useEffect, useState } from 'react';
import { db, ref, onValue } from '../firebaseConfig';

export default function MonitorView() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.values(data).map(b => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        }));
        setBookings(bookingsArray);
      } else {
        setBookings([]);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-pink-400 tracking-wide">
          🎧 Monitor Pemesanan Aktif
        </h1>
        <a
          href="/"
          className="mt-3 sm:mt-0 text-sm bg-pink-600 hover:bg-pink-700 px-4 py-2 rounded-lg font-semibold transition-all"
        >
          Kembali ke Dashboard
        </a>
      </header>

      {bookings.length === 0 ? (
        <p className="text-gray-400 text-center mt-20">
          Tidak ada pemesanan aktif saat ini.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((b) => {
            const now = new Date();
            const isExpired = now > b.endTime;
            const isWarning =
              !isExpired &&
              (b.endTime - now <= 10 * 60 * 1000);

            return (
              <div
                key={b.id}
                className={`p-4 rounded-lg shadow-lg border-2 transition-all
                  ${isExpired ? 'border-red-500 animate-pulse bg-red-900/40'
                  : isWarning ? 'border-yellow-400 bg-yellow-800/20'
                  : 'border-green-500 bg-green-800/20'}
                `}
              >
                <h2 className="text-xl font-bold mb-2">{b.room}</h2>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Masuk:</span>{' '}
                  {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="text-sm text-gray-300">
                  <span className="font-semibold">Keluar:</span>{' '}
                  {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <p className="mt-2 text-sm">
                  <span className="font-semibold">Durasi:</span>{' '}
                  {Math.round((b.endTime - b.startTime) / 60000)} menit
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-semibold">Tarif:</span>{' '}
                  Rp {b.tarif.toLocaleString('id-ID')} / jam
                </p>
                <p className="mt-1 text-sm font-semibold text-pink-400">
                  Total: Rp {b.totalPrice.toLocaleString('id-ID')}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}