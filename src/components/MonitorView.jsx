import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebaseconfig';

export default function MonitorView() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    const dbRef = ref(db, 'bookings');
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const parsed = Object.values(data).map(b => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        }));
        setBookings(parsed);
      } else {
        setBookings([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const formatTime = (date) =>
    new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Asia/Jakarta'
    });

  const getStatusColor = (booking) => {
    const now = new Date();
    if (now > booking.endTime) return 'border-red-500';
    const remaining = (booking.endTime - now) / 60000;
    if (remaining <= 10) return 'border-yellow-400';
    return 'border-green-500';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">Monitor KTV Rooms</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bookings.length === 0 && (
          <p className="text-center text-gray-400 col-span-full">
            Tidak ada pemesanan aktif.
          </p>
        )}

        {bookings.map((b) => (
          <div
            key={b.id}
            className={`rounded-xl p-5 shadow-xl border-2 ${getStatusColor(b)}`}
          >
            <h2 className="text-xl font-semibold mb-3">{b.room}</h2>
            <p>Masuk: <span className="font-mono">{formatTime(b.startTime)}</span></p>
            <p>Keluar: <span className="font-mono">{formatTime(b.endTime)}</span></p>
            <p>Durasi: {(b.durationInMinutes / 60).toFixed(1)} jam</p>
            <p>Total Harga: Rp {b.totalPrice.toLocaleString('id-ID')}</p>
          </div>
        ))}
      </div>
    </div>
  );
}