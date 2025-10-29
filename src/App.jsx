import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Synth, Loop, Transport } from 'tone';
import { getBookingStatus, formatTimeForInput } from './utils/helpers';
import KTVErrorBoundary from './components/KTVErrorBoundary';
import SidebarForm from './components/SidebarForm';
import BookingGrid from './components/BookingGrid';
import ExpiredModal from './components/ExpiredModal';
import HistoryReportDashboard from './components/HistoryReportDashboard';
import { db, ref, set, onValue, remove, update, push } from './firebaseConfig';

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [persistedBookings, setPersistedBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(new Date());
  const [expiredBooking, setExpiredBooking] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const alarmRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const bookingsRef = ref(db, 'bookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setBookings([]);
      const cleaned = Object.values(data)
        .filter(b => b && b.startTime && b.endTime && !isNaN(new Date(b.startTime)) && !isNaN(new Date(b.endTime)))
        .map(b => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        }));
      setPersistedBookings(cleaned);
      setBookings(cleaned);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const historyRef = ref(db, 'history');
    return onValue(historyRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setHistory([]);
      setHistory(Object.values(data));
    });
  }, []);

  const startAlarm = useCallback(() => {
    try {
      if (!alarmRef.current) {
        const synth = new Synth().toDestination();
        const loop = new Loop(time => synth.triggerAttackRelease("C5", "8n", time), "1.5s").start(0);
        alarmRef.current = loop;
      }
      if (Transport.state !== 'started') setTimeout(() => Transport.start(), 100);
    } catch (e) {}
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
    setBookings(prev => [...prev, bookingWithFlag]);
    set(ref(db, 'bookings/' + newBooking.id), {
      ...bookingWithFlag,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
    });
  };

  const removeBooking = (bookingId) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    remove(ref(db, 'bookings/' + bookingId));
  };

  const saveHistory = useCallback(async (booking) => {
    const historyRef = ref(db, 'history');
    const newRef = push(historyRef);
    await set(newRef, {
      ...booking,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      savedAt: new Date().toISOString(),
    });
  }, []);

  const handleExpire = useCallback((booking) => {
    update(ref(db, 'bookings/' + booking.id), { expired: true });
    setExpiredBooking(booking);
  }, []);

  const handleCompleteSession = useCallback(async (bookingId) => {
    stopAlarm();
    const done = bookings.find(b => b.id === bookingId);
    if (done) await saveHistory(done);
    removeBooking(bookingId);
    setExpiredBooking(null);
  }, [bookings, stopAlarm, saveHistory]);

  const handleExtendSession = useCallback((booking) => {
    stopAlarm();
    setExpiredBooking(null);
    setFormPrefill({
      room: booking.room,
      startTime: formatTimeForInput(booking.endTime),
      note: `Perpanjangan dari sesi sebelumnya (${formatTimeForInput(booking.startTime)} - ${formatTimeForInput(booking.endTime)})`,
    });
    removeBooking(booking.id);
  }, [stopAlarm]);

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
        </aside>

        <main className="flex-1 h-screen overflow-y-auto bg-gray-800/50">
          <BookingGrid
            bookings={bookings}
            now={now}
            onExpire={handleExpire}
            onCancelBooking={removeBooking}
            stats={bookingStats}
          />
          <HistoryReportDashboard history={history} />
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
