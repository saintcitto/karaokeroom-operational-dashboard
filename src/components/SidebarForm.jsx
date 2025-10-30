import React, { useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir }) {
  const [room, setRoom] = useState("");
  const [jam, setJam] = useState("");
  const [menit, setMenit] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");

  const handleAddBooking = async () => {
    if (!room || (!jam && !menit) || !jumlahOrang) return;

    const start = new Date();
    const hour = start.getHours();
    const totalMinutes = parseInt(jam || 0) * 60 + parseInt(menit || 0);

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
      cashier: kasir,
      pricePer30Min: ratePer30,
      totalPrice,
      status: "active",
      createdAt: serverTimestamp(),
    };

    await push(ref(db, "bookings"), newBooking);
    setRoom("");
    setJam("");
    setMenit("");
    setJumlahOrang("");
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

  return (
    <div className="w-full bg-gray-900 p-5 rounded-2xl text-white shadow-2xl backdrop-blur-md">
      <h2 className="text-xl font-semibold mb-5">Buat Pemesanan Baru</h2>

      <label className="block text-sm mb-1">Pilih Ruangan</label>
      <select
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full mb-4 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none"
      >
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="block text-sm mb-1">Jam Masuk</label>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          readOnly
          value={new Date().toTimeString().slice(0, 5)}
          className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300"
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
          onClick={() => setJam("")}
        >
          Sekarang
        </button>
      </div>

      <label className="block text-sm mb-1">Durasi</label>
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Jam"
          inputMode="numeric"
          value={jam}
          onChange={(e) => setJam(e.target.value.replace(/\D/, ""))}
          className="w-1/2 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-gray-500"
        />
        <input
          type="text"
          placeholder="Menit"
          inputMode="numeric"
          value={menit}
          onChange={(e) => setMenit(e.target.value.replace(/\D/, ""))}
          className="w-1/2 p-2 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-gray-500"
        />
      </div>

      <label className="block text-sm mb-1">Jumlah Orang</label>
      <input
        type="text"
        placeholder="Masukkan jumlah tamu"
        inputMode="numeric"
        value={jumlahOrang}
        onChange={(e) => setJumlahOrang(e.target.value.replace(/\D/, ""))}
        className="w-full p-2 mb-5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-pink-500 focus:outline-none placeholder-gray-500"
      />

      <button
        onClick={handleAddBooking}
        className="w-full bg-green-600 hover:bg-green-700 py-3 rounded-xl font-semibold text-white shadow-md transition-all duration-200"
      >
        + Tambah Pemesanan
      </button>

      <div className="mt-6 text-sm text-gray-400 border-t border-gray-700 pt-3 leading-relaxed space-y-2">
        <p>
          <span className="text-pink-400 font-semibold">Promo hanya berlaku:</span>
          <br />• 2 jam → +30 menit gratis
          <br />• 3 jam → +1 jam gratis
        </p>
        <p>
          <span className="text-green-400 font-semibold">Siang (10.00–16.44):</span> Rp22.500 / 30 menit
          <br />
          <span className="text-blue-400 font-semibold">Malam (16.45–00.00):</span> Rp30.000 / 30 menit
        </p>
      </div>
    </div>
  );
}
