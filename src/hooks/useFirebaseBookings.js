import { useEffect, useState, useRef, useCallback } from "react";
import { db, ref, onValue, push, set, remove, update, serverTimestamp } from "../firebaseConfig";

const BOOKINGS_PATH = "bookings";
const HISTORY_PATH = "history";

function applyPromoAndPricing(data, calculatePriceFn) {
  const durationMinutes = Number(data.durationMinutes || 0);
  const base = calculatePriceFn(new Date(data.startTime), durationMinutes, data.people || 1);
  const freeMinutes = base.freeMinutes || 0;
  const effectiveDurationMinutes = durationMinutes + freeMinutes;
  const start = new Date(data.startTime);
  const effectiveEnd = new Date(start.getTime() + effectiveDurationMinutes * 60000);
  return {
    ...data,
    durationMinutes,
    effectiveDurationMinutes,
    freeMinutes,
    priceMeta: base,
    startTime: start.toISOString(),
    endTime: effectiveEnd.toISOString(),
    createdAt: Date.now()
  };
}

export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const snapshotRef = useRef(null);
  const timerRef = useRef(null);

  const calculatePrice = useCallback((startTime, durationMinutes, people) => {
    const hour = startTime.getHours();
    const minute = startTime.getMinutes();
    const totalMenit = hour * 60 + minute;
    const pagiMulai = 10 * 60;
    const soreMulai = 16 * 60 + 45;
    const TARIF_PAGI = 45000;
    const TARIF_MALAM = 60000;
    const tarif = totalMenit >= pagiMulai && totalMenit <= soreMulai - 1 ? TARIF_PAGI : TARIF_MALAM;
    const durasiJam = durationMinutes / 60;
    let freeMinutes = 0;
    let bayarJam = durasiJam;
    let promoNote = "-";
    if (durationMinutes === 120) {
      freeMinutes = 30;
      bayarJam = 2;
      promoNote = "Gratis 30 menit";
    } else if (durationMinutes === 180) {
      freeMinutes = 60;
      bayarJam = 3;
      promoNote = "Gratis 1 jam";
    }
    const hargaWaktu = tarif * bayarJam;
    const biayaTambahan = people > 10 ? 5000 : 0;
    const total = hargaWaktu + biayaTambahan;
    return {
      tarif,
      durasiJam,
      freeMinutes,
      bayarJam,
      hargaWaktu,
      biayaTambahan,
      total,
      promoNote
    };
  }, []);

  useEffect(() => {
    const bookingsRef = ref(db, BOOKINGS_PATH);
    snapshotRef.current = onValue(bookingsRef, (snap) => {
      const value = snap.val();
      const list = [];
      const expiredList = [];
      if (value) {
        Object.keys(value).forEach((k) => {
          const item = { id: k, ...value[k] };
          const end = new Date(item.endTime);
          const now = new Date();
          const diffMs = end.getTime() - now.getTime();
          const diffMin = diffMs / 60000;
          if (item.expired || diffMin <= 0) {
            expiredList.push(item);
          } else {
            list.push(item);
          }
        });
      }
      setBookings(list.sort((a, b) => new Date(a.startTime) - new Date(b.startTime)));
      setExpiredBookings(expiredList.sort((a, b) => new Date(a.endTime) - new Date(b.endTime)));
    }, (err) => {
      console.error("Firebase onValue bookings error:", err);
    });

    return () => {
      if (snapshotRef.current) snapshotRef.current(); // off
      snapshotRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(async () => {
      try {
        const now = Date.now();
        const bookingsRef = ref(db, BOOKINGS_PATH);
        onValue(bookingsRef, (snap) => {
          const value = snap.val() || {};
          Object.keys(value).forEach((k) => {
            const b = value[k];
            if (!b) return;
            const end = new Date(b.endTime).getTime();
            if (end <= now && !b.expired) {
              update(ref(db, `${BOOKINGS_PATH}/${k}`), { expired: true }).catch((e) => console.error("mark expired failed", e));
            }
          });
        }, { onlyOnce: true });
      } catch (e) {
        console.error("timer check error", e);
      }
    }, 5_000);
    return () => clearInterval(timerRef.current);
  }, []);

  const addBooking = useCallback(async (data) => {
    try {
      const prepared = applyPromoAndPricing(data, calculatePrice);
      const p = push(ref(db, BOOKINGS_PATH));
      await set(p, prepared);
      return p.key;
    } catch (e) {
      console.error("addBooking error", e);
      throw e;
    }
  }, [calculatePrice]);

  const removeBooking = useCallback(async (id) => {
    try {
      await remove(ref(db, `${BOOKINGS_PATH}/${id}`));
      return true;
    } catch (e) {
      console.error("removeBooking error", e);
      throw e;
    }
  }, []);

  const extendBooking = useCallback(async (id, extraMinutes = 30) => {
    try {
      const bookingSnap = ref(db, `${BOOKINGS_PATH}/${id}`);
      onValue(bookingSnap, async (snap) => {
        const b = snap.val();
        if (!b) return;
        const oldEnd = new Date(b.endTime);
        const newEnd = new Date(oldEnd.getTime() + extraMinutes * 60000);
        await update(ref(db, `${BOOKINGS_PATH}/${id}`), {
          endTime: newEnd.toISOString(),
          effectiveDurationMinutes: Number(b.effectiveDurationMinutes || b.durationMinutes) + extraMinutes
        });
      }, { onlyOnce: true });
      return true;
    } catch (e) {
      console.error("extendBooking error", e);
      throw e;
    }
  }, []);

  const completeBooking = useCallback(async (id, completedBy = "") => {
    try {
      const bSnapRef = ref(db, `${BOOKINGS_PATH}/${id}`);
      onValue(bSnapRef, async (snap) => {
        const b = snap.val();
        if (!b) return;
        const histRef = push(ref(db, HISTORY_PATH));
        const historyEntry = {
          ...b,
          originalId: id,
          completedAt: Date.now(),
          completedBy: completedBy || "",
          expired: true
        };
        await set(histRef, historyEntry);
        await remove(bSnapRef);
      }, { onlyOnce: true });
      return true;
    } catch (e) {
      console.error("completeBooking error", e);
      throw e;
    }
  }, []);

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking
  };
}
