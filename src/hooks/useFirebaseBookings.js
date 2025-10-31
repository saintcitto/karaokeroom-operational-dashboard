// src/hooks/useFirebaseBookings.js
import { useEffect, useState, useCallback } from "react";
import { db, ref, onValue, set, remove, push, update } from "../firebaseConfig";

export default function useFirebaseBookings(currentUser) {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data).map(([id, v]) => ({ id, ...v }));
      setBookings(arr);
      setExpiredBookings(arr.filter(b => b.expired === true || (b.endTime && new Date(b.endTime) <= new Date())));
    });
    return () => unsub();
  }, []);

  const addBooking = useCallback(async (payload) => {
    const idRef = push(ref(db, "bookings"));
    await set(idRef, { ...payload, createdAt: new Date().toISOString(), expired: false });
  }, []);

  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    await remove(ref(db, "bookings/" + id));
  }, []);

  const completeBooking = useCallback(async (id) => {
    if (!id) return;
    const bRef = ref(db, "bookings/" + id);
    // read snapshot (simple approach)
    // mark expired and push to history
    try {
      const snapshot = await new Promise((res, rej) => {
        onValue(bRef, (s) => { res(s); }, { onlyOnce: true }, (e) => rej(e));
      });
      const booking = snapshot.val();
      if (!booking) {
        // nothing to do
        await remove(ref(db, "bookings/" + id)); // clean up
        return;
      }
      const finishedAt = new Date().toISOString();
      // push to history
      const historyRef = push(ref(db, "history"));
      await set(historyRef, {
        ...booking,
        id,
        finishedAt,
        handledBy: currentUser || booking.cashier || "Unknown"
      });
      // mark expired (or remove booking)
      await update(ref(db, "bookings/" + id), { expired: true });
      // optionally remove active booking so it disappears from active list:
      // await remove(ref(db, "bookings/" + id));
    } catch (err) {
      console.error("completeBooking failed:", err);
    }
  }, [currentUser]);

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    completeBooking,
  };
}
