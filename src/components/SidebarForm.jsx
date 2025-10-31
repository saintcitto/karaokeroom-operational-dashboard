import React, { useEffect, useState } from "react";
import { calculateTotalPriceWithPromo } from "../utils/helpers";
import { ROOM_NAMES } from "../data/constants";

export default function SidebarForm({
  rooms = ROOM_NAMES,
  activeRoomNames = [],
  onAddBooking = () => {},
  currentUser = "Tidak Diketahui",
  saving = false,
}) {
  const [room, setRoom] = useState("");
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  });
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [people, setPeople] = useState(1);

  const handleNow = () => {
    const d = new Date();
    setTimeStr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
  };

  const handleAdd = async () => {
    if (!room) return;
    const hh = parseInt(hours || 0, 10);
    const mm = parseInt(minutes || 0, 10);
    const durationMinutes = Math.max(0, hh * 60 + mm);
    if (durationMinutes <= 0) return;

    const [h, m] = timeStr.split(":").map(Number);
    const start = new Date();
    start.setHours(h, m, 0, 0);

    const pricing = calculateTotalPriceWithPromo(start, durationMinutes, people);

    const totalDuration = durationMinutes + (pricing.freeMinutes || 0);
    const end = new Date(start.getTime() + totalDuration * 60000);

    await onAddBooking({
      room,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: totalDuration,
      people,
      cashier: currentUser,
      priceMeta: pricing,
    });

    setRoom("");
    setHours("");
    setMinutes("");
    setPeople(1);
  };

  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col bg-gray-900 p-6 text-white shadow-xl overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

      <label className="block text-sm mb-2">Pilih Ruangan</label>
      <select
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
      >
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} value={r} disabled={activeRoomNames.includes(r)}>
            {r} {activeRoomNames.includes(r) ? "(Terpakai)" : ""}
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
        <button onClick={handleNow} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg" type="button">
          Sekarang
        </button>
      </div>

      <label className="block text-sm mb-2">Durasi</label>
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Jam"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg"
        />
        <input
          type="number"
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
        value={people}
        onChange={(e) => setPeople(e.target.value)}
        className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
      />

      <button
        onClick={handleAdd}
        disabled={saving}
        className={`w-full py-3 rounded-lg font-semibold transition ${
          saving ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700"
        }`}
        type="button"
      >
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>

      <div className="mt-6 text-sm text-pink-400 border-t border-gray-700 pt-3 leading-relaxed">
        <p>Promo otomatis:</p>
        <ul className="list-disc ml-5 text-gray-300">
          <li>2 jam → +30 menit gratis</li>
          <li>3 jam → +1 jam gratis</li>
        </ul>
      </div>
    </aside>
  );
}
