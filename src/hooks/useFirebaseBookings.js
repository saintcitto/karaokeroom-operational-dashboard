import { useEffect, useState, useCallback, useRef } from "react";
import { db, ref, onValue, push, set, remove, update } from "../firebaseConfig";

export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const expireLockRef = useRef({});

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snapshot) => {
      setIsLoading(false);
      const data = snapshot.val() || {};
      const arr = Object.entries(data).map(([id, v]) => {
        return {
          id,
          ...v,
          startTime: v.startTime ? new Date(v.startTime) : null,
          endTime: v.endTime ? new Date(v.endTime) : null,
        };
      });
      setBookings(arr);

      // set expired list
      const now = new Date();
      const expired = arr.filter((b) => b.endTime && b.endTime <= now && !b.expired);
      setExpiredBookings((prev) => {
        // merge unique
        const ids = new Set(prev.map((p) => p.id));
        const merged = [...prev];
        expired.forEach((e) => {
          if (!ids.has(e.id)) merged.push({ ...e, expired: true });
        });
        return merged;
      });
    });

    return () => unsub();
  }, []);

  const addBooking = useCallback(async (booking) => {
    if (!booking || !booking.room) throw new Error("Invalid booking");
    const node = push(ref(db, "bookings"));
    const id = node.key;
    await set(node, {
      ...booking,
      createdBy: booking.cashier || booking.createdBy || currentUser || "Unknown",
      expired: false,
    });
    return id;
  }, [currentUser]);

  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    await remove(ref(db, `bookings/${id}`));
    setExpiredBookings((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const extendBooking = useCallback(async (booking, extraMinutes = 60) => {
    if (!booking || !booking.id) return;
    const newEnd = new Date(booking.endTime.getTime() + extraMinutes * 60000);
    await update(ref(db, `bookings/${booking.id}`), {
      endTime: newEnd.toISOString(),
      expired: false,
    });
    setExpiredBookings((prev) => prev.filter((b) => b.id !== booking.id));
  }, []);

  const completeBooking = useCallback(async (bookingId) => {
    if (!bookingId) return;
    // move to history
    const snapshotRef = ref(db, `bookings/${bookingId}`);
    // read current booking then push to history
    // simplified: read via onValue once
    await onValue(snapshotRef, async (snap) => {
      const data = snap.val();
      if (!data) return;
      const histRef = push(ref(db, "history"));
      const finishedAt = new Date().toISOString();
      await set(histRef, { ...data, finishedAt });
      await remove(snapshotRef);
    }, { onlyOnce: true });
    setExpiredBookings((prev) => prev.filter((b) => b.id !== bookingId));
  }, []);

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
    isLoading,
  };
}
