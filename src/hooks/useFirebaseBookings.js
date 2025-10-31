// src/hooks/useFirebaseBookings.js
import { useEffect, useRef, useState, useCallback } from "react";
import { db, ref, onValue, set, remove, update, push } from "../firebaseConfig";

export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const expireLockRef = useRef({}); // avoid double-mark
  const timerRef = useRef(null);

  // parse snapshot -> normalized booking objects
  const parseBookingsSnapshot = (dataObj) => {
    if (!dataObj) return [];
    return Object.entries(dataObj).map(([id, v]) => {
      const parsed = {
        id,
        room: v.room,
        startTime: v.startTime ? new Date(v.startTime) : null,
        endTime: v.endTime ? new Date(v.endTime) : null,
        durationMinutes: v.durationMinutes || 0,
        people: v.people || 0,
        cashier: v.cashier || v.handledBy || null,
        priceMeta: v.priceMeta || v.price || null,
        expired: !!v.expired,
      };
      return parsed;
    });
  };

  // subscribe to bookings in RTDB
  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const data = snap.val();
      const parsed = parseBookingsSnapshot(data);
      setBookings(parsed);
    });
    return () => unsub();
  }, []);

  // compute expiredBookings and optionally mark expired in DB
  useEffect(() => {
    // clear previous interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const checkLoop = () => {
      const now = Date.now();
      const expired = [];
      bookings.forEach((b) => {
        if (!b.endTime) return;
        const endMs = b.endTime.getTime();
        if (endMs <= now) {
          expired.push(b);
          // mark in DB if not already marked and not locked
          if (!b.expired && !expireLockRef.current[b.id]) {
            expireLockRef.current[b.id] = true;
            update(ref(db, "bookings/" + b.id), { expired: true })
              .catch((err) => {
                console.warn("Failed to mark expired:", b.id, err.message);
                expireLockRef.current[b.id] = false;
              });
          }
        }
      });
      setExpiredBookings(expired);
    };

    // first run + set interval every second
    checkLoop();
    timerRef.current = setInterval(checkLoop, 1000);
    return () => clearInterval(timerRef.current);
  }, [bookings]);

  // actions
  const addBooking = useCallback(async (booking) => {
    // booking expected to have room, startTime (ISO), endTime (ISO), durationMinutes, people, cashier, priceMeta
    const node = push(ref(db, "bookings"));
    const id = node.key;
    await set(node, { ...booking, id });
    return id;
  }, []);

  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    try {
      await remove(ref(db, "bookings/" + id));
      delete expireLockRef.current[id];
    } catch (e) {
      console.error("removeBooking failed:", e);
      throw e;
    }
  }, []);

  const extendBooking = useCallback(async (booking, extraMinutes = 60) => {
    if (!booking || !booking.id) return;
    const currentEnd = booking.endTime ? booking.endTime.getTime() : Date.now();
    const newEnd = new Date(currentEnd + extraMinutes * 60_000);
    await update(ref(db, "bookings/" + booking.id), { endTime: newEnd.toISOString(), expired: false });
    delete expireLockRef.current[booking.id];
  }, []);

  const completeBooking = useCallback(async (id) => {
    if (!id) return;
    // move to history then remove from bookings
    try {
      const historyRef = push(ref(db, "history"));
      // read current booking snapshot is not included here - we assume front-end has booking details
      // but to be safe, try to read once from DB then set history then remove booking
      const bRef = ref(db, "bookings/" + id);
      // get value once
      // NOTE: simple approach - fetch via onValue once (subscribe/unsub)
      let val;
      await new Promise((res, rej) => {
        const off = onValue(bRef, (s) => {
          val = s.val();
          off();
          res();
        }, (err) => rej(err), { onlyOnce: true });
      });
      if (val) {
        await set(historyRef, { ...val, finishedAt: new Date().toISOString(), handledBy: val.cashier || currentUser || null });
      }
      await remove(bRef);
      delete expireLockRef.current[id];
    } catch (e) {
      console.error("completeBooking failed:", e);
      throw e;
    }
  }, [currentUser]);

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
