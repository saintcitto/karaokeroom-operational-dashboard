// src/hooks/useFirebaseBookings.js
import { useEffect, useState, useCallback } from "react";
import { db, ref, onValue, push, set, remove, update, serverTimestamp } from "../firebaseConfig";

/**
 * Hook central untuk membaca dan memanipulasi data booking + history di Realtime DB.
 *
 * API:
 *  - bookings: array booking aktif (id, room, startTime ISO, endTime ISO, durationMinutes, people, cashier, priceMeta, expired boolean)
 *  - expiredBookings: sublist dari bookings yang endTime <= now (belum dipindah ke history)
 *  - history: array history (opsional)
 *  - addBooking(data)
 *  - removeBooking(id)
 *  - extendBooking(booking, extraMinutes = 60)
 *  - completeBooking(id, closedBy) -> push ke /history then remove from /bookings
 */
export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // parse DB object -> array helper
  const snapshotToArray = (obj) => {
    if (!obj) return [];
    return Object.keys(obj).map((k) => ({ id: k, ...obj[k] }));
  };

  useEffect(() => {
    setLoading(true);
    const bookingsRef = ref(db, "bookings");
    const unsubB = onValue(bookingsRef, (snap) => {
      const val = snap.val();
      const arr = snapshotToArray(val).map((b) => {
        // normalize fields
        return {
          ...b,
          startTime: b.startTime ? new Date(b.startTime) : null,
          endTime: b.endTime ? new Date(b.endTime) : null,
          durationMinutes: b.durationMinutes != null ? Number(b.durationMinutes) : null,
          people: b.people != null ? Number(b.people) : 0,
          priceMeta: b.priceMeta || {},
          cashier: b.cashier || null,
          expired: !!b.expired
        };
      });
      setBookings(arr);
      setLoading(false);
    });

    const historyRef = ref(db, "history");
    const unsubH = onValue(historyRef, (snap) => {
      const val = snap.val();
      const arr = snapshotToArray(val).map((h) => ({
        ...h,
        startTime: h.startTime ? new Date(h.startTime) : null,
        endTime: h.endTime ? new Date(h.endTime) : null,
        finishedAt: h.finishedAt ? new Date(h.finishedAt) : null,
      }));
      // keep newest-first
      setHistory(arr.sort((a,b) => (b.finishedAt?.getTime() || 0) - (a.finishedAt?.getTime() || 0)));
    });

    return () => {
      unsubB();
      unsubH();
    };
  }, []);

  // compute expiredBookings (bookings whose endTime <= now and still present in bookings)
  const expiredBookings = bookings.filter((b) => {
    if (!b || !b.endTime) return false;
    const now = Date.now();
    return b.endTime.getTime() <= now;
  });

  // addBooking: push to /bookings with serverTimestamp meta
  const addBooking = useCallback(async (data) => {
    const node = ref(db, "bookings");
    const newRef = push(node);
    const payload = {
      room: data.room,
      startTime: data.startTime, // expecting ISO string
      endTime: data.endTime,
      durationMinutes: Number(data.durationMinutes || 0),
      people: Number(data.people || 0),
      cashier: data.cashier || currentUser || null,
      priceMeta: data.priceMeta || {},
      createdAt: serverTimestamp()
    };
    await set(newRef, payload);
    return newRef.key;
  }, [currentUser]);

  // removeBooking (cancel)
  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    await remove(ref(db, `bookings/${id}`));
  }, []);

  // extendBooking: adds minutes to endTime
  const extendBooking = useCallback(async (booking, extraMinutes = 60) => {
    if (!booking || !booking.id || !booking.endTime) return;
    const newEnd = new Date(booking.endTime.getTime() + extraMinutes * 60000);
    await update(ref(db, `bookings/${booking.id}`), {
      endTime: newEnd.toISOString(),
      // clear expired flag if any
      expired: false
    });
  }, []);

  // completeBooking: move to history then remove from bookings
  const completeBooking = useCallback(async (id, closedBy = "") => {
    if (!id) return;
    // read current booking snapshot once, then push to history
    const bookingRef = ref(db, `bookings/${id}`);
    // because we don't have get() helper imported, we push with optimistic minimal payload:
    // In client we should copy the last known bookings[] item to history.
    const b = bookings.find((x) => x.id === id);
    if (!b) {
      // fallback: just remove
      await remove(bookingRef);
      return;
    }

    const historyNode = ref(db, "history");
    const newRef = push(historyNode);
    const payload = {
      room: b.room,
      startTime: b.startTime ? b.startTime.toISOString() : null,
      endTime: b.endTime ? b.endTime.toISOString() : null,
      durationMinutes: b.durationMinutes || null,
      people: b.people || 0,
      cashier: b.cashier || null,
      priceMeta: b.priceMeta || {},
      finishedAt: new Date().toISOString(),
      closedBy: closedBy || b.cashier || null,
      createdAt: serverTimestamp()
    };

    await set(newRef, payload);
    // finally remove booking from active
    await remove(bookingRef);
  }, [bookings]);

  // convenience: mark booking expired flag in DB (optional)
  const markExpiredInDb = useCallback(async (id) => {
    if (!id) return;
    await update(ref(db, `bookings/${id}`), { expired: true });
  }, []);

  return {
    bookings,
    expiredBookings,
    history,
    loading,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
    markExpiredInDb
  };
}
