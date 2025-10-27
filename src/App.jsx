import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Synth, Loop, Transport } from 'tone';
import { getBookingStatus, formatTimeForInput } from './utils/helpers';
import KTVErrorBoundary from './components/KTVErrorBoundary';
import SidebarForm from './components/SidebarForm';
import BookingGrid from './components/BookingGrid';
import ExpiredModal from './components/ExpiredModal';

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [now, setNow] = useState(new Date());
  const [expiredBooking, setExpiredBooking] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const alarmRef = useRef(null);

  // Update waktu tiap detik
  useEffect(() => {
    const timerId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // Load dari localStorage
  useEffect(() => {
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      try {
        const parsed = JSON.parse(savedBookings).map(b => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        }));
        setBookings(parsed);
      } catch (err) {
        console.error("❌ Gagal parsing bookings:", err);
      }
    }
    setHasLoaded(true);
  }, []);

  // Simpan ke localStorage setelah data berhasil dimuat
  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem('bookings', JSON.stringify(bookings));
    }
  }, [bookings, hasLoaded]);

  // --- Alarm Logic ---
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

  // --- Booking Logic ---
  const addBooking = (newBooking) => {
    setBookings(prev => [...prev, newBooking]);
  };

  const removeBooking = (bookingId) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
  };

  const handleExpire = useCallback((booking) => {
    if (!expiredBooking) {
      setExpiredBooking(booking);
      startAlarm();
    }
  }, [expiredBooking, startAlarm]);

  const handleCompleteSession = useCallback((bookingId) => {
    stopAlarm();
    removeBooking(bookingId);
    setExpiredBooking(null);
  }, [stopAlarm]);

  const handleExtendSession = useCallback((booking) => {
    stopAlarm();
    setExpiredBooking(null);
    setFormPrefill({
      room: booking.room,
      startTime: formatTimeForInput(booking.endTime)
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

  // --- Render ---
  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
        <aside className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-screen bg-gray-800 shadow-lg overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
          <SidebarForm
            activeRoomNames={activeRoomNames}
            onAddBooking={addBooking}
            formPrefill={formPrefill}
            onClearPrefill={() => setFormPrefill(null)}
          />
        </aside>

        <main className="w-full md:w-2/3 lg:w-3/4 h-screen bg-gray-800/50">
          <BookingGrid
            bookings={bookings}
            now={now}
            onExpire={handleExpire}
            onCancelBooking={removeBooking}
            stats={bookingStats}
          />
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