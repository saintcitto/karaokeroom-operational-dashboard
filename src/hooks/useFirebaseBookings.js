// src/hooks/useFirebaseBookings.js
import { useEffect, useState, useCallback } from "react";
import { db, ref, set, onValue, remove, update, push } from "../firebaseConfig";
import { get } from "firebase/database";

/**
 * useFirebaseBookings
 * - subscriptions to /bookings (realtime)
 * - exposes addBooking, removeBooking, completeBooking
 *
 * currentUser: string (nama kasir) - optional, used for history.handledBy
 */
export default function useFirebaseBookings(currentUser = null) {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const data = snap.val() || {};
      const arr = Object.entries(data).map(([id, v]) => {
        // keep original fields; components assume startTime/endTime are ISO strings
        return { id, ...v };
      });
      setBookings(arr);

      // compute expired list (explicit expired flag OR endTime <= now)
      const now = new Date();
      const expired = arr.filter((b) => {
        if (b.expired === true) return true;
        if (!b.endTime) return false;
        try {
          const e = new Date(b.endTime);
          return e.getTime() <= now.getTime();
        } catch {
          return false;
        }
      });
      setExpiredBookings(expired);
    });

    return () => unsub();
  }, []);

  const addBooking = useCallback(async (payload) => {
    // payload expected to contain: room, startTime (ISO), endTime (ISO), durationMinutes, people, cashier, priceMeta...
    try {
      const bookingsRef = ref(db, "bookings");
      const newRef = push(bookingsRef);
      const nowISO = new Date().toISOString();
      await set(newRef, { ...payload, createdAt: nowISO, expired: !!payload.expired });
      return true;
    } catch (err) {
      console.error("addBooking error:", err);
      return false;
    }
  }, []);

  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    try {
      await remove(ref(db, "bookings/" + id));
      return true;
    } catch (err) {
      console.error("removeBooking error:", err);
      return false;
    }
  }, []);

  const completeBooking = useCallback(
    async (id) => {
      if (!id) return;
      const bRef = ref(db, "bookings/" + id);
      try {
        // read once
        const snap = await get(bRef);
        const booking = snap.exists() ? snap.val() : null;

        if (!booking) {
          // nothing to complete; ensure removal to clean state
          await remove(bRef);
          return { ok: false, reason: "not_found" };
        }

        // push to history
        const finishedAt = new Date().toISOString();
        const historyRef = push(ref(db, "history"));
        const historyEntry = {
          ...booking,
          id,
          finishedAt,
          handledBy: currentUser || booking.cashier || "Unknown",
        };
        await set(historyRef, historyEntry);

        // mark booking expired (so it appears in expired lists)
        await update(bRef, { expired: true });

        // do NOT remove booking here by default — we keep the record with expired flag
        return { ok: true };
      } catch (err) {
        console.error("completeBooking error:", err);
        return { ok: false, reason: err.message || "error" };
      }
    },
    [currentUser]
  );

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    completeBooking,
  };
}
