// src/hooks/useFirebaseBookings.js
import { useEffect, useState, useCallback, useRef } from "react";
import { db, ref, onValue, set, push, remove, update } from "../firebaseConfig";

function parseBooking(id, raw) {
  const startTime = raw.startTime ? new Date(raw.startTime) : null;
  const endTime = raw.endTime ? new Date(raw.endTime) : null;
  return {
    id,
    ...raw,
    startTime,
    endTime,
    expired: !!raw.expired,
  };
}

export default function useFirebaseBookings(currentUser = null) {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const pollingRef = useRef(null);
  const lockRef = useRef({});

  // Listen realtime bookings node
  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const val = snap.val() || {};
      const arr = Object.entries(val).map(([id, raw]) => parseBooking(id, raw));
      setBookings(arr);
      setExpiredBookings(arr.filter((b) => !!b.expired || (b.endTime && b.endTime <= new Date())));
    });
    return () => unsub();
  }, []);

  // Poll to mark expired (server-side persistent mark)
  useEffect(() => {
    const tick = async () => {
      const now = Date.now();
      bookings.forEach(async (b) => {
        if (!b || !b.endTime) return;
        if ((b.endTime.getTime() <= now) && !b.expired && !lockRef.current[b.id]) {
          // mark expired in DB so it appears in expired tab
          lockRef.current[b.id] = true;
          try {
            await update(ref(db, `bookings/${b.id}`), { expired: true });
          } catch (e) {
            console.warn("Failed to mark expired:", b.id, e);
            lockRef.current[b.id] = false;
          }
        }
      });
    };
    pollingRef.current = setInterval(tick, 5_000);
    // run once immediately
    tick();
    return () => clearInterval(pollingRef.current);
  }, [bookings]);

  const addBooking = useCallback(
    async (payload) => {
      // use push to generate key, keep structure consistent with other code
      const node = push(ref(db, "bookings"));
      const id = node.key;
      const toSet = {
        ...payload,
        createdAt: new Date().toISOString(),
      };
      await set(ref(db, `bookings/${id}`), toSet);
      return id;
    },
    []
  );

  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    await remove(ref(db, `bookings/${id}`));
  }, []);

  const extendBooking = useCallback(async (booking, minutes = 60) => {
    if (!booking || !booking.id) return;
    const newEnd = new Date(booking.endTime.getTime() + minutes * 60 * 1000);
    await update(ref(db, `bookings/${booking.id}`), {
      endTime: newEnd.toISOString(),
      expired: false,
    });
  }, []);

  const completeBooking = useCallback(async (id, handlerName = currentUser || "unknown") => {
    if (!id) return;
    // move to history then remove booking
    try {
      const snapshot = (await onValue(ref(db, `bookings/${id}`), () => {})); // noop to ensure path exists (we'll use get by reading once)
    } catch (e) {
      // ignore - we will read below via onValue subscription in main hook; simpler approach: read current bookings state
    }
    // Read booking from current local state
    const b = bookings.find((x) => x.id === id);
    if (!b) {
      // fallback: just remove
      await remove(ref(db, `bookings/${id}`));
      return;
    }
    const historyNode = push(ref(db, "history"));
    const historyPayload = {
      ...b,
      startTime: b.startTime ? b.startTime.toISOString() : null,
      endTime: b.endTime ? b.endTime.toISOString() : null,
      finishedAt: new Date().toISOString(),
      handledBy: handlerName,
    };
    await set(ref(db, `history/${historyNode.key}`), historyPayload);
    await remove(ref(db, `bookings/${id}`));
  }, [bookings, currentUser]);

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
