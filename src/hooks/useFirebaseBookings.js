// src/hooks/useFirebaseBookings.js
import { useEffect, useState, useCallback, useRef } from 'react';
import { db } from '../firebaseConfig';
import { ref, onValue, push, update, remove, set } from 'firebase/database';

function safeParseDate(v) {
  try {
    return v ? new Date(v) : null;
  } catch {
    return null;
  }
}

export default function useFirebaseBookings(currentUser = null) {
  const [bookings, setBookings] = useState([]);
  const [history, setHistory] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const watchersRef = useRef({ bookings: null, history: null });
  const timerRef = useRef(null);

  const snapshotToArray = (snapVal) => {
    if (!snapVal) return [];
    return Object.entries(snapVal).map(([key, val]) => ({ id: key, ...val }));
  };

  // Listen bookings
  useEffect(() => {
    const bookingsRef = ref(db, 'bookings');
    const unsub = onValue(bookingsRef, (snap) => {
      const raw = snap.val();
      const arr = snapshotToArray(raw).map((b) => {
        // normalize dates
        const startTime = safeParseDate(b.startTime);
        const endTime = safeParseDate(b.endTime);
        return { ...b, startTime, endTime };
      });

      // expired list (flagged or endTime <= now)
      const now = new Date();
      const expired = arr.filter((b) => (b.expired === true) || (b.endTime && b.endTime.getTime() <= now.getTime()));
      setExpiredBookings(expired);
      setBookings(arr);
    });
    watchersRef.current.bookings = unsub;
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Listen history
  useEffect(() => {
    const historyRef = ref(db, 'history');
    const unsub = onValue(historyRef, (snap) => {
      const raw = snap.val();
      const arr = snapshotToArray(raw).map((h) => ({
        ...h,
        startTime: safeParseDate(h.startTime),
        endTime: safeParseDate(h.endTime),
        finishedAt: safeParseDate(h.finishedAt) || null
      }));
      // keep newest first
      arr.sort((a,b) => (b.finishedAt?.getTime() || 0) - (a.finishedAt?.getTime() || 0));
      setHistory(arr);
    });
    watchersRef.current.history = unsub;
    return () => {
      if (unsub) unsub();
    };
  }, []);

  // Periodic expired check: mark booking.expired = true if endTime passed
  useEffect(() => {
    const checkAndMark = async () => {
      try {
        const now = Date.now();
        // use current bookings state
        bookings.forEach(async (b) => {
          if (!b || !b.id || !b.endTime) return;
          const endMs = b.endTime.getTime();
          if (!b.expired && endMs <= now) {
            const bookingRef = ref(db, `bookings/${b.id}`);
            // set expired flag so UI / other clients can see
            await update(bookingRef, { expired: true });
          }
        });
      } catch (e) {
        console.error('Expired mark failed', e);
      }
    };

    // run every 30s
    timerRef.current = setInterval(checkAndMark, 30_000);
    // also run immediately once
    checkAndMark();

    return () => clearInterval(timerRef.current);
  }, [bookings]);

  const addBooking = useCallback(async (data) => {
    // data expected: { room, startTime (ISO), endTime (ISO), durationMinutes, people, cashier, priceMeta }
    const bookingsRef = ref(db, 'bookings');
    const payload = {
      ...data,
      createdAt: new Date().toISOString(),
    };
    try {
      const p = await push(bookingsRef, payload);
      return p.key;
    } catch (e) {
      console.error('addBooking failed', e);
      throw e;
    }
  }, []);

  const removeBooking = useCallback(async (id) => {
    if (!id) return;
    try {
      await remove(ref(db, `bookings/${id}`));
    } catch (e) {
      console.error('removeBooking failed', e);
      throw e;
    }
  }, []);

  const extendBooking = useCallback(async (bookingId, extraMinutes = 60) => {
    if (!bookingId) return;
    try {
      const bRef = ref(db, `bookings/${bookingId}`);
      // safe approach: fetch existing then update endTime
      // but since we don't want extra read, compute new endTime from local state
      const b = bookings.find((x) => x.id === bookingId);
      if (!b || !b.endTime) return;
      const newEnd = new Date(b.endTime.getTime() + extraMinutes * 60000);
      await update(bRef, { endTime: newEnd.toISOString(), expired: false });
    } catch (e) {
      console.error('extendBooking failed', e);
      throw e;
    }
  }, [bookings]);

  const completeBooking = useCallback(async (bookingId) => {
    if (!bookingId) return;
    try {
      // read booking from local state
      const b = bookings.find((x) => x.id === bookingId);
      if (!b) {
        // fallback: try to read from DB then continue
        console.warn('completeBooking: booking not found in memory', bookingId);
      }

      const toSave = {
        ...(b || {}),
        finishedAt: new Date().toISOString(),
        completedBy: currentUser || null
      };

      // push to history
      const histRef = ref(db, 'history');
      await push(histRef, toSave);

      // remove booking from bookings
      await remove(ref(db, `bookings/${bookingId}`));
    } catch (e) {
      console.error('completeBooking failed', e);
      throw e;
    }
  }, [bookings, currentUser]);

  return {
    bookings,
    expiredBookings,
    history,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
