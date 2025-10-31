import React, { useState, useEffect } from "react";
import { ROOM_NAMES } from "../data/constants";

export default function SidebarForm({
  rooms = ROOM_NAMES,
  activeRoomNames = [],
  onAddBooking = () => {},
  currentUser = null,
  onLogout = () => {},
  saving = false,
}) {
  const [room, setRoom] = useState("");
  const [time, setTime] = useState("");
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [people, setPeople] = useState(1);

  // auto set time = now
  useEffect(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setTime(`${hh}:${mm}`);
  }, []);

  const handleNow = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setTime(`${hh}:${mm}`);
  };

  const validateTime = (t) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t);

  const handleAdd = () => {
    if (!room) {
      alert("Pilih ruangan terlebih dahulu.");
      return;
    }
    if (!time || !validateTime(time)) {
      alert("Jam Masuk wajib diisi dengan format HH:MM (contoh: 06:25).");
      return;
    }

    const durMinutes = parseInt(hours || 0) * 60 + parseInt(minutes || 0);
    if (durMinutes <= 0) {
      alert("Durasi tidak boleh kosong.");
      return;
    }

    const now = new Date();
    const [hh, mm] = time.split(":").map((n) => parseInt(n, 10));
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh, mm, 0, 0);

    onAddBooking({
      room,
      startTimeISO: start.toISOString(),
      durationMinutes: durMinutes,
      people,
      cashier: currentUser || "Tamu",
    });

    // Reset form
    setRoom("");
    setHours(1);
    setMinutes(0);
    setPeople(1);
  };

  const availableRooms = rooms.filter((r) => !activeRoomNames.includes(r));

  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-start bg-gray-900 p-6 text-white shadow-xl md:static fixed left-0 top-0 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

      <label className="text-sm text-gray-400">Pilih Ruangan</label>
      <select
        value={room}
        onChange={(e) => setRoom(e.target.value)}
        className="w-full p-3 rounded-md bg-gray-800 text-white mb-4"
      >
        <option value="">-- Pilih Ruangan --</option>
        {availableRooms.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>

      <div className="mt-2">
        <label className="text-sm text-gray-400 block mb-1">Jam Masuk (HH:MM)</label>
        <div className="flex gap-2">
          <input
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="flex-1 p-3 bg-gray-800 rounded-md text-white"
            placeholder="06:25"
          />
          <button
            type="button"
            onClick={handleNow}
            className="bg-blue-600 text-white px-3 py-2 rounded-md"
          >
            Sekarang
          </button>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm text-gray-400 block mb-1">Durasi</label>
        <div className="flex gap-2">
          <input
            type="number"
            min="0"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-1/2 p-3 bg-gray-800 rounded-md text-white"
            placeholder="Jam"
          />
          <input
            type="number"
            min="0"
            max="59"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-1/2 p-3 bg-gray-800 rounded-md text-white"
            placeholder="Menit"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm text-gray-400 block mb-1">Jumlah Orang</label>
        <input
          type="number"
          min="1"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className="w-full p-3 bg-gray-800 rounded-md text-white"
        />
      </div>

      <button
        onClick={handleAdd}
        disabled={saving}
        className="mt-5 bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors"
      >
        + Tambah Pemesanan
      </button>

      <div className="mt-6 text-pink-400">
        <div className="mb-1">Promo otomatis:</div>
        <ul className="text-sm text-gray-400">
          <li>• 2 jam → +30 menit gratis</li>
          <li>• 3 jam → +1 jam gratis</li>
        </ul>
      </div>

      {currentUser && (
        <div className="mt-auto pt-6">
          <button
            onClick={onLogout}
            className="text-sm text-red-400 hover:text-red-500 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </aside>
  );
}
