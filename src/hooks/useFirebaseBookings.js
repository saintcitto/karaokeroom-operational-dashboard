import { useState, useEffect, useRef, useCallback } from "react";
import { db, ref, onValue, set, remove, update, push } from "../firebaseConfig";
import { calculateTotalPriceWithPromo } from "../utils/helpers";
import { PolySynth, Filter, LFO, Transport, start as ToneStart, context as ToneContext } from "tone";
import useAuditTrail from "./useAuditTrail";

export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const expireLock = useRef({});
  const alarmRef = useRef(null);
  const { logAction } = useAuditTrail(currentUser);

  // Realtime sync
  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const data = snap.val() || {};
      const parsed = Object.entries(data).map(([id, v]) => ({
        id,
        ...v,
        startTime: v.startTime ? new Date(v.startTime) : null,
        endTime: v.endTime ? new Date(v.endTime) : null,
      }));
      setBookings(parsed);
    });
    return () => unsub();
  }, []);

  // Cek expired setiap 10 detik
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const toExpire = bookings.filter(
        (b) => !b.expired && b.endTime && b.endTime <= now && !expireLock.current[b.id]
      );
      toExpire.forEach((b) => markExpired(b));
    }, 10000);
    return () => clearInterval(interval);
  }, [bookings]);

  const markExpired = useCallback(async (booking) => {
    if (!booking?.id || expireLock.current[booking.id]) return;
    expireLock.current[booking.id] = true;
    try {
      await update(ref(db, "bookings/" + booking.id), { expired: true });
      setExpiredBookings((prev) => {
        const exists = prev.find((b) => b.id === booking.id);
        if (exists) return prev;
        const updated = [...prev, { ...booking, expired: true }];
        if (updated.length && !alarmRef.current) startAlarm();
        return updated;
      });
      await logAction("EXPIRE_BOOKING", { room: booking.room });
    } catch (err) {
      console.warn("Gagal update expired:", err.message);
      expireLock.current[booking.id] = false;
    }
  }, [logAction]);

  // Tone.js alarm system
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

  useEffect(() => {
    if (expiredBookings.length > 0) startAlarm();
    else stopAlarm();
  }, [expiredBookings, startAlarm, stopAlarm]);

  // CRUD actions
  const addBooking = useCallback(async (booking) => {
    try {
      const { total, freeMinutes, promoNote } = calculateTotalPriceWithPromo(
        new Date(booking.startTime),
        booking.durationMinutes,
        booking.people
      );

      const newBooking = {
        ...booking,
        cashier: currentUser || "Tidak Diketahui",
        totalPrice: total,
        freeMinutes,
        promoNote,
        expired: false,
        startTime: booking.startTime instanceof Date ? booking.startTime.toISOString() : booking.startTime,
        endTime: booking.endTime instanceof Date ? booking.endTime.toISOString() : booking.endTime,
      };

      const newRef = push(ref(db, "bookings"));
      await set(newRef, newBooking);
      await logAction("ADD_BOOKING", { room: newBooking.room, duration: booking.durationMinutes });
    } catch (err) {
      console.error("Gagal addBooking:", err);
    }
  }, [currentUser, logAction]);

  const removeBooking = useCallback(async (id) => {
    try {
      await remove(ref(db, "bookings/" + id));
      setExpiredBookings((prev) => prev.filter((b) => b.id !== id));
      await logAction("REMOVE_BOOKING", { bookingId: id });
    } catch (err) {
      console.error("Gagal removeBooking:", err);
    }
  }, [logAction]);

  const extendBooking = useCallback(async (booking) => {
    if (!booking?.id) return;
    try {
      const start = new Date(booking.endTime);
      const end = new Date(start.getTime() + booking.durationMinutes * 60000);
      const updated = {
        ...booking,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        expired: false,
      };
      await set(ref(db, "bookings/" + booking.id), updated);
      setExpiredBookings((prev) => prev.filter((b) => b.id !== booking.id));
      await logAction("EXTEND_BOOKING", { room: booking.room, newEnd: end.toISOString() });
    } catch (err) {
      console.error("Gagal extendBooking:", err);
    }
  }, [logAction]);

  const completeBooking = useCallback(async (bookingId) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;
    try {
      const historyRef = push(ref(db, "history"));
      await set(historyRef, {
        ...booking,
        finishedAt: new Date().toISOString(),
        handledBy: currentUser,
      });
      await remove(ref(db, "bookings/" + bookingId));
      setExpiredBookings((prev) => prev.filter((b) => b.id !== bookingId));
      await logAction("COMPLETE_BOOKING", { room: booking.room });
    } catch (err) {
      console.error("Gagal completeBooking:", err);
    }
  }, [bookings, currentUser, logAction]);

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
