import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Synth, Loop, Transport } from 'tone';
import { getBookingStatus, formatTimeForInput } from './utils/helpers';
import KTVErrorBoundary from './components/KTVErrorBoundary';
import SidebarForm from './components/SidebarForm';
import BookingGrid from './components/BookingGrid';
import ExpiredModal from './components/ExpiredModal';
import HistoryTable from './components/HistoryTable';
import HistoryReport from './components/HistoryReport';
import { db, ref, set, onValue, remove, update } from './firebaseConfig';

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(new Date());
  const [expiredBooking, setExpiredBooking] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [viewMode, setViewMode] = useState('active');
  const alarmRef = useRef(null);

  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const syncBookings = useCallback(() => {
    const bookingsRef = ref(db, 'bookings');
    onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const bookingsArray = Object.values(data)
          .filter(b => b.startTime && b.endTime && !isNaN(new Date(b.startTime)))
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
  }, []);

  useEffect(() => {
    syncBookings();
  }, [syncBookings]);

  const startAlarm = useCallback(() => {
    try {
      if (!alarmRef.current) {
        const synth = new Synth().toDestination();
        const loop = new Loop(time => {
          synth.triggerAttackRelease("C5", "8n", time);
        }, "1.5s").start(0);
        alarmRef.current = loop;
      }
      if (Transport.state !== 'started') {
        setTimeout(() => Transport.start(), 100);
      }
    } catch (e) {
      console.error("Gagal memainkan alarm:", e);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current.dispose();
      alarmRef.current = null;
    }
    if (Transport.state === 'started') {
      Transport.stop();
      Transport.position = 0;
    }
  }, []);

  const addBooking = (newBooking) => {
    const bookingWithFlag = { ...newBooking, expired: false };
    set(ref(db, 'bookings/' + newBooking.id), {
      ...bookingWithFlag,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
    }).catch((err) => console.error("Gagal menambahkan booking:", err));
  };

  const removeBooking = (bookingId) => {
    remove(ref(db, 'bookings/' + bookingId));
  };

  const handleExpire = useCallback((booking) => {
    update(ref(db, 'bookings/' + booking.id), { expired: true });
    setExpiredBooking(booking);
  }, []);

  const handleCompleteSession = useCallback((bookingId) => {
    const completed = bookings.find(b => b.id === bookingId);
    if (completed) {
      setHistory(prev => [...prev, completed]);
    }
    stopAlarm();
    removeBooking(bookingId);
    setExpiredBooking(null);
  }, [bookings, stopAlarm]);

  const handleExtendSession = useCallback((booking) => {
    stopAlarm();
    setExpiredBooking(null);
    setFormPrefill({
      room: booking.room,
      startTime: formatTimeForInput(booking.endTime)
    });
    removeBooking(booking.id);
  }, [stopAlarm]);

  const clearAllBookings = async () => {
    if (window.confirm("Yakin ingin menghapus SEMUA data booking & histori?")) {
      await remove(ref(db, 'bookings'));
      setBookings([]);
      setHistory([]);
      alert("Semua data berhasil dihapus.");
    }
  };

  const activeRoomNames = useMemo(() => bookings.map(b => b.room), [bookings]);

  const bookingStats = useMemo(() => {
    const stats = { active: 0, warning: 0, expired: 0 };
    (bookings || []).forEach(booking => {
      const status = getBookingStatus(booking.endTime, now);
      if (status === 'warning') stats.warning++;
      if (status === 'expired') stats.expired++;
    });
    stats.active = bookings.length;
    return stats;
  }, [bookings, now]);

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
        <aside className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-screen bg-gray-800 shadow-lg overflow-y-auto">
          <SidebarForm
            activeRoomNames={activeRoomNames}
            onAddBooking={addBooking}
            formPrefill={formPrefill}
            onClearPrefill={() => setFormPrefill(null)}
          />
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={() => setViewMode(viewMode === 'active' ? 'history' : 'active')}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-medium transition-colors"
            >
              {viewMode === 'active' ? '📊 Lihat Data Historis' : '⬅️ Kembali ke Pemesanan'}
            </button>
            <button
              onClick={syncBookings}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 rounded-md font-medium transition-colors"
            >
              🔄 Sinkronisasi Ulang
            </button>
            <button
              onClick={clearAllBookings}
              className="w-full py-2 bg-red-700 hover:bg-red-800 rounded-md font-medium transition-colors"
            >
              🧹 Reset Database
            </button>
          </div>
        </aside>

        <main className="w-full md:w-2/3 lg:w-3/4 h-screen overflow-y-auto bg-gray-800/50 p-4">
          {viewMode === 'active' ? (
            <BookingGrid
              bookings={bookings}
              now={now}
              onExpire={handleExpire}
              onCancelBooking={removeBooking}
              stats={bookingStats}
            />
          ) : (
            <>
              <HistoryReport history={history} />
              <div className="mt-6">
                <HistoryTable history={history} />
              </div>
            </>
          )}
        </main>

        {expiredBooking && (
          <ExpiredModal
            booking={expiredBooking}
            onComplete={handleCompleteSession}
            onExtend={handleExtendSession}
          />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
