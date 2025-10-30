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
import { auth } from "./firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";

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
  const [expiredBookings, setExpiredBookings] = useState([]);
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
    const unsub = onValue(bookingsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return setBookings([]);
      const parsed = Object.entries(data).map(([id, v]) => ({
        id,
        ...v,
        startTime: new Date(v.startTime),
        endTime: new Date(v.endTime),
      }));
      setBookings(parsed);
    });
    return () => unsub();
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
    const expiredNow = bookings.filter(
      (b) => !b.expired && b.endTime <= now && !expireLockRef.current[b.id]
    );
    expiredNow.forEach((booking) => handleExpire(booking));
  }, [bookings, now]);

  const handleLogin = async (user) => {
    localStorage.setItem("currentUser", user);
    setCurrentUser(user);
    setRole(USER_ROLES[user] || null);
    try {
      await ToneStart();
      await ToneContext.resume();
    } catch {}
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
        Transport.start("+0.1");
        alarmRef.current = { synth, filter, lfo };
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
      Transport.stop();
      Transport.cancel();
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
      setExpiredBookings((prev) => prev.filter((b) => b.id !== bookingId));
    } catch (err) {
      console.error("Failed to remove booking:", err);
    }
  };

  const handleExpire = useCallback(
    (booking) => {
      if (!booking?.id) return;
      if (expireLockRef.current[booking.id]) return;
      expireLockRef.current[booking.id] = true;
      update(ref(db, "bookings/" + booking.id), { expired: true })
        .then(() => {
          setExpiredBookings((prev) => {
            const exists = prev.find((b) => b.id === booking.id);
            if (exists) return prev;
            const updated = [...prev, { ...booking, expired: true }];
            if (updated.length > 0 && !alarmRef.current) startAlarm();
            return updated;
          });
        })
        .catch((err) => {
          console.warn("⚠️ Failed to mark expired:", booking.room, err.message);
          expireLockRef.current[booking.id] = false;
        });
    },
    [startAlarm]
  );

  useEffect(() => {
    if (expiredBookings.length > 0) {
      if (!alarmRef.current) startAlarm();
    } else {
      stopAlarm();
    }
  }, [expiredBookings, startAlarm, stopAlarm]);

  const handleCompleteSession = useCallback(
    async (bookingId) => {
      const finishedBooking = bookings.find((b) => b.id === bookingId);
      if (finishedBooking) {
        const historyRef = push(ref(db, "history"));
        await set(historyRef, {
          ...finishedBooking,
          finishedAt: new Date().toISOString(),
          handledBy: currentUser,
        });
      }
      await remove(ref(db, "bookings/" + bookingId));
      setExpiredBookings((prev) => prev.filter((b) => b.id !== bookingId));
      stopAlarm();
    },
    [bookings, currentUser, stopAlarm]
  );

  const handleExtendSession = useCallback(
    (booking) => {
      if (!booking) return;
      stopAlarm();
      setExpiredBookings((prev) => prev.filter((b) => b.id !== booking.id));
      setFormPrefill({
        room: booking.room,
        startTime: formatTimeForInput(booking.endTime),
      });
      removeBooking(booking.id);
    },
    [stopAlarm]
  );

  useEffect(() => {
    if (currentUser === "Baya Ganteng") {
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) console.log("Admin auth active:", firebaseUser.email);
      });
      return () => unsubscribe();
    }
  }, [currentUser]);

  if (!currentUser) return <UserLogin onLogin={handleLogin} />;

  const safeBookings = Array.isArray(bookings) ? bookings : [];
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
                stopAlarm();
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
                  onClick={() => setShowHistory(false)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm font-medium shadow-md transition-all"
                >
                  ← Kembali ke Pemesanan
                </button>
              ) : (
                canViewHistory && (
                  <button
                    onClick={() => setShowHistory(true)}
                    className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white rounded-lg text-sm font-medium shadow-md transition-all"
                  >
                    📈 Lihat Laporan Harian
                  </button>
                )
              )}
            </div>
          </div>

          <div className="transition-all duration-500 ease-in-out p-6">
            {showHistory && canViewHistory ? (
              <HistoryReportDashboard history={history} onClose={() => setShowHistory(false)} />
            ) : (
              <BookingGrid
                bookings={safeBookings}
                now={now}
                onExpire={handleExpire}
                onCancelBooking={removeBooking}
              />
            )}
          </div>
        </main>

        {expiredBookings.map((b) => (
          <ExpiredModal
            key={b.id}
            booking={b}
            onComplete={handleCompleteSession}
            onExtend={handleExtendSession}
          />
        ))}
      </div>
    </KTVErrorBoundary>
  );
}
