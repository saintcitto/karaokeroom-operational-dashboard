import React, { useEffect, useState } from "react";
import { ref, push, serverTimestamp, onValue, off } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir = "Tidak Diketahui" }) {
  const [room, setRoom] = useState("");
  const [timeStr, setTimeStr] = useState(() => {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
  });
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [people, setPeople] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);

  useEffect(() => {
    const rmRef = ref(db, "bookings");
    const handleValue = (snap) => {
      const data = snap.val() || {};
      const active = Object.values(data)
        .filter((b) => b && b.status === "active")
        .map((b) => b.room);
      setActiveRooms(active);
    };
    onValue(rmRef, handleValue);
    return () => off(rmRef, "value", handleValue);
  }, []);

  const parseTimeToDate = (timeString) => {
    const [h, m] = timeString.split(":").map(Number);
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
  };

  const isDayRate = (date) => {
    const hour = date.getHours() + date.getMinutes() / 60;
    return hour >= 10 && hour < 16.75;
  };

  const calculatePrice = (start, duration, bonus) => {
    const total = duration + bonus;
    const rate = isDayRate(start) ? 22500 : 30000;
    return Math.round((total / 30) * rate);
  };

  const handleAddBooking = async () => {
    if (!room || (!hours && !minutes) || !people) return;
    setSaving(true);
    try {
      const start = parseTimeToDate(timeStr);
      const duration = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
      let bonus = 0;
      if (duration === 120) bonus = 30;
      if (duration === 180) bonus = 60;

      const end = new Date(start.getTime() + (duration + bonus) * 60000);
      const totalPrice = calculatePrice(start, duration, bonus);

      await push(ref(db, "bookings"), {
        room,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: duration + bonus,
        baseDuration: duration,
        bonusMinutes: bonus,
        people: parseInt(people, 10),
        cashier: kasir,
        totalPrice,
        pricePer30Min: isDayRate(start) ? 22500 : 30000,
        status: "active",
        createdAt: serverTimestamp(),
      });

      setRoom("");
      setHours("");
      setMinutes("");
      setPeople("");
    } finally {
      setSaving(false);
    }
  };

  const rooms = ["KTV 1", "KTV 2", "KTV 3", "KTV 4", "KTV 5", "KTV 8", "KTV 9", "KTV 10", "KTV 11", "KTV 12"];

  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-between bg-gray-900 p-6 rounded-2xl text-white shadow-xl fixed right-0 top-0 md:static md:rounded-none md:shadow-none">
      <div>
        <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

        <label className="block text-sm mb-2">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="">-- Pilih Ruangan --</option>
          {rooms.map((r) => (
            <option key={r} value={r} disabled={activeRooms.includes(r)}>
              {r} {activeRooms.includes(r) ? "(Terpakai)" : ""}
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
            onClick={() => {
              const now = new Date();
              setTimeStr(now.toTimeString().slice(0, 5));
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
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
          onClick={handleAddBooking}
          disabled={saving}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            saving ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-400 border-t border-gray-800 pt-4 leading-relaxed">
        <div className="text-gray-300 mb-2">Siang (10.00–16.44): Rp22.500 / 30 menit</div>
        <div className="text-gray-300">Malam (16.45–00.00): Rp30.000 / 30 menit</div>
      </div>
    </aside>
  );
}
