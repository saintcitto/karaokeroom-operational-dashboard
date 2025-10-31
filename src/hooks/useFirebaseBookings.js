// src/hooks/useFirebaseBookings.js
import { useEffect, useState, useRef } from "react";
import {
  db,
  ref,
  onValue,
  push,
  remove,
  update,
  set,
  serverTimestamp,
} from "../firebaseConfig";

/**
 * useFirebaseBookings
 * - currentUser: string (nama kasir) — optional
 *
 * Exposed:
 * - bookings: array (live, sorted by startTime)
 * - expiredBookings: array (bookings flagged expired in DB OR whose endTime <= now and not moved to history)
 * - addBooking(data)
 * - removeBooking(id)
 * - extendBooking({ id, extraMinutes })  // OR pass full new endTime
 * - completeBooking(id, completedBy) -> moves booking -> /history and removes /bookings/{id}
 */
export default function useFirebaseBookings(currentUser = null) {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const bookingsRef = useRef(null);

  // Subscribe to bookings node
  useEffect(() => {
    const r = ref(db, "bookings");
    bookingsRef.current = r;
    const unsub = onValue(r, (snap) => {
      const val = snap.val();
      const list = [];
      if (val) {
        Object.entries(val).forEach(([key, v]) => {
          list.push({
            id: key,
            ...v,
          });
        });
      }
      // sort by startTime ascending
      list.sort((a, b) => {
        const A = a.startTime ? new Date(a.startTime).getTime() : 0;
        const B = b.startTime ? new Date(b.startTime).getTime() : 0;
        return A - B;
      });
      setBookings(list);
    });
    return () => unsub();
  }, []);

  // compute expiredBookings from bookings and DB's expired flag
  useEffect(() => {
    const now = Date.now();
    const expired = bookings.filter((b) => {
      if (!b || !b.endTime) return false;
      const end = new Date(b.endTime).getTime();
      // treat booking as expired if DB flag expired === true OR endTime passed
      const isFlag = !!b.expired;
      return isFlag || end <= now;
    });
    // keep only those still in bookings (not moved to history)
    setExpiredBookings(expired);
  }, [bookings]);

  // periodic scanner: mark expired=true in DB for bookings past endTime (to persist "Waktu Habis")
  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      if (!bookings || bookings.length === 0) return;
      bookings.forEach((b) => {
        if (!b || !b.endTime) return;
        const end = new Date(b.endTime).getTime();
        if (end <= now && !b.expired) {
          // mark expired in DB
          try {
            const updateRef = ref(db, `bookings/${b.id}`);
            update(updateRef, { expired: true });
          } catch (err) {
            // ignore (firestore permission issues may occur in prod)
            // console.warn("Failed to mark expired", err);
          }
        }
      });
    };
    const id = setInterval(tick, 10_000); // every 10s
    // initial run
    tick();
    return () => clearInterval(id);
  }, [bookings]);

  // Helper: calculate pricing meta - keep compatibility with utils.calculateTotalPriceWithPromo
  const addBooking = async (data = {}) => {
    // expected fields: room, startTime(ISO), endTime(ISO), durationMinutes, people, cashier, priceMeta
    const payload = {
      room: data.room || "Unknown",
      startTime: data.startTime || new Date().toISOString(),
      endTime: data.endTime || new Date().toISOString(),
      durationMinutes: Number(data.durationMinutes || 0),
      people: Number(data.people || 1),
      cashier: data.cashier || currentUser || "Tamu",
      priceMeta: data.priceMeta || {},
      createdAt: serverTimestamp(),
      expired: false,
    };
    const r = ref(db, "bookings");
    try {
      await push(r, payload);
      return true;
    } catch (err) {
      console.error("addBooking error", err);
      throw err;
    }
  };

  const removeBooking = async (id) => {
    if (!id) return;
    try {
      const r = ref(db, `bookings/${id}`);
      await remove(r);
      return true;
    } catch (err) {
      console.error("removeBooking error", err);
      throw err;
    }
  };

  const extendBooking = async ({ id, newEndTimeISO, extraMinutes = 0 }) => {
    if (!id) return;
    try {
      const bRef = ref(db, `bookings/${id}`);
      // compute if newEndTimeISO not provided
      if (!newEndTimeISO && extraMinutes > 0) {
        // read current booking from local state cache
        const existing = bookings.find((b) => b.id === id);
        if (!existing) throw new Error("Booking not found");
        const curEnd = new Date(existing.endTime).getTime();
        const newEnd = new Date(curEnd + extraMinutes * 60000).toISOString();
        newEndTimeISO = newEnd;
      }
      const updates = { endTime: newEndTimeISO, expired: false };
      await update(bRef, updates);
      return true;
    } catch (err) {
      console.error("extendBooking error", err);
      throw err;
    }
  };

  const completeBooking = async (id, completedBy = currentUser || "Tamu") => {
    if (!id) return;
    try {
      // fetch booking data from local state
      const booking = bookings.find((b) => b.id === id);
      if (!booking) {
        // fallback: attempt to move via DB read -> then delete
        // For simplicity, just remove if not in bookings snapshot
        const r = ref(db, `bookings/${id}`);
        await remove(r);
        return true;
      }
      // push to history
      const histRef = ref(db, "history");
      const histPayload = {
        ...booking,
        originalId: booking.id,
        completedBy,
        completedAt: serverTimestamp(),
      };
      // remove id from payload (history will have new key)
      delete histPayload.id;
      await push(histRef, histPayload);
      // then remove booking from bookings node
      const remRef = ref(db, `bookings/${booking.id}`);
      await remove(remRef);
      return true;
    } catch (err) {
      console.error("completeBooking error", err);
      throw err;
    }
  };

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
