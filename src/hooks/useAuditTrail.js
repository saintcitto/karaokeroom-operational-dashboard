import { useEffect, useState, useCallback } from "react";
import { db, ref, onValue, set, update, remove, push } from "../firebaseConfig";

export default function useFirebaseRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const roomsRef = ref(db, "rooms");
    const unsub = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, v]) => ({
        id,
        name: v.name,
        status: v.status || "available",
      }));
      setRooms(parsed);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const addRoom = useCallback(async (name) => {
    const roomsRef = ref(db, "rooms");
    const newRef = push(roomsRef);
    await set(newRef, { name, status: "available" });
  }, []);

  const updateRoomStatus = useCallback(async (id, status) => {
    await update(ref(db, "rooms/" + id), { status });
  }, []);

  const deleteRoom = useCallback(async (id) => {
    await remove(ref(db, "rooms/" + id));
  }, []);

  return {
    rooms,
    loading,
    addRoom,
    updateRoomStatus,
    deleteRoom,
  };
}
