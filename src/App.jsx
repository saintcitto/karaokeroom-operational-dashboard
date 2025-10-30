import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  PolySynth,
  Filter,
  LFO,
  Transport,
  start as ToneStart,
  context as ToneContext,
} from "tone";
import { formatTimeForInput } from "./utils/helpers";
import KTVErrorBoundary from "./components/KTVErrorBoundary";
import SidebarForm from "./components/SidebarForm";
import BookingGrid from "./components/BookingGrid";
import ExpiredModal from "./components/ExpiredModal";
import HistoryReportDashboard from "./components/HistoryReportDashboard";
import UserLogin from "./components/UserLogin";
import {
  db,
  ref,
  set,
  onValue,
  remove,
  update,
  push,
} from "./firebaseConfig";
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
  const [expiredBookings, setExpiredBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [formPrefill, setFormPrefill] = useState(null);
  const [currentUser, setCurrentUser] = useState(
    localStorage.getItem("currentUser") || ""
  );
  const [role, setRole] = useState(
    USER_ROLES[localStorage.getItem("currentUser")] || null
  );
  const [now, setNow] = useState(new Date());
  const alarmRef = useRef(null);
  const expireLockRef = useRef({});
  const isReady = useRef(false);

  /** Clock updater */
  useEffect(() => {
    if (!currentUser) return;
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, [currentUser]);

  /** Firebase bookings sync */
  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const val = snap.val();
      if (!val) {
        setBookings([]);
        return;
      }
      const parsed = Object.entries(val).map(([id, v]) => ({
        id,
        ...v,
        startTime: new Date(v.startTime),
        endTime: new Date(v.endTime),
      }));
      setBookings(parsed);
      isReady.current = true;
    });
    return () => unsub();
  }, []);

  /** History data for admin */
  useEffect(() => {
    if (role !== ROLES.ADMIN) return;
    const historyRef = ref(db, "history");
    const unsub = onValue(historyRef, (snap) => {
      const val = snap.val();
      if (!val) {
        setHistory([]);
        return;
      }
      const parsed = Object.entries(val).map(([id, v]) => ({ id, ...v }));
      setHistory(parsed);
    });
    return () => unsub();
  }, [role]);

  /** Auto-expire logic */
  useEffect(() => {
    if (!bookings.length) return;
    const expiredNow = bookings.filter(
      (b) => !b.expired && b.endTime <= now && !expireLockRef.current[b.id]
    );
    expiredNow.forEach((b) => handleExpire(b));
  }, [bookings, now]);

  /** Login handler */
  const handleLogin = async (user) => {
    localStorage.setItem("currentUser", user);
    setCurrentUser(user);
    setRole(USER_ROLES[user] || null);
    try {
      await ToneStart();
      await ToneContext.resume();
    } catch (err) {
      console.warn("Tone init failed:", err);
    }
  };

  /** Alarm handlers */
  const startAlarm = useCallback(async () => {
    try {
      await ToneStart();
      if (ToneContext.state !== "running") await ToneContext.resume();
      if (alarmRef.current) return;

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

  /** Add / Remove Booking */
  const addBooking = (booking) => {
    if (!booking?.id) return;
    set(ref(db, "bookings/" + booking.id), {
      ...booking,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
    });
  };

  const removeBooking = async (id) => {
    if (!id) return;
    try {
      await remove(ref(db, "bookings/" + id));
      delete expireLockRef.current[id];
      setExpiredBookings((prev) => prev.filter((b) => b.id !== id));
    } catch (e) {
      console.error("Remove booking error:", e);
    }
  };

  /** Expiration logic */
  const handleExpire = useCallback(
    (b) => {
      if (!b?.id || expireLockRef.current[b.id]) return;
      expireLockRef.current[b.id] = true;
      update(ref(db, "bookings/" + b.id), { expired: true })
        .then(() => {
          setExpiredBookings((prev) => {
            if (prev.find((x) => x.id === b.id)) return prev;
            const updated = [...prev, { ...b, expired: true }];
            if (updated.length && !alarmRef.current) startAlarm();
            return updated;
          });
        })
        .catch((err) => {
          console.warn("⚠️ Failed to expire booking:", b.room, err);
          expireLockRef.current[b.id] = false;
        });
    },
    [startAlarm]
  );

  /** Alarm toggle on expired changes */
  useEffect(() => {
    if (expiredBookings.length) startAlarm();
    else stopAlarm();
  }, [expiredBookings, startAlarm, stopAlarm]);

  /** Complete / Extend Session */
  const handleComplete = useCallback(
    async (id) => {
      const finished = bookings.find((b) => b.id === id);
      if (finished) {
        const histRef = push(ref(db, "history"));
        await set(histRef, {
          ...finished,
          finishedAt: new Date().toISOString(),
          handledBy: currentUser,
        });
      }
      await remove(ref(db, "bookings/" + id));
      setExpiredBookings((p) => p.filter((b) => b.id !== id));
      stopAlarm();
    },
    [bookings, currentUser, stopAlarm]
  );

  const handleExtend = useCallback(
    (booking) => {
      stopAlarm();
      setExpiredBookings((p) => p.filter((b) => b.id !== booking.id));
      setFormPrefill({
        room: booking.room,
        startTime: formatTimeForInput(booking.endTime),
      });
      removeBooking(booking.id);
    },
    [stopAlarm]
  );

  /** Auth for admin */
  useEffect(() => {
    if (currentUser === "Baya Ganteng") {
      const unsub = onAuthStateChanged(auth, (user) => {
        if (user) console.log("Admin auth active:", user.email);
      });
      return () => unsub();
    }
  }, [currentUser]);

  if (!currentUser) return <UserLogin onLogin={handleLogin} />;

  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const canViewHistory = role === ROLES.ADMIN;
  const canManage = [ROLES.ADMIN, ROLES.CASHIER, ROLES.STAFF].includes(role);

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

          {canManage && (
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

        <main className="flex-1 h-screen overflow-y-auto bg-gray-800/50">
          <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-gray-800/70 border-b border-gray-700 backdrop-blur-md">
            <h2 className="text-lg font-semibold text-white">
              {showHistory ? "📊 Laporan Harian" : "🎤 Pemesanan Aktif"}
            </h2>
            {showHistory ? (
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg text-sm"
              >
                ← Kembali ke Pemesanan
              </button>
            ) : (
              canViewHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="px-4 py-2 bg-gradient-to-r from-fuchsia-500 to-pink-600 text-white rounded-lg text-sm"
                >
                  📈 Lihat Laporan Harian
                </button>
              )
            )}
          </div>

          <div className="p-6">
            {showHistory && canViewHistory ? (
              <HistoryReportDashboard
                history={history}
                onClose={() => setShowHistory(false)}
              />
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
            onComplete={handleComplete}
            onExtend={handleExtend}
          />
        ))}
      </div>
    </KTVErrorBoundary>
  );
}
