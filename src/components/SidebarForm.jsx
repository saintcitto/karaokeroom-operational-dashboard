import React, { useEffect, useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir = "Tidak Diketahui", activeBookings = [] }) {
  const [room, setRoom] = useState("");
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [people, setPeople] = useState("");
  const [saving, setSaving] = useState(false);
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const rooms = ["KTV 1","KTV 2","KTV 3","KTV 4","KTV 5","KTV 8","KTV 9","KTV 10","KTV 11","KTV 12"];
  const usedRooms = Array.isArray(activeBookings) ? activeBookings.map((b) => b.room) : [];

  const valid =
    room &&
    (parseInt(hours || 0) > 0 || parseInt(minutes || 0) > 0) &&
    parseInt(people || 0) > 0 &&
    !usedRooms.includes(room);

  const handleNow = () => setTimeNow(new Date());

  const handleAdd = async () => {
    if (!valid) return;
    setSaving(true);

    const duration = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
    let bonus = 0;
    if (parseInt(hours) === 2 && !parseInt(minutes)) bonus = 30;
    if (parseInt(hours) === 3 && !parseInt(minutes)) bonus = 60;

    const total = duration + bonus;
    const start = new Date(timeNow);
    const end = new Date(start.getTime() + total * 60000);

    const hourDec = start.getHours() + start.getMinutes() / 60;
    const isDay = hourDec >= 10 && hourDec < 16.75;
    const rate = isDay ? 22500 : 30000;
    const totalPrice = Math.ceil(duration / 30) * rate;

    await push(ref(db, "bookings"), {
      room,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: duration,
      bonusMinutes: bonus,
      durationTotalMinutes: total,
      people: parseInt(people),
      cashier: kasir,
      totalPrice,
      status: "active",
      createdAt: serverTimestamp(),
    });

    setRoom("");
    setHours("");
    setMinutes("");
    setPeople("");
    setSaving(false);
  };

  return (
    <div className="flex flex-col gap-4 text-white">
      <h2 className="text-xl font-semibold tracking-tight">Buat Pemesanan Baru</h2>

      <div>
        <label className="text-sm text-gray-400">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl p-3 mt-1"
        >
          <option value="">-- Pilih Ruangan --</option>
          {rooms.map((r) => (
            <option key={r} value={r} disabled={usedRooms.includes(r)}>
              {usedRooms.includes(r) ? `${r} (Terpakai)` : r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-400">Jam Masuk</label>
        <div className="flex gap-2 mt-1">
          <input
            readOnly
            value={timeNow.toTimeString().slice(0, 5)}
            className="flex-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl p-3"
          />
          <button
            onClick={handleNow}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold"
          >
            Sekarang
          </button>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400">Durasi</label>
        <div className="flex gap-2 mt-1">
          <input
            type="number"
            placeholder="Jam"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-gray-300"
          />
          <input
            type="number"
            placeholder="Menit"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-800 rounded-xl p-3 text-gray-300"
          />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-400">Jumlah Orang</label>
        <input
          type="number"
          placeholder="Masukkan jumlah tamu"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-gray-300 mt-1"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={!valid || saving}
        className={`mt-2 py-3 rounded-xl font-semibold transition-all ${
          valid && !saving
            ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/30 shadow-md"
            : "bg-gray-700 text-gray-400 cursor-not-allowed"
        }`}
      >
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>
    </div>
  );
}
