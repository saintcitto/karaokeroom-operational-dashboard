import { useEffect, useState, useRef } from "react";
import { db, ref, onValue, push, set, update, remove, serverTimestamp } from "../firebaseConfig";

export default function useFirebaseBookings(currentUser = "") {
  const [bookings, setBookings] = useState([]);
  const [expiredBookings, setExpiredBookings] = useState([]);
  const bookingsRef = useRef(null);

  useEffect(() => {
    const r = ref(db, "bookings");
    bookingsRef.current = r;
    const unsub = onValue(r, (snap) => {
      const val = snap.val() || {};
      const list = Object.keys(val).map((k) => {
        const b = val[k] || {};
        return { id: k, ...b };
      });
      const now = Date.now();
      const active = [];
      const expired = [];
      list.forEach((b) => {
        const end = b.endTime ? new Date(b.endTime).getTime() : 0;
        const isExpiredFlag = !!b.expired || end <= now;
        if (isExpiredFlag) {
          expired.push({ ...b, id: b.id, expired: true });
        } else {
          active.push({ ...b, id: b.id, expired: false });
        }
      });
      active.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
      expired.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setBookings(active);
      setExpiredBookings(expired);
    });
    return () => unsub();
  }, []);

  async function addBooking(data) {
    const node = ref(db, "bookings");
    const payload = {
      room: data.room || "Unknown",
      startTime: data.startTime,
      endTime: data.endTime,
      durationMinutes: data.durationMinutes,
      people: data.people || 1,
      createdAt: serverTimestamp(),
      cashier: data.cashier || "Tidak Diketahui",
      priceMeta: data.priceMeta || {},
      expired: false,
      promoNote: data.promoNote || "-"
    };
    const p = push(node);
    await set(p, payload);
    return p.key;
  }

  async function removeBooking(id) {
    if (!id) return;
    const r = ref(db, `bookings/${id}`);
    await remove(r);
  }

  async function extendBooking(booking, extraMinutes = 30) {
    if (!booking || !booking.id) return;
    const currentEnd = booking.endTime ? new Date(booking.endTime).getTime() : Date.now();
    const newEnd = new Date(currentEnd + extraMinutes * 60000).toISOString();
    const r = ref(db, `bookings/${booking.id}`);
    await update(r, {
      endTime: newEnd,
      durationMinutes: (booking.durationMinutes || 0) + extraMinutes
    });
  }

  async function completeBooking(id, completedBy = "") {
    if (!id) return;
    const r = ref(db, `bookings/${id}`);
    const snapshot = await new Promise((res) => {
      onValue(r, (s) => {
        res(s);
      }, { onlyOnce: true });
    });
    const data = snapshot.val();
    if (!data) {
      await remove(r);
      return;
    }
    const historyNode = ref(db, "history");
    const hRef = push(historyNode);
    const payload = {
      ...data,
      originalId: id,
      completedAt: serverTimestamp(),
      completedBy: completedBy || ""
    };
    await set(hRef, payload);
    await remove(r);
  }

  return {
    bookings,
    expiredBookings,
    addBooking,
    removeBooking,
    extendBooking,
    completeBooking
  };
}
