import React, { useState, useEffect } from "react";
import { ref, push, serverTimestamp, onValue, get } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir, onAdded }) {
  const [room, setRoom] = useState("");
  const [jamMasuk, setJamMasuk] = useState("");
  const [jam, setJam] = useState("");
  const [menit, setMenit] = useState("");
  const [jumlahOrang, setJumlahOrang] = useState("");
  const [saving, setSaving] = useState(false);
  const [occupiedRooms, setOccupiedRooms] = useState([]);

  const rooms = ["KTV 1", "KTV 2", "KTV 3", "KTV 4", "KTV 5", "KTV 8", "KTV 9", "KTV 10", "KTV 11", "KTV 12"];

  useEffect(() => {
    const bookingsRef = ref(db, "bookings");
    const unsub = onValue(bookingsRef, (snapshot) => {
      if (snapshot.exists()) {
        const active = Object.values(snapshot.val()).filter((b) => b.status === "active");
        setOccupiedRooms(active.map((b) => b.room));
      } else setOccupiedRooms([]);
    });
    return () => unsub();
  }, []);

  const isDayTime = (date) => {
    const h = date.getHours(),
      m = date.getMinutes(),
      total = h * 60 + m;
    return total >= 600 && total <= 1004;
  };

  const calcPrice = (minutes, startDate) => {
    const rate = isDayTime(startDate) ? 22500 : 30000;
    const perHour = rate * 2;
    const full = Math.floor(minutes / 60);
    const extra = minutes % 60;
    const add = extra > 0 ? Math.ceil(extra / 30) * rate : 0;
    return full * perHour + add;
  };

  const handleAddBooking = async () => {
    if (!room || (!jam && !menit) || !jumlahOrang) return alert("⚠️ Lengkapi semua data!");

    if (occupiedRooms.includes(room)) return alert(`❌ ${room} sedang digunakan!`);

    setSaving(true);
    try {
      const [h, m] = jamMasuk ? jamMasuk.split(":").map(Number) : [new Date().getHours(), new Date().getMinutes()];
      const start = new Date();
      start.setHours(h, m, 0, 0);

      let durasi = parseInt(jam || 0) * 60 + parseInt(menit || 0);
      let bonus = 0,
        promo = null;

      if (parseInt(jam) === 2 && parseInt(menit) === 0) {
        bonus = 30;
        promo = "+30 Menit Gratis";
      } else if (parseInt(jam) === 3 && parseInt(menit) === 0) {
        bonus = 60;
        promo = "+1 Jam Gratis";
      }

      const totalMinutes = durasi + bonus;
      const end = new Date(start.getTime() + totalMinutes * 60000);
      const total = calcPrice(durasi, start);

      const snapshot = await get(ref(db, "bookings"));
      if (snapshot.exists()) {
        const active = Object.values(snapshot.val()).filter((b) => b.room === room && b.status === "active");
        if (active.length > 0) return alert(`⚠️ ${room} masih aktif!`);
      }

      const newBooking = {
        room,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: totalMinutes,
        inputDurationMinutes: durasi,
        bonusMinutes: bonus,
        promoText: promo,
        people: parseInt(jumlahOrang),
        cashier: kasir || "Tidak Diketahui",
        subtotal: total,
        status: "active",
        createdAt: serverTimestamp(),
      };

      await push(ref(db, "bookings"), newBooking);
      alert(`✅ ${room} berhasil ditambahkan${promo ? ` (${promo})` : ""}`);
      setRoom("");
      setJam("");
      setMenit("");
      setJumlahOrang("");
      setJamMasuk("");
      onAdded && onAdded();
    } catch (err) {
      console.error(err);
      alert("❌ Gagal menambah pemesanan!");
    } finally {
      setSaving(false);
    }
  };

  const setNow = () => {
    const n = new Date();
    setJamMasuk(`${n.getHours().toString().padStart(2, "0")}:${n.getMinutes().toString().padStart(2, "0")}`);
  };

  return (
    <aside className="w-full md:w-80 bg-gradient-to-br from-gray-900/70 to-gray-800/40 backdrop-blur-2xl border border-gray-700/60 rounded-3xl p-6 shadow-2xl text-white h-fit md:h-full flex flex-col justify-start">
      <p className="text-pink-400 font-semibold mb-2">
        Login sebagai: <span className="text-white">{kasir}</span>
      </p>
      <h2 className="text-xl font-bold mb-4 tracking-tight">Buat Pemesanan Baru</h2>

      <div className="space-y-3 flex-1">
        <label className="text-sm block text-gray-300">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full p-2 rounded-xl bg-gray-800/70 border border-gray-700 focus:ring-2 focus:ring-pink-400"
        >
          <option value="">-- Pilih Ruangan --</option>
          {rooms.map((r) => (
            <option key={r} value={r} disabled={occupiedRooms.includes(r)}>
              {occupiedRooms.includes(r) ? `${r} (Terpakai)` : r}
            </option>
          ))}
        </select>

        <label className="text-sm block text-gray-300">Jam Masuk</label>
        <div className="flex gap-2">
          <input
            type="time"
            value={jamMasuk}
            onChange={(e) => setJamMasuk(e.target.value)}
            className="flex-1 p-2 rounded-xl bg-gray-800/70 border border-gray-700 focus:ring-2 focus:ring-blue-400"
          />
          <button
            onClick={setNow}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm font-medium shadow-md"
          >
            Sekarang
          </button>
        </div>

        <label className="text-sm block text-gray-300">Durasi</label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Jam"
            value={jam}
            onChange={(e) => setJam(e.target.value)}
            className="w-1/2 p-2 rounded-xl bg-gray-800/70 border border-gray-700 focus:ring-2 focus:ring-pink-400"
          />
          <input
            type="number"
            placeholder="Menit"
            value={menit}
            onChange={(e) => setMenit(e.target.value)}
            className="w-1/2 p-2 rounded-xl bg-gray-800/70 border border-gray-700 focus:ring-2 focus:ring-pink-400"
          />
        </div>

        <label className="text-sm block text-gray-300">Jumlah Orang</label>
        <input
          type="number"
          placeholder="Masukkan jumlah tamu"
          value={jumlahOrang}
          onChange={(e) => setJumlahOrang(e.target.value)}
          className="w-full p-2 rounded-xl bg-gray-800/70 border border-gray-700 focus:ring-2 focus:ring-pink-400"
        />

        <button
          onClick={handleAddBooking}
          disabled={saving}
          className={`w-full py-3 rounded-xl font-semibold transition ${
            saving
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white shadow-md"
          }`}
        >
          {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
        </button>
      </div>
    </aside>
  );
}
