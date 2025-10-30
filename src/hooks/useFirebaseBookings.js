import { useEffect, useState, useRef, useCallback } from "react";
import { db, ref, set, onValue, remove, update, push } from "../firebaseConfig";
import { PolySynth, Filter, LFO, Transport, start as ToneStart, context as ToneContext } from "tone";
import { formatTimeForInput } from "../utils/helpers";

/**
 * Custom Hook: useFirebaseBookings
 * Menangani seluruh logika booking KTV secara real-time
 */
export default function useFirebaseBookings() {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(new Date());
  const alarmRef = useRef(null);
  const expireLockRef = useRef({});

  // -------------------------------
  //  🔁 Realtime listener bookings
  // -------------------------------
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

  // -------------------------------
  //  📅 Realtime listener history
  // -------------------------------
  useEffect(() => {
    const historyRef = ref(db, "history");
    const unsub = onValue(historyRef, (snapshot) => {
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
      setHistory(arr);
    });
    return () => unsub();
  }, []);

  // -------------------------------
  //  ⏰ Realtime jam & auto-expire
  // -------------------------------
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bookings.length) return;
    const expiredNow = bookings.filter(
      (b) => !b.expired && b.endTime <= now && !expireLockRef.current[b.id]
    );
    expiredNow.forEach((booking) => handleExpire(booking));
  }, [bookings, now]);

  // -------------------------------
  //  🔔 Tone.js Alarm Control
  // -------------------------------
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

  // -------------------------------
  //  🔧 Booking CRUD Operations
  // -------------------------------
  const addBooking = async (newBooking) => {
    if (!newBooking?.id && !newBooking?.room) return;
    const id = newBooking.id || Date.now().toString();
    const path = ref(db, "bookings/" + id);
    await set(path, {
      ...newBooking,
      id,
      startTime: newBooking.startTime.toISOString(),
      endTime: newBooking.endTime.toISOString(),
      expired: false,
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

  const extendBooking = useCallback(async (booking, extraMinutes = 60) => {
    if (!booking?.id) return;
    const newEndTime = new Date(booking.endTime.getTime() + extraMinutes * 60000);
    await update(ref(db, "bookings/" + booking.id), { endTime: newEndTime.toISOString(), expired: false });
    stopAlarm();
    setExpiredBookings((prev) => prev.filter((b) => b.id !== booking.id));
  }, [stopAlarm]);

  const completeBooking = useCallback(async (bookingId, handledBy = "Unknown") => {
    const finishedBooking = bookings.find((b) => b.id === bookingId);
    if (finishedBooking) {
      const historyRef = push(ref(db, "history"));
      await set(historyRef, {
        ...finishedBooking,
        finishedAt: new Date().toISOString(),
        handledBy,
      });
    }
    await remove(ref(db, "bookings/" + bookingId));
    setExpiredBookings((prev) => prev.filter((b) => b.id !== bookingId));
    stopAlarm();
  }, [bookings, stopAlarm]);

  // -------------------------------
  //  🔁 Alarm Sync dengan Expired List
  // -------------------------------
  useEffect(() => {
    if (expiredBookings.length > 0) startAlarm();
    else stopAlarm();
  }, [expiredBookings, startAlarm, stopAlarm]);

  // -------------------------------
  //  📦 Return semua state & fungsi
  // -------------------------------
  return {
    bookings,
    expiredBookings,
    history,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
    startAlarm,
    stopAlarm,
  };
}
