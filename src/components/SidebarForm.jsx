import React, { useState } from "react";
import { ref, push, serverTimestamp, get } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir = "Tidak Diketahui", onAdded }) {
  const [room, setRoom] = useState("");
  const [jamMasuk, setJamMasuk] = useState("");
  const [jam, setJam] = useState("");
  const [menit, setMenit] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");
  const [saving, setSaving] = useState(false);

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

  const isDayTime = (date) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const total = h * 60 + m;
    return total >= 600 && total <= 1004; // 10.00–16.44
  };

  const calculatePrice = (minutes, startDate) => {
    const ratePer30 = isDayTime(startDate) ? 22500 : 30000;
    const ratePerHour = ratePer30 * 2;
    const fullHours = Math.floor(minutes / 60);
    const extraMinutes = minutes % 60;
    const extraCharge = extraMinutes > 0 ? Math.ceil(extraMinutes / 30) * ratePer30 : 0;
    return {
      ratePer30,
      ratePerHour,
      total: fullHours * ratePerHour + extraCharge,
    };
  };

  const checkRoomConflict = async (room, startISO, endISO) => {
    const snap = await get(ref(db, "bookings"));
    if (!snap.exists()) return false;
    const bookings = snap.val();
    for (const key in bookings) {
      const b = bookings[key];
      if (!b || b.room !== room || b.status !== "active") continue;
      const start = new Date(b.startTime).getTime();
      const end = new Date(b.endTime).getTime();
      const newStart = new Date(startISO).getTime();
      const newEnd = new Date(endISO).getTime();
      const overlap = !(newEnd <= start || newStart >= end);
      if (overlap) return true;
    }
    return false;
  };

  const handleAddBooking = async () => {
    if (!room || (!jam && !menit) || !jumlahOrang || !jamMasuk) {
      alert("Lengkapi semua data sebelum menambah pemesanan!");
      return;
    }

    setSaving(true);
    try {
      const [hours, minutes] = jamMasuk.split(":").map(Number);
      const start = new Date();
      start.setHours(hours, minutes, 0, 0);

      let duration = parseInt(jam || 0) * 60 + parseInt(menit || 0);
      let bonus = 0;

      if (parseInt(jam) === 2 && parseInt(menit) === 0) bonus = 30;
      if (parseInt(jam) === 3 && parseInt(menit) === 0) bonus = 60;

      const totalMinutes = duration + bonus;
      const end = new Date(start.getTime() + totalMinutes * 60000);

      const conflict = await checkRoomConflict(room, start.toISOString(), end.toISOString());
      if (conflict) {
        alert("Ruangan ini masih digunakan! Harap pilih ruangan lain.");
        setSaving(false);
        return;
      }

      const priceData = calculatePrice(duration, start);

      const newBooking = {
        room,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: totalMinutes,
        inputDurationMinutes: duration,
        bonusMinutes: bonus,
        people: parseInt(jumlahOrang),
        cashier: kasir,
        pricePer30Min: priceData.ratePer30,
        subtotal: priceData.total,
        status: "active",
        createdAt: serverTimestamp(),
      };

      await push(ref(db, "bookings"), newBooking);
      alert("✅ Pemesanan berhasil ditambahkan!");
      setRoom("");
      setJam("");
      setMenit("");
      setJumlahOrang("");
      setJamMasuk("");
      if (onAdded) onAdded();
    } catch (err) {
      console.error("Error adding booking:", err);
      alert("❌ Terjadi kesalahan saat menyimpan data pemesanan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside className="w-full md:w-80 bg-gray-900/80 backdrop-blur-md p-5 rounded-2xl shadow-xl text-white">
      <p className="text-pink-400 font-semibold mb-2">
        Login sebagai: <span className="text-white font-bold">{kasir}</span>
      </p>
      <h2 className="text-xl font-bold mb-4">Buat Pemesanan Baru</h2>

      <label className="block text-sm mb-1">Pilih Ruangan</label>
      <select
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full mb-3 p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-pink-500"
      >
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <label className="block text-sm mb-1">Jam Masuk</label>
      <input
        type="time"
        value={jamMasuk}
        onChange={(e) => setJamMasuk(e.target.value)}
        className="w-full mb-3 p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
      />

      <label className="block text-sm mb-1">Durasi</label>
      <div className="flex gap-2 mb-3">
        <input
          type="number"
          placeholder="Jam"
          value={jam}
          onChange={(e) => setJam(e.target.value)}
          className="w-1/2 p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-pink-500"
        />
        <input
          type="number"
          placeholder="Menit"
          value={menit}
          onChange={(e) => setMenit(e.target.value)}
          className="w-1/2 p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-pink-500"
        />
      </div>

      <label className="block text-sm mb-1">Jumlah Orang</label>
      <input
        type="number"
        placeholder="Masukkan jumlah tamu"
        value={jumlahOrang}
        onChange={(e) => setJumlahOrang(e.target.value)}
        className="w-full p-2 mb-4 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-pink-500"
      />

      <button
        onClick={handleAddBooking}
        disabled={saving}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          saving
            ? "bg-gray-700 cursor-not-allowed text-gray-400"
            : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>

      <div className="mt-6 text-sm text-gray-400 border-t border-gray-700 pt-3">
        <p>
          <span className="text-pink-400 font-semibold">Promo hanya berlaku:</span>
          <br />• 2 jam → +30 menit gratis
          <br />• 3 jam → +1 jam gratis
        </p>
        <p className="mt-3">
          <span className="text-green-400">Siang (10.00–16.44):</span> Rp22.500 / 30 menit
          <br />
          <span className="text-blue-400">Malam (16.45–00.00):</span> Rp30.000 / 30 menit
        </p>
      </div>
    </aside>
  );
}
