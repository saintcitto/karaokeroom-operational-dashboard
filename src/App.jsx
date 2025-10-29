import React, { useState, useEffect, useCallback, useRef } from "react";
import { PolySynth, Filter, LFO, Transport, start as ToneStart, context as ToneContext } from "tone";
import { formatTimeForInput } from "./utils/helpers";
import KTVErrorBoundary from "./components/KTVErrorBoundary";
import SidebarForm from "./components/SidebarForm";
import BookingGrid from "./components/BookingGrid";
import ExpiredModal from "./components/ExpiredModal";
import HistoryReportDashboard from "./components/HistoryReportDashboard";
import UserLogin from "./components/UserLogin";
import { db, ref, set, onValue, remove, update, push } from "./firebaseConfig";

const ROLES = {
  ADMIN: "admin",
  CASHIER: "cashier",
  STAFF: "staff",
};

const USER_ROLES = {
  "Baya Ganteng": ROLES.ADMIN,
  Ayu: ROLES.CASHIER,
  Ridho: ROLES.CASHIER,
  Umi: ROLES.CASHIER,
  Faisal: ROLES.STAFF,
  Zahlul: ROLES.STAFF,
};

export default function App() {
  const [bookings, setBookings] = useState([]);
  const [now, setNow] = useState(new Date());
  const [expiredBooking, setExpiredBooking] = useState(null);
  const [formPrefill, setFormPrefill] = useState(null);
  const [currentUser, setCurrentUser] = useState(localStorage.getItem("currentUser") || "");
  const [role, setRole] = useState(USER_ROLES[localStorage.getItem("currentUser")] || null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const alarmRef = useRef(null);
  const expireLockRef = useRef({});

  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsubscribe = onValue(
      bookingsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (!data) return setBookings([]);
        const parsed = Object.entries(data)
          .map(([id, v]) => ({
            id,
            ...v,
            startTime: new Date(v.startTime),
            endTime: new Date(v.endTime),
          }))
          .filter((b) => b.startTime && b.endTime);
        setBookings(parsed);
      },
      () => setBookings([])
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (role !== ROLES.ADMIN) return;
    const historyRef = ref(db, "history");
    const unsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
      setHistory(arr);
    });
    return () => unsub();
  }, [role]);

  useEffect(() => {
    if (!bookings.length) return;
    const expiredNow = bookings.find(
      (b) =>
        !b.expired &&
        b.endTime instanceof Date &&
        b.endTime <= now &&
        !expireLockRef.current[b.id]
    );
    if (expiredNow) {
      expireLockRef.current[expiredNow.id] = true;
      handleExpire(expiredNow);
    }
  }, [bookings, now]);

  useEffect(() => {
    expireLockRef.current = {};
  }, [currentUser]);

  const handleLogin = async (user) => {
    try {
      await ToneStart();
      await ToneContext.resume();
    } catch (err) {
      console.warn("⚠️ Tone.js context resume failed:", err);
    }
    localStorage.setItem("currentUser", user);
    setCurrentUser(user);
    setRole(USER_ROLES[user] || null);
  };

  const startAlarm = useCallback(async () => {
    try {
      await ToneStart();
      if (ToneContext.state !== "running") await ToneContext.resume();
      if (!alarmRef.current) {
        const filter = new Filter(800, "lowpass").toDestination();
        const synth = new PolySynth().connect(filter);
        const lfo = new LFO("2n", 400, 1600).start();
        lfo.connect(filter.frequency);

        const playPattern = () => {
          const t = ToneContext.currentTime + 0.1;
          synth.triggerAttackRelease(["A5", "E6"], "8n", t);
          synth.triggerAttackRelease(["C6", "G5"], "8n", t + 0.4);
        };

        Transport.scheduleRepeat(playPattern, "1.2s", "+0.1");
        if (Transport.state !== "started") {
          Transport.start("+0.1");
        }
        alarmRef.current = { synth, filter, lfo };
        console.log("🚨 Alarm started!");
      }
    } catch (err) {
      console.error("Alarm start error:", err);
    }
  }, []);

  const stopAlarm = useCallback(() => {
    try {
      if (alarmRef.current) {
        alarmRef.current.lfo.stop();
        alarmRef.current.synth.dispose();
        alarmRef.current.filter.dispose();
        alarmRef.current = null;
      }
      if (Transport.state === "started") Transport.stop();
      Transport.cancel();
      console.log("🔇 Alarm stopped");
    } catch (err) {
      console.error("Alarm stop error:", err);
    }
  }, []);

  const addBooking = (newBooking) => {
    if (!newBooking?.id) return;
    const path = ref(db, "bookings/" + newBooking.id);
    set(path, {
      ...newBooking,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
    });
  };

  const removeBooking = async (bookingId) => {
    if (!bookingId) return;
    try {
      await remove(ref(db, "bookings/" + bookingId));
      delete expireLockRef.current[bookingId];
      if (expiredBooking?.id === bookingId) setExpiredBooking(null);
      console.log("✅ Booking removed from Firebase:", bookingId);
    } catch (err) {
      console.error("🔥 Failed to remove booking:", err);
      alert("Gagal menghapus data booking: " + err.message);
    }
  };

  const handleExpire = useCallback(
    (booking) => {
      if (!booking?.id) return;
      console.log("⏰ Booking expired:", booking.id);
      update(ref(db, "bookings/" + booking.id), { expired: true })
        .then(() => {
          setExpiredBooking({ ...booking, expired: true });
          startAlarm();
        })
        .catch((err) => {
          console.error("🔥 Failed to mark expired:", err);
          expireLockRef.current[booking.id] = false;
        });
    },
    [startAlarm]
  );

  const handleCompleteSession = useCallback(
    async (bookingId) => {
      console.log("🧹 handleCompleteSession triggered for:", bookingId);
      const finishedBooking = bookings.find((b) => b.id === bookingId);
      if (finishedBooking) {
        const historyRef = push(ref(db, "history"));
        await set(historyRef, {
          ...finishedBooking,
          finishedAt: new Date().toISOString(),
          handledBy: currentUser,
        });
      }
      stopAlarm();
      try {
        await remove(ref(db, "bookings/" + bookingId));
        console.log("✅ Booking removed from Firebase");
      } catch (err) {
        console.error("🔥 Error removing booking:", err);
        alert("Gagal menyelesaikan sesi: " + err.message);
      }
      delete expireLockRef.current[bookingId];
      setExpiredBooking(null);
    },
    [bookings, currentUser, stopAlarm]
  );

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
      delete expireLockRef.current[booking.id];
    },
    [stopAlarm]
  );

  if (!currentUser)
    return <UserLogin onLogin={handleLogin} footerName={"sweet cherry pie 🍰"} />;

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeHistory = Array.isArray(history) ? history : [];
  const canViewHistory = role === ROLES.ADMIN;
  const canManageBookings = [ROLES.ADMIN, ROLES.CASHIER, ROLES.STAFF].includes(role);

  return (
    <KTVErrorBoundary>
      <div className="flex flex-col md:flex-row h-screen bg-gray-900 text-white font-sans">
        <aside className="w-full md:w-1/3 lg:w-1/4 h-auto md:h-screen bg-gray-800 shadow-lg overflow-y-auto">
          <div className="flex items-center justify-between p-4 border-b border-gray-700">
            <span className="text-sm text-gray-300">Login sebagai:</span>
            <span className="font-semibold text-pink-400">{currentUser}</span>
            <button
              onClick={() => {
                localStorage.removeItem("currentUser");
                setCurrentUser("");
                setRole(null);
              }}
              className="text-xs text-red-400 hover:text-red-500 ml-2"
            >
              Logout
            </button>
          </div>
          {canManageBookings && (
            <SidebarForm
              activeRoomNames={safeBookings.map((b) => b.room)}
              onAddBooking={addBooking}
              formPrefill={formPrefill}
              onClearPrefill={() => setFormPrefill(null)}
              onShowHistory={() => setShowHistory(true)}
              currentUser={currentUser}
            />
          )}
        </aside>
        <main className="relative w-full md:w-2/3 lg:w-3/4 h-screen overflow-y-auto bg-gray-800/50 transition-all duration-300 ease-in-out">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-800/70 backdrop-blur-md border-b border-gray-700">
            <h2 className="text-lg font-semibold tracking-wide text-white">
              {showHistory ? "📊 Laporan Harian" : "🎤 Pemesanan Aktif"}
            </h2>
            <div className="flex items-center gap-3">
              {showHistory ? (
                <button
                  onClick={() => {
                    setShowHistory(false);
                    setFormPrefill(null);
                    setExpiredBooking(null);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  ← Kembali ke Pemesanan
                </button>
              ) : canViewHistory ? (
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 hover:from-fuchsia-600 hover:to-pink-700 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition-all duration-300"
                >
                  📈 Lihat Laporan Harian
                </button>
              ) : null}
            </div>
          </div>
          <div className="transition-all duration-500 ease-in-out p-6">
            {showHistory && canViewHistory ? (
              <HistoryReportDashboard
                history={safeHistory}
                onClose={() => setShowHistory(false)}
              />
            ) : (
              <BookingGrid
                bookings={safeBookings}
                now={now}
                onExpire={(b) => handleExpire(b)}
                onCancelBooking={(id) => id && removeBooking(id)}
              />
            )}
          </div>
        </main>
        {expiredBooking && (
          <ExpiredModal
            key={expiredBooking.id}
            booking={expiredBooking}
            onComplete={(id) => handleCompleteSession(id)}
            onExtend={(b) => handleExtendSession(b)}
          />
        )}
      </div>
    </KTVErrorBoundary>
  );
}
