import React, { useState, useEffect } from "react";
import { ref, push, serverTimestamp, get } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir, onAdded }) {
  const [room, setRoom] = useState("");
  const [jamMasuk, setJamMasuk] = useState("");
  const [jam, setJam] = useState("");
  const [menit, setMenit] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");
  const [saving, setSaving] = useState(false);
  const [occupiedRooms, setOccupiedRooms] = useState([]);

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

  // Ambil room yang aktif dari Firebase biar tidak bisa dipesan ulang
  useEffect(() => {
    const fetchActiveRooms = async () => {
      const snap = await get(ref(db, "bookings"));
      if (snap.exists()) {
        const active = Object.values(snap.val()).filter((b) => b.status === "active");
        setOccupiedRooms(active.map((b) => b.room));
      }
    };
    fetchActiveRooms();
  }, []);

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
      if (!(newEnd <= start || newStart >= end)) return true;
    }
    return false;
  };

  const handleAddBooking = async () => {
    if (!room || (!jam && !menit) || !jumlahOrang) {
      alert("⚠️ Lengkapi semua data pemesanan!");
      return;
    }

    if (occupiedRooms.includes(room)) {
      alert(`❌ ${room} sedang digunakan! Pilih ruangan lain.`);
      return;
    }

    setSaving(true);
    try {
      const [hours, minutes] = jamMasuk
        ? jamMasuk.split(":").map(Number)
        : [new Date().getHours(), new Date().getMinutes()];

      const start = new Date();
      start.setHours(hours, minutes, 0, 0);

      let duration = parseInt(jam || 0) * 60 + parseInt(menit || 0);
      let bonus = 0;
      let promoText = null;

      if (parseInt(jam) === 2 && parseInt(menit) === 0) {
        bonus = 30;
        promoText = "+30 Menit Promo";
      } else if (parseInt(jam) === 3 && parseInt(menit) === 0) {
        bonus = 60;
        promoText = "+1 Jam Promo";
      }

      const totalMinutes = duration + bonus;
      const end = new Date(start.getTime() + totalMinutes * 60000);

      const conflict = await checkRoomConflict(room, start.toISOString(), end.toISOString());
      if (conflict) {
        alert(`⚠️ ${room} sedang aktif. Tidak bisa menambah pemesanan baru.`);
        setSaving(false);
        return;
      }

      const { ratePer30, total } = calculatePrice(duration, start);

      const newBooking = {
        room,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: totalMinutes,
        inputDurationMinutes: duration,
        bonusMinutes: bonus,
        promoText,
        people: parseInt(jumlahOrang),
        cashier: kasir || "Kasir Tidak Diketahui",
        pricePer30Min: ratePer30,
        subtotal: total,
        status: "active",
        createdAt: serverTimestamp(),
      };

      await push(ref(db, "bookings"), newBooking);
      alert(`✅ Pemesanan ${room} berhasil!${promoText ? ` (${promoText})` : ""}`);
      setRoom("");
      setJam("");
      setMenit("");
      setJumlahOrang("");
      setJamMasuk("");
      if (onAdded) onAdded();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menambah pemesanan.");
    } finally {
      setSaving(false);
    }
  };

  const handleNowTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    setJamMasuk(`${hours}:${minutes}`);
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
          <option key={r} value={r} disabled={occupiedRooms.includes(r)}>
            {occupiedRooms.includes(r) ? `${r} (Terpakai)` : r}
          </option>
        ))}
      </select>

      <label className="block text-sm mb-1">Jam Masuk</label>
      <div className="flex gap-2 mb-3">
        <input
          type="time"
          value={jamMasuk}
          onChange={(e) => setJamMasuk(e.target.value)}
          className="flex-1 p-2 bg-gray-800 border border-gray-700 rounded focus:ring-2 focus:ring-blue-500"
        />
        <button
          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm font-medium"
          onClick={handleNowTime}
        >
          Sekarang
        </button>
      </div>

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
    </aside>
  );
}
