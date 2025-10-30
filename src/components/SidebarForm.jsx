import React, { useEffect, useState } from "react";
import { ref, push, serverTimestamp } from "firebase/database";
import { db } from "../firebaseConfig";

export default function SidebarForm({ kasir = "Tidak Diketahui", activeBookings = [] }) {
  const [room, setRoom] = useState("");
  const [hourInput, setHourInput] = useState("");
  const [minuteInput, setMinuteInput] = useState("");
  const [people, setPeople] = useState("");
  const [now, setNow] = useState(new Date());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const allRooms = [
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

  const usedRooms = Array.isArray(activeBookings) ? activeBookings.map((b) => b.room) : [];

  const formatTime = (d) => d.toTimeString().slice(0, 5);

  const calculatePrice = (startDate, durationMinutes) => {
    const hourDecimal = startDate.getHours() + startDate.getMinutes() / 60;
    const isDay = hourDecimal >= 10 && hourDecimal < 16.75;
    const ratePer30 = isDay ? 22500 : 30000;
    const ratePerHour = ratePer30 * 2;
    const fullHours = Math.floor(durationMinutes / 60);
    const extraMinutes = durationMinutes % 60;
    const extraCharge = extraMinutes > 0 ? Math.ceil(extraMinutes / 30) * ratePer30 : 0;
    return fullHours * ratePerHour + extraCharge;
  };

  const handleNowClick = () => setNow(new Date());

  const handleSubmit = async () => {
    if (!room || (!hourInput && !minuteInput) || !people) return;
    if (usedRooms.includes(room)) return;

    setSaving(true);

    const duration = Number(hourInput || 0) * 60 + Number(minuteInput || 0);
    let bonus = 0;
    if (Number(hourInput) === 2 && Number(minuteInput) === 0) bonus = 30;
    if (Number(hourInput) === 3 && Number(minuteInput) === 0) bonus = 60;

    const totalDuration = duration + bonus;
    const end = new Date(now.getTime() + totalDuration * 60000);
    const price = calculatePrice(now, duration);

    const payload = {
      room,
      startTime: now.toISOString(),
      endTime: end.toISOString(),
      durationRequestedMinutes: duration,
      bonusMinutes: bonus,
      durationTotalMinutes: totalDuration,
      people: Number(people),
      cashier: kasir,
      totalPrice: Number(price),
      pricePer30Min: Number(price) ? undefined : undefined,
      status: "active",
      createdAt: serverTimestamp(),
    };

    await push(ref(db, "bookings"), payload);
    setRoom("");
    setHourInput("");
    setMinuteInput("");
    setPeople("");
    setSaving(false);
  };

  return (
    <aside className="w-full md:w-80 bg-[#0b0f14] rounded-3xl p-6 shadow-2xl sticky top-6">
      <div className="text-pink-400 text-sm font-semibold mb-2">Login sebagai: {kasir}</div>
      <h3 className="text-2xl font-extrabold text-white mb-4">Buat Pemesanan Baru</h3>

      <label className="block text-sm text-gray-300 mb-2">Pilih Ruangan</label>
      <select
        className="w-full bg-[#0f1720] text-white p-3 rounded-xl border border-gray-800 mb-4"
        value={room}
        onChange={(e) => setRoom(e.target.value)}
      >
        <option value="">-- Pilih Ruangan --</option>
        {allRooms.map((r) => (
          <option key={r} value={r} disabled={usedRooms.includes(r)}>
            {usedRooms.includes(r) ? `${r} (Terpakai)` : r}
          </option>
        ))}
      </select>

      <label className="block text-sm text-gray-300 mb-2">Jam Masuk</label>
      <div className="flex gap-3 mb-4">
        <input
          className="flex-1 p-3 bg-[#0f1720] rounded-xl border border-gray-800 text-gray-300"
          value={formatTime(now)}
          readOnly
        />
        <button onClick={handleNowClick} className="px-4 py-2 rounded-xl bg-blue-600 text-white font-semibold">
          Sekarang
        </button>
      </div>

      <label className="block text-sm text-gray-300 mb-2">Durasi</label>
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Jam"
          className="w-1/2 p-3 bg-[#0f1720] rounded-xl border border-gray-800 text-gray-300"
          value={hourInput}
          onChange={(e) => setHourInput(e.target.value.replace(/\D/, ""))}
        />
        <input
          type="number"
          placeholder="Menit"
          className="w-1/2 p-3 bg-[#0f1720] rounded-xl border border-gray-800 text-gray-300"
          value={minuteInput}
          onChange={(e) => setMinuteInput(e.target.value.replace(/\D/, ""))}
        />
      </div>

      <label className="block text-sm text-gray-300 mb-2">Jumlah Orang</label>
      <input
        type="number"
        placeholder="Masukkan jumlah tamu"
        className="w-full p-3 bg-[#0f1720] rounded-xl border border-gray-800 text-gray-300 mb-4"
        value={people}
        onChange={(e) => setPeople(e.target.value.replace(/\D/, ""))}
      />

      <button
        onClick={handleSubmit}
        disabled={saving || !room || (!hourInput && !minuteInput) || !people || usedRooms.includes(room)}
        className={`w-full py-3 rounded-2xl font-bold transition ${
          saving || usedRooms.includes(room) ? "bg-gray-700 text-gray-300" : "bg-green-600 hover:bg-green-700 text-white"
        }`}
      >
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>

      <div className="mt-6 text-xs text-gray-400 leading-relaxed">
        <div className="mb-2">Siang (10.00–16.44): Rp22.500 / 30 menit</div>
        <div>Malam (16.45–00.00): Rp30.000 / 30 menit</div>
      </div>
    </aside>
  );
}
