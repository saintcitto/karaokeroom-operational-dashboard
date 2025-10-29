import React, { useEffect, useState, useRef, useCallback } from 'react';
import { db, ref, onValue, update, remove } from '../firebaseConfig';
import { Synth, Loop, Transport, start, context } from 'tone';
import { formatCurrency, formatTime } from '../utils/helpers';

export default function MonitorView() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const alarmRef = useRef(null);
  const synthRef = useRef(null);

  useEffect(() => {
    const unlockAudio = async () => {
      try {
        await start();
        if (context.state !== 'running') await context.resume();
        console.log('🔊 AudioContext unlocked!');
      } catch (e) {
        console.error('AudioContext unlock failed:', e);
      }
    };

    // cover ALL interaction types (desktop + mobile)
    ['click', 'touchstart', 'keydown'].forEach(evt => {
      window.addEventListener(evt, unlockAudio);
    });

    return () => {
      ['click', 'touchstart', 'keydown'].forEach(evt => {
        window.removeEventListener(evt, unlockAudio);
      });
    };
  }, []);

  const startAlarm = useCallback(async () => {
    try {
      if (document.hidden) return; // don’t play in background tab
      await start();
      if (context.state !== 'running') await context.resume();

      if (!alarmRef.current) {
        synthRef.current = new Synth().toDestination();
        const loop = new Loop(time => {
          synthRef.current.triggerAttackRelease("C5", "8n", time);
        }, "1.5s").start(0);
        alarmRef.current = loop;
      }

      if (Transport.state !== 'started') {
        Transport.start("+0.1");
        console.log("🚨 Alarm started");
      }
    } catch (e) {
      console.error("Gagal memainkan alarm (monitor):", e);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    try {
      if (alarmRef.current) {
        alarmRef.current.stop();
        alarmRef.current.dispose();
        alarmRef.current = null;
      }
      if (Transport.state === 'started') {
        Transport.stop();
        Transport.position = 0;
      }
      console.log("🔇 Alarm stopped");
    } catch (e) {
      console.error("Gagal menghentikan alarm:", e);
    }
  }, []);

  const fetchBookings = useCallback(() => {
    const bookingsRef = ref(db, 'bookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      setIsLoading(false);

      if (data) {
        const bookingsArray = Object.values(data)
          .filter(b => b.startTime && b.endTime)
          .map(b => ({
            ...b,
            startTime: new Date(b.startTime),
            endTime: new Date(b.endTime),
          }));
        setBookings(bookingsArray);

        const expiredNow = bookingsArray.find(b => b.expired === true);
        if (expiredNow) startAlarm();
        else stopAlarm();
      } else {
        setBookings([]);
        stopAlarm();
      }
    });

    return () => unsubscribe();
  }, [startAlarm, stopAlarm]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleCompleteSession = async (id) => {
    const confirm = window.confirm("Sesi ini sudah selesai? Akan dihapus dari daftar aktif.");
    if (!confirm) return;
    await remove(ref(db, 'bookings/' + id));
  };

  const handleExtendSession = async (booking) => {
    const confirm = window.confirm(`Perpanjang ${booking.room} selama 1 jam lagi?`);
    if (!confirm) return;
    const newEndTime = new Date(booking.endTime.getTime() + 60 * 60000);
    await update(ref(db, 'bookings/' + booking.id), {
      endTime: newEndTime.toISOString(),
    });
    alert(`Sesi ${booking.room} diperpanjang hingga ${formatTime(newEndTime)}.`);
  };

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
          <button
            onClick={fetchBookings}
            className="text-sm bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg font-semibold transition-all"
          >
            🔄 Refresh
          </button>
        </div>
      </header>

      {isLoading ? (
        <p className="text-gray-400 text-center mt-20">Memuat data...</p>
      ) : bookings.length === 0 ? (
        <p className="text-gray-400 text-center mt-20">Tidak ada pemesanan aktif saat ini.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((b) => {
            const now = new Date();
            const isExpired = now > b.endTime;
            const timeLeft = Math.max(0, (b.endTime - now) / 60000);
            const isWarning = !isExpired && timeLeft <= 10;

            return (
              <div
                key={b.id}
                className={`p-4 rounded-lg shadow-lg border-2 transition-all ${
                  isExpired
                    ? 'border-red-500 animate-pulse bg-red-900/40'
                    : isWarning
                    ? 'border-yellow-400 bg-yellow-800/20'
                    : 'border-green-500 bg-green-800/20'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold">{b.room}</h2>
                  <span className="text-xs bg-gray-700 px-2 py-0.5 rounded-md">
                    {isExpired ? 'Expired' : isWarning ? 'Akan Habis' : 'Aktif'}
                  </span>
                </div>

                <p className="text-sm text-gray-300">
                  ⏱ <span className="font-semibold">Sisa:</span>{' '}
                  {isExpired ? 'Waktu Habis' : `${Math.floor(timeLeft)} menit`}
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
                      onClick={() => handleExtendSession(b)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1 rounded-md text-sm transition-colors"
                    >
                      ➕ Perpanjang
                    </button>
                  )}
                  <button
                    onClick={() => handleCompleteSession(b.id)}
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
    </div>
  );
}
