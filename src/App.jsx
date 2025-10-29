import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Synth, Loop, Transport } from 'tone';
import { formatTimeForInput } from './utils/helpers';
import KTVErrorBoundary from './components/KTVErrorBoundary';
import SidebarForm from './components/SidebarForm';
import BookingGrid from './components/BookingGrid';
import ExpiredModal from './components/ExpiredModal';
import HistoryReportDashboard from './components/HistoryReportDashboard';
import UserLogin from './components/UserLogin';
import { db, ref, set, onValue, remove, update, push } from './firebaseConfig';

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());
  const [expiredBooking, setExpiredBooking] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem('currentUser') || '');
  const [history, setHistory] = useState([]);
  const alarmRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const bookingsRef = ref(db, 'bookings');
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const valid = Object.values(data)
        .filter(b => b && b.room && b.startTime && b.endTime)
        .map(b => ({
          ...b,
          startTime: new Date(b.startTime),
          endTime: new Date(b.endTime),
        }));
      setBookings(valid);
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const historyRef = ref(db, 'history');
    const unsubscribe = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      setHistory(Object.values(data));
    });
    return () => unsubscribe();
  }, []);

  const startAlarm = useCallback(() => {
    if (!alarmRef.current) {
      const synth = new Synth().toDestination();
      const loop = new Loop(time => synth.triggerAttackRelease("C5", "8n", time), "1.5s").start(0);
      alarmRef.current = loop;
    }
    if (Transport.state !== 'started') Transport.start();
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current.dispose();
      alarmRef.current = null;
    }
    if (Transport.state === 'started') Transport.stop();
  }, []);

  const addBooking = (newBooking) => {
    if (!newBooking) return;
    const bookingRef = ref(db, 'bookings/' + newBooking.id);
    set(bookingRef, {
      ...newBooking,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
      handledBy: currentUser
    });
    const logRef = push(ref(db, 'logs'));
    set(logRef, {
      type: 'BOOKING_CREATED',
      room: newBooking.room,
      handledBy: currentUser,
      timestamp: new Date().toISOString()
    });
  };

  const removeBooking = (bookingId) => {
    if (!bookingId) return;
    remove(ref(db, 'bookings/' + bookingId));
  };

  const handleExpire = useCallback((booking) => {
    if (!booking) return;
    update(ref(db, 'bookings/' + booking.id), { expired: true });
    setExpiredBooking(booking);
    startAlarm();
  }, [startAlarm]);

  const handleCompleteSession = useCallback((bookingId) => {
    const finished = bookings.find(b => b.id === bookingId);
    if (finished) {
      const dateKey = new Date().toISOString().split('T')[0];
      const shift = new Date().getHours() < 17 ? 'pagi' : 'malam';
      const historyRef = push(ref(db, `history/${dateKey}/sessions`));
      set(historyRef, {
        ...finished,
        finishedAt: new Date().toISOString(),
        shift,
        handledBy: currentUser
      });
      const totalsRef = ref(db, `history/${dateKey}/totals`);
      onValue(totalsRef, (snapshot) => {
        const current = snapshot.val() || { pagi: 0, malam: 0, total: 0 };
        const updated = {
          pagi: shift === 'pagi' ? current.pagi + (finished.totalPrice || 0) : current.pagi,
          malam: shift === 'malam' ? current.malam + (finished.totalPrice || 0) : current.malam,
          total: current.total + (finished.totalPrice || 0)
        };
        set(totalsRef, updated);
      }, { onlyOnce: true });
      const logRef = push(ref(db, 'logs'));
      set(logRef, {
        type: 'SESSION_COMPLETED',
        room: finished.room,
        handledBy: currentUser,
        totalPrice: finished.totalPrice,
        timestamp: new Date().toISOString()
      });
    }
    stopAlarm();
    removeBooking(bookingId);
    setExpiredBooking(null);
  }, [bookings, stopAlarm, currentUser]);

  const handleExtendSession = useCallback((booking) => {
    if (!booking) return;
    stopAlarm();
    setExpiredBooking(null);
    setFormPrefill({ room: booking.room, startTime: formatTimeForInput(booking.endTime) });
    removeBooking(booking.id);
  }, [stopAlarm]);

  if (!currentUser) return <UserLogin onLogin={(user) => setCurrentUser(user)} />;

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
        <aside className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-screen bg-gray-800 shadow-lg overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <span className="text-sm text-gray-300">Login sebagai:</span>
            <span className="font-semibold text-pink-400">{currentUser}</span>
            <button
              onClick={() => {
                localStorage.removeItem('currentUser');
                setCurrentUser('');
              }}
              className="text-xs text-red-400 hover:text-red-500 ml-2"
            >
              Logout
            </button>
          </div>
          <SidebarForm
            activeRoomNames={safeBookings.map(b => b.room)}
            onAddBooking={addBooking}
            formPrefill={formPrefill}
            onClearPrefill={() => setFormPrefill(null)}
            onShowHistory={() => setShowHistory(true)}
            currentUser={currentUser}
            />
        </aside>
        <main className="w-full md:w-2/3 lg:w-3/4 h-screen overflow-y-auto bg-gray-800/50">
          <BookingGrid bookings={bookings} now={now} onExpire={handleExpire} onCancelBooking={removeBooking} />
          <HistoryReportDashboard history={history} />
        </main>
        {expiredBooking && (
          <ExpiredModal booking={expiredBooking} onComplete={handleCompleteSession} onExtend={handleExtendSession} />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
