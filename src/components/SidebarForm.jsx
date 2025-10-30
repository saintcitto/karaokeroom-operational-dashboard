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
    const interval = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const allRooms = ["KTV 1", "KTV 2", "KTV 3", "KTV 4", "KTV 5", "KTV 8", "KTV 9", "KTV 10", "KTV 11", "KTV 12"];
  const usedRooms = Array.isArray(activeBookings) ? activeBookings.map((b) => b.room) : [];

  const handleNowClick = () => setTimeNow(new Date());

  const handleAdd = async () => {
    if (!room || (!hours && !minutes) || !people) return;
    if (usedRooms.includes(room)) return;

    setSaving(true);

    const duration = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
    let bonus = 0;
    if (parseInt(hours) === 2 && !parseInt(minutes)) bonus = 30;
    if (parseInt(hours) === 3 && !parseInt(minutes)) bonus = 60;

    const totalDuration = duration + bonus;
    const startTime = new Date(timeNow);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);

    const hourDec = startTime.getHours() + startTime.getMinutes() / 60;
    const isDay = hourDec >= 10 && hourDec < 16.75;
    const ratePer30 = isDay ? 22500 : 30000;
    const ratePerHour = ratePer30 * 2;
    const fullHours = Math.floor(duration / 60);
    const extraMinutes = duration % 60;
    const extraCharge = extraMinutes > 0 ? (extraMinutes / 30) * ratePer30 : 0;
    const totalPrice = fullHours * ratePerHour + extraCharge;

    await push(ref(db, "bookings"), {
      room,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationMinutes: duration,
      bonusMinutes: bonus,
      durationTotalMinutes: totalDuration,
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
    <div className="bg-[#0F1117] rounded-3xl p-6 shadow-xl text-white flex flex-col gap-4 transition-all duration-500">
      <h2 className="text-2xl font-semibold mb-2">Buat Pemesanan</h2>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 text-white rounded-xl p-3 focus:ring-2 focus:ring-pink-500 outline-none"
        >
          <option value="">-- Pilih Ruangan --</option>
          {allRooms.map((r) => (
            <option key={r} value={r} disabled={usedRooms.includes(r)}>
              {usedRooms.includes(r) ? `${r} (Terpakai)` : r}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Jam Masuk</label>
        <div className="flex gap-2">
          <input
            readOnly
            value={timeNow.toTimeString().slice(0, 5)}
            className="flex-1 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl p-3"
          />
          <button
            onClick={handleNowClick}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-sm font-semibold rounded-xl transition-all"
          >
            Sekarang
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-1">Durasi</label>
        <div className="flex gap-2">
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
        <label className="block text-sm text-gray-400 mb-1">Jumlah Orang</label>
        <input
          type="number"
          placeholder="Masukkan jumlah tamu"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl p-3 text-gray-300"
        />
      </div>

      <button
        disabled={saving || !room || (!hours && !minutes) || !people || usedRooms.includes(room)}
        onClick={handleAdd}
        className={`mt-2 py-3 font-semibold rounded-2xl transition-all ${
          saving || usedRooms.includes(room)
            ? "bg-gray-700 text-gray-400 cursor-not-allowed"
            : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/30"
        }`}
      >
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>
    </div>
  );
}
