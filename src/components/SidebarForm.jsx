import React, { useEffect, useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir = "Tidak Diketahui" }) {
  const [room, setRoom] = useState("");
  const [timeStr, setTimeStr] = useState(() => {
    const t = new Date();
    return t.toTimeString().slice(0, 5);
  });
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [people, setPeople] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);

  useEffect(() => {
    const rmRef = ref(db, "bookings");
    const onValue = (snap) => {
      const obj = snap.val() || {};
      const arr = Object.values(obj).filter((b) => b && b.status === "active");
      const rooms = arr.map((b) => b.room);
      setActiveRooms(rooms);
    };
    rmRef.on("value", onValue);
    return () => rmRef.off("value", onValue);
  }, []);

  const parseTimeToDate = (timeString) => {
    const now = new Date();
    const [hh, mm] = timeString.split(":").map((s) => parseInt(s, 10));
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm);
    return d;
  };

  const isDayRate = (date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const decimal = h + m / 60;
    return decimal >= 10 && decimal < 16.75;
  };

  const calculatePrice = (startDate, durationMinutes, bonusMinutes) => {
    const totalMinutes = durationMinutes + (bonusMinutes || 0);
    const day = isDayRate(startDate);
    const ratePer30 = day ? 22500 : 30000;
    const price = (totalMinutes / 30) * ratePer30;
    return Math.round(price);
  };

  const handleNow = () => {
    const now = new Date();
    setTimeStr(now.toTimeString().slice(0, 5));
  };

  const rooms = [
    "KTV 1",
    "KTV 2",
    "KTV 3",
    "KTV 4",
    "KTV 5",
    "KTV 8",
    "KTV 9",
    "KTV 10",
    "KTV 11",
    "KTV 12",
  ];

  const handleAddBooking = async () => {
    if (saving) return;
    if (!room || (!hours && !minutes) || !people) return;
    setSaving(true);
    try {
      const start = parseTimeToDate(timeStr);
      const duration = parseInt(hours || 0, 10) * 60 + parseInt(minutes || 0, 10);
      let bonus = 0;
      if (parseInt(hours || 0, 10) === 2 && parseInt(minutes || 0, 10) === 0) bonus = 30;
      if (parseInt(hours || 0, 10) === 3 && parseInt(minutes || 0, 10) === 0) bonus = 60;
      const end = new Date(start.getTime() + (duration + bonus) * 60000);
      const totalPrice = calculatePrice(start, duration, bonus);

      const newBooking = {
        room,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: duration + bonus,
        baseDuration: duration,
        bonusMinutes: bonus,
        people: parseInt(people, 10),
        cashier: kasir || "Tidak Diketahui",
        pricePer30Min: isDayRate(start) ? 22500 : 30000,
        totalPrice,
        status: "active",
        createdAt: serverTimestamp(),
      };

      await push(ref(db, "bookings"), newBooking);

      setRoom("");
      setHours("");
      setMinutes("");
      setPeople("");
      handleNow();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-full md:w-80 lg:w-72 bg-gray-900 p-6 rounded-2xl text-white shadow-xl sticky top-16">
      <p className="text-sm text-pink-400 font-semibold mb-2">Login sebagai: {kasir || "Tidak Diketahui"}</p>
      <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

      <label className="block text-sm mb-2">Pilih Ruangan</label>
      <select
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500"
      >
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} value={r} disabled={activeRooms.includes(r)}>
            {r}
            {activeRooms.includes(r) ? " (Terpakai)" : ""}
          </option>
        ))}
      </select>

      <label className="block text-sm mb-2">Jam Masuk</label>
      <div className="flex gap-3 mb-4">
        <input
          type="time"
          value={timeStr}
          onChange={(e) => setTimeStr(e.target.value)}
          className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg"
        />
        <button
          onClick={handleNow}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700"
        >
          Sekarang
        </button>
      </div>

      <label className="block text-sm mb-2">Durasi</label>
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          min="0"
          placeholder="Jam"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg"
        />
        <input
          type="number"
          min="0"
          placeholder="Menit"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg"
        />
      </div>

      <label className="block text-sm mb-2">Jumlah Orang</label>
      <input
        type="number"
        min="1"
        placeholder="Masukkan jumlah tamu"
        value={people}
        onChange={(e) => setPeople(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
      />

      <button
        disabled={saving || !room || (!hours && !minutes) || !people}
        onClick={handleAddBooking}
        className={`w-full py-3 rounded-lg font-semibold transition duration-200 ${
          saving || !room || (!hours && !minutes) || !people
            ? "bg-gray-700 text-gray-300 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>

      <div className="mt-6 text-xs text-gray-400 border-t border-gray-800 pt-4 leading-relaxed">
        <div className="text-gray-300 mb-2">Siang (10.00–16.44): Rp22.500 / 30 menit</div>
        <div className="text-gray-300">Malam (16.45–00.00): Rp30.000 / 30 menit</div>
      </div>
    </aside>
  );
}
