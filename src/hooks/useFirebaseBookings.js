import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { db, ref, onValue, set, push, update, remove } from "../firebaseConfig";

export default function useFirebaseBookings(currentUser = "Tidak Diketahui") {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const bookedRef = useRef({});
  const expireLockRef = useRef({});
  const expiredCacheRef = useRef({}); // cache local expired booking
  const timerRef = useRef(null);

  const normalize = (dataObj) => {
    if (!dataObj) return [];
    return Object.entries(dataObj).map(([id, v]) => {
      const startTime = v.startTime ? new Date(v.startTime) : null;
      const endTime = v.endTime ? new Date(v.endTime) : null;
      return { id, ...v, startTime, endTime };
    });
  };

  // Listener realtime bookings
  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snap) => {
      const val = snap.val() || {};
      const arr = normalize(val).sort((a, b) => {
        const aS = a.startTime ? a.startTime.getTime() : 0;
        const bS = b.startTime ? b.startTime.getTime() : 0;
        return aS - bS;
      });

      bookedRef.current = arr.reduce((acc, b) => {
        acc[b.id] = b;
        return acc;
      }, {});

      // cache expired bookings
      arr.forEach((b) => {
        if (b.expired === true) expiredCacheRef.current[b.id] = b;
      });

      setBookings(arr);
      updateExpiredList();
    });
    return () => unsub();
  }, []);

  // Timer: auto mark expired
  useEffect(() => {
    function tick() {
      const now = new Date();
      const arr = Object.values(bookedRef.current);
      arr.forEach((b) => {
        if (!b || !b.endTime) return;
        if (b.expired) return;
        if (b.endTime.getTime() <= now.getTime()) {
          if (!expireLockRef.current[b.id]) {
            expireLockRef.current[b.id] = true;
            update(ref(db, "bookings/" + b.id), { expired: true }).then(() => {
              expiredCacheRef.current[b.id] = { ...b, expired: true };
              updateExpiredList();
            });
          }
        }
      });
    }
    timerRef.current = setInterval(tick, 5000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Update expiredBookings state
  const updateExpiredList = useCallback(() => {
    const all = Object.values(bookedRef.current);
    const localExpired = Object.values(expiredCacheRef.current);
    const now = new Date();

    const expiredList = all
      .filter((b) => {
        if (!b) return false;
        const end = b.endTime ? new Date(b.endTime) : null;
        if (!end) return false;
        return b.expired === true || end <= now;
      })
      .concat(localExpired)
      .reduce((acc, b) => {
        acc[b.id] = b;
        return acc;
      }, {});

    setExpiredBookings(Object.values(expiredList));
  }, []);

  // Booking operations
  const addBooking = useCallback(
    async (bookingData) => {
      const p = push(ref(db, "bookings"));
      await set(p, {
        ...bookingData,
        createdBy: currentUser || "Tidak Diketahui",
        createdAt: new Date().toISOString(),
        expired: false,
      });
      return p.key;
    },
    [currentUser]
  );

  const removeBooking = useCallback(async (bookingId) => {
    if (!bookingId) return;
    await remove(ref(db, "bookings/" + bookingId));
    delete expiredCacheRef.current[bookingId];
    updateExpiredList();
  }, []);

  const extendBooking = useCallback(async (bookingId, extraMinutes = 60) => {
    if (!bookingId) return;
    const b = bookedRef.current[bookingId];
    if (!b || !b.endTime) return;
    const newEnd = new Date(b.endTime.getTime() + extraMinutes * 60_000);
    await update(ref(db, "bookings/" + bookingId), { endTime: newEnd.toISOString(), expired: false });
    delete expiredCacheRef.current[bookingId];
    updateExpiredList();
  }, []);

  const completeBooking = useCallback(
    async (bookingId) => {
      if (!bookingId) return;
      const b = bookedRef.current[bookingId] || expiredCacheRef.current[bookingId];
      const historyRef = push(ref(db, "history"));
      const finishedAt = new Date().toISOString();
      if (b) {
        await set(historyRef, { ...b, finishedAt, movedBy: currentUser || "Tidak Diketahui" });
      } else {
        await set(historyRef, { id: bookingId, finishedAt, movedBy: currentUser || "Tidak Diketahui" });
      }
      await remove(ref(db, "bookings/" + bookingId));
      delete expiredCacheRef.current[bookingId];
      updateExpiredList();
    },
    [currentUser, updateExpiredList]
  );

  const sortedBookings = useMemo(() => {
    return (bookings || []).slice().sort((a, b) => {
      const aS = a.startTime ? a.startTime.getTime() : 0;
      const bS = b.startTime ? b.startTime.getTime() : 0;
      return aS - bS;
    });
  }, [bookings]);

  return {
    bookings: sortedBookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking,
  };
}
