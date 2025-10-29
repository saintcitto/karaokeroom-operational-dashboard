import React, { useState, useEffect, useCallback, useRef } from "react";
import { Synth, Loop, Transport } from "tone";
import { formatTimeForInput } from "./utils/helpers";
import KTVErrorBoundary from "./components/KTVErrorBoundary";
import SidebarForm from "./components/SidebarForm";
import BookingGrid from "./components/BookingGrid";
import ExpiredModal from "./components/ExpiredModal";
import HistoryReportDashboard from "./components/HistoryReportDashboard";
import UserLogin from "./components/UserLogin";
import { db, ref, set, onValue, remove, update, push } from "./firebaseConfig";

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());
  const [expiredBooking, setExpiredBooking] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const alarmRef = useRef(null);

  const role = currentUser?.trim();
  const isAdmin = role === "Baya Ganteng";

  // ⏱ Update waktu setiap detik
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  // 🔁 Ambil data bookings real-time
  useEffect(() => {
    if (!currentUser) return;
    const bookingsRef = ref(db, "bookings");
    const unsubscribe = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.values(data).filter(Boolean);
      const parsed = arr.map((b) => ({
        ...b,
        startTime: new Date(b.startTime),
        endTime: new Date(b.endTime),
      }));
      setBookings(parsed);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // 📜 Ambil data history real-time
  useEffect(() => {
    const historyRef = ref(db, "history");
    const unsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.values(data).filter(Boolean);
      setHistory(arr);
    });
    return () => unsub();
  }, []);

  // 🔔 Alarm sistem
  const startAlarm = useCallback(() => {
    try {
      if (!alarmRef.current) {
        const synth = new Synth().toDestination();
        const loop = new Loop(
          (time) => synth.triggerAttackRelease("C5", "8n", time),
          "1.5s"
        ).start(0);
        alarmRef.current = loop;
      }
      if (Transport.state !== "started") Transport.start();
    } catch (e) {
      console.warn("Alarm error:", e);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    if (alarmRef.current) {
      alarmRef.current.stop();
      alarmRef.current.dispose();
      alarmRef.current = null;
    }
    if (Transport.state === "started") Transport.stop();
  }, []);

  // ➕ Tambah pemesanan baru
  const addBooking = (newBooking) => {
    if (!newBooking) return;
    const path = ref(db, "bookings/" + newBooking.id);
    set(path, {
      ...newBooking,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
    });
  };

  // ❌ Hapus booking aktif
  const removeBooking = (bookingId) => {
    if (!bookingId) return;
    remove(ref(db, "bookings/" + bookingId));
  };

  // ⏰ Tandai expired booking
  const handleExpire = useCallback((booking) => {
    if (!booking) return;
    update(ref(db, "bookings/" + booking.id), { expired: true });
    setExpiredBooking(booking);
  }, []);

  // ✅ Selesaikan sesi booking → pindahkan ke history
  const handleCompleteSession = useCallback(
    (bookingId) => {
      const finishedBooking = bookings.find((b) => b.id === bookingId);
      if (finishedBooking) {
        const historyRef = push(ref(db, "history"));
        set(historyRef, {
          ...finishedBooking,
          finishedAt: new Date().toISOString(),
          handledBy: currentUser,
          totalPrice: finishedBooking.totalPrice || 0,
          date: new Date().toISOString().slice(0, 10),
        });
      }
      stopAlarm();
      removeBooking(bookingId);
      setExpiredBooking(null);
    },
    [bookings, stopAlarm, currentUser]
  );

  // 🔁 Perpanjang sesi
  const handleExtendSession = useCallback(
    (booking) => {
      if (!booking) return;
      stopAlarm();
      setExpiredBooking(null);
      setFormPrefill({
        room: booking.room,
        startTime: formatTimeForInput(booking.endTime),
      });
      removeBooking(booking.id);
    },
    [stopAlarm]
  );

  // 🔐 Login handler
  if (!currentUser)
    return <UserLogin onLogin={(user) => setCurrentUser(user)} />;

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeHistory = Array.isArray(history) ? history : [];

  // 🧩 Layout utama
  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
        {/* Sidebar */}
        <aside className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-screen bg-gray-800 shadow-lg overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <span className="text-sm text-gray-300">Login sebagai:</span>
            <span className="font-semibold text-pink-400">{currentUser}</span>
            <button
              onClick={() => {
                localStorage.removeItem("currentUser");
                setCurrentUser("");
              }}
              className="text-xs text-red-400 hover:text-red-500 ml-2"
            >
              Logout
            </button>
          </div>

          <SidebarForm
            activeRoomNames={safeBookings.map((b) => b.room)}
            onAddBooking={addBooking}
            formPrefill={formPrefill}
            onClearPrefill={() => setFormPrefill(null)}
            onShowHistory={() => setShowHistory(true)}
            currentUser={currentUser}
          />
        </aside>

        {/* Main Content */}
        <main className="w-full md:w-2/3 lg:w-3/4 h-screen overflow-y-auto bg-gray-800/50">
          {/* Semua role bisa lihat BookingGrid */}
          <BookingGrid
            bookings={safeBookings}
            now={now}
            onExpire={handleExpire}
            onCancelBooking={removeBooking}
          />

          {/* Khusus Admin bisa buka Data Historis */}
          {isAdmin && showHistory && (
            <HistoryReportDashboard
              history={safeHistory}
              onClose={() => setShowHistory(false)}
            />
          )}
        </main>

        {/* Modal Booking Expired */}
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
