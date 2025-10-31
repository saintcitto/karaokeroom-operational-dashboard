// src/hooks/useFirebaseBookings.js
import { useEffect, useRef, useState } from "react";
import {
  db,
  ref,
  onValue,
  set,
  push,
  update,
  remove,
  serverTimestamp
} from "../firebaseConfig";

/**
 * useFirebaseBookings
 * - currentUser: string (nama kasir)
 *
 * Exposed:
 * bookings: array from /bookings (live)
 * history: array from /history (live)  -- kept for possible future UI
 * expiredBookings: bookings.filter(b => b.expired && !b.completedAt)
 * addBooking(data)
 * removeBooking(id)
 * extendBooking(id, extraMinutes)
 * completeBooking(id, completedBy)
 *
 * Implementation notes:
 * - markExpired() runs every 10s and will set { expired: true } on past bookings
 * - when completing, function pushes to /history (with createdAt/completedAt) then removes from /bookings
 * - we watch .info/connected for debug logs
 */

export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const listenersRef = useRef({}); // for cleanup
  const tickRef = useRef(null);

  // helper to transform snapshot val map to array with id
  const snapToArray = (snapVal) => {
    if (!snapVal) return [];
    return Object.entries(snapVal).map(([id, value]) => ({ id, ...value }));
  };

  useEffect(() => {
    // bookings listener
    const bookingsRef = ref(db, "bookings");
    listenersRef.current.bookings = onValue(bookingsRef, (snapshot) => {
      const val = snapshot.val();
      const arr = snapToArray(val);
      setBookings(arr);
    }, (err) => {
      console.error("[useFirebaseBookings] bookings onValue error:", err);
    });

    // history listener
    const historyRef = ref(db, "history");
    listenersRef.current.history = onValue(historyRef, (snapshot) => {
      const val = snapshot.val();
      const arr = snapToArray(val);
      setHistory(arr);
    }, (err) => {
      console.error("[useFirebaseBookings] history onValue error:", err);
    });

    // connection state (for debugging network issues)
    const connRef = ref(db, ".info/connected");
    listenersRef.current.conn = onValue(connRef, (snap) => {
      const connected = snap.val();
      console.log("[useFirebaseBookings] Realtime DB connected:", !!connected);
    });

    // start a tick to mark expired
    tickRef.current = setInterval(() => {
      try {
        markExpiredBookings();
      } catch (err) {
        console.error("[useFirebaseBookings] markExpiredBookings error:", err);
      }
    }, 10000); // every 10s

    return () => {
      // cleanup listeners
      try {
        if (listenersRef.current.bookings) listenersRef.current.bookings();
        if (listenersRef.current.history) listenersRef.current.history();
        if (listenersRef.current.conn) listenersRef.current.conn();
      } catch (e) {
        // no-op
      }
      if (tickRef.current) clearInterval(tickRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // markExpiredBookings: check each booking locally and update DB if past endTime & not expired
  const markExpiredBookings = async () => {
    if (!Array.isArray(bookings) || bookings.length === 0) return;
    const now = Date.now();
    for (const b of bookings) {
      if (!b || !b.endTime) continue;
      if (b.expired) continue; // already marked
      const end = new Date(b.endTime).getTime();
      if (end <= now) {
        // mark expired in DB
        try {
          const updateRef = ref(db, `bookings/${b.id}`);
          await update(updateRef, { expired: true });
          console.log(`[useFirebaseBookings] marked expired: ${b.id} (${b.room})`);
        } catch (err) {
          console.warn("[useFirebaseBookings] failed to set expired flag", b.id, err);
        }
      }
    }
  };

  // addBooking: expects {room, startTime (ISO), endTime (ISO), durationMinutes, people, cashier, priceMeta}
  const addBooking = async (data) => {
    const pushRef = ref(db, "bookings");
    const now = Date.now();
    const record = {
      ...data,
      createdAt: now,
      expired: false,
      cashier: data.cashier || "Tidak Diketahui",
    };
    try {
      const newRef = await push(pushRef, record);
      return newRef.key;
    } catch (err) {
      console.error("[useFirebaseBookings] addBooking failed", err);
      throw err;
    }
  };

  // removeBooking: immediate delete from bookings
  const removeBooking = async (id) => {
    if (!id) return;
    try {
      const r = ref(db, `bookings/${id}`);
      await remove(r);
      return true;
    } catch (err) {
      console.error("[useFirebaseBookings] removeBooking failed", err);
      throw err;
    }
  };

  // extendBooking: extend endTime by minutes, update priceMeta accordingly (caller may pass new priceMeta or we recompute simple)
  const extendBooking = async (id, extraMinutes = 30, newPriceMeta = null) => {
    if (!id) return;
    try {
      const b = bookings.find((x) => x.id === id);
      if (!b) throw new Error("booking not found");
      const currentEnd = new Date(b.endTime).getTime();
      const newEnd = new Date(currentEnd + extraMinutes * 60000).toISOString();
      const updates = { endTime: newEnd, expired: false };
      if (newPriceMeta) updates.priceMeta = newPriceMeta;
      const r = ref(db, `bookings/${id}`);
      await update(r, updates);
      return true;
    } catch (err) {
      console.error("[useFirebaseBookings] extendBooking failed", err);
      throw err;
    }
  };

  // completeBooking: push to history then remove booking. We'll set completedAt + completedBy.
  const completeBooking = async (id, completedBy = "") => {
    if (!id) return;
    try {
      const b = bookings.find((x) => x.id === id);
      if (!b) {
        // maybe it was already moved; return quietly
        console.warn("[useFirebaseBookings] completeBooking: booking not found locally", id);
        return;
      }
      const historyRef = ref(db, "history");
      const now = Date.now();
      const historyPayload = {
        ...b,
        originalId: b.id,
        completedAt: now,
        completedBy: completedBy || (currentUser || ""),
      };
      // push to history
      await push(historyRef, historyPayload);
      // then remove from bookings
      const r = ref(db, `bookings/${id}`);
      await remove(r);
      console.log(`[useFirebaseBookings] completed booking ${id} -> history`);
      return true;
    } catch (err) {
      console.error("[useFirebaseBookings] completeBooking failed", err);
      // best-effort: try to set completedAt on bookings so UI shows it's completed
      try {
        const r = ref(db, `bookings/${id}`);
        await update(r, { completedAt: Date.now(), completedBy: completedBy || currentUser || "" });
      } catch (e) {
        // ignore
      }
      throw err;
    }
  };

  // expiredBookings (not-yet-completed)
  const expiredBookings = bookings.filter((b) => b && b.expired && !b.completedAt);

  return {
    bookings,
    history,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
