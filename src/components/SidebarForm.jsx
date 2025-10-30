import React, { useState, useEffect } from "react";
import { ref, push, serverTimestamp, get } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir, activeBookings }) {
  const [room, setRoom] = useState("");
  const [jam, setJam] = useState("");
  const [menit, setMenit] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [timeNow, setTimeNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleNow = () => setTimeNow(new Date());

  const handleAddBooking = async () => {
    if (!room || (!jam && !menit) || !jumlahOrang) return;
    setIsSaving(true);

    const start = timeNow;
    const totalMinutes = parseInt(jam || 0) * 60 + parseInt(menit || 0);
    const hour = start.getHours() + start.getMinutes() / 60;

    let duration = totalMinutes;
    let bonusMinutes = 0;
    if (parseInt(jam) === 2 && parseInt(menit) === 0) bonusMinutes = 30;
    else if (parseInt(jam) === 3 && parseInt(menit) === 0) bonusMinutes = 60;

    const end = new Date(start.getTime() + (duration + bonusMinutes) * 60000);
    const isDay = hour >= 10 && hour < 16.75;
    const ratePer30 = isDay ? 22500 : 30000;
    const ratePerHour = ratePer30 * 2;
    const fullHours = Math.floor(duration / 60);
    const extraMinutes = duration % 60;
    const extraCharge = extraMinutes > 0 ? (extraMinutes / 30) * ratePer30 : 0;
    const totalPrice = fullHours * ratePerHour + extraCharge;

    const newBooking = {
      room,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: duration + bonusMinutes,
      bonusMinutes,
      people: parseInt(jumlahOrang),
      cashier: kasir || "Tidak Diketahui",
      pricePer30Min: ratePer30,
      totalPrice,
      status: "active",
      createdAt: serverTimestamp(),
    };

    await push(ref(db, "bookings"), newBooking);
    setRoom(""); setJam(""); setMenit(""); setJumlahOrang(""); setIsSaving(false);
  };

  const rooms = ["KTV 1", "KTV 2", "KTV 3", "KTV 4", "KTV 5", "KTV 8", "KTV 9", "KTV 10", "KTV 11", "KTV 12"];
  const usedRooms = activeBookings.map(b => b.room);

  return (
    <div className="w-full bg-[#0F1117] rounded-3xl shadow-[0_0_25px_rgba(255,255,255,0.05)] text-white p-6 transition-all duration-500 ease-out">
      <h2 className="text-xl font-semibold mb-4 text-white/90">Buat Pemesanan Baru</h2>

      <label className="block text-sm mb-1 text-gray-400">Pilih Ruangan</label>
      <select
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full mb-3 p-3 bg-gray-900 rounded-xl border border-gray-700 focus:ring-2 focus:ring-pink-500 transition-all"
      >
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} value={r} disabled={usedRooms.includes(r)}>
            {usedRooms.includes(r) ? `${r} (Terpakai)` : r}
          </option>
        ))}
      </select>

      <label className="block text-sm mb-1 text-gray-400">Jam Masuk</label>
      <div className="flex gap-2 mb-3">
        <input
          readOnly
          value={timeNow.toTimeString().slice(0, 5)}
          className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-xl text-gray-300"
        />
        <button
          onClick={handleNow}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-sm font-semibold"
        >
          Sekarang
        </button>
      </div>

      <label className="block text-sm mb-1 text-gray-400">Durasi</label>
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          placeholder="Jam"
          value={jam}
          onChange={(e) => setJam(e.target.value)}
          className="w-1/2 p-3 bg-gray-900 border border-gray-700 rounded-xl"
        />
        <input
          type="number"
          placeholder="Menit"
          value={menit}
          onChange={(e) => setMenit(e.target.value)}
          className="w-1/2 p-3 bg-gray-900 border border-gray-700 rounded-xl"
        />
      </div>

      <label className="block text-sm mb-1 text-gray-400">Jumlah Orang</label>
      <input
        type="number"
        placeholder="Masukkan jumlah tamu"
        value={jumlahOrang}
        onChange={(e) => setJumlahOrang(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-900 border border-gray-700 rounded-xl"
      />

      <button
        onClick={handleAddBooking}
        disabled={isSaving}
        className={`w-full py-3 rounded-2xl font-semibold transition-all ${isSaving ? "bg-gray-700" : "bg-green-600 hover:bg-green-700"}`}
      >
        {isSaving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>
    </div>
  );
}
