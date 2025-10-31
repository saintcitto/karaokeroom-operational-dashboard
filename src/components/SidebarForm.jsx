import React, { useEffect, useState } from "react";
import { calculateTotalPriceWithPromo } from "../utils/helpers";
import { ROOM_NAMES } from "../data/constants";

export default function SidebarForm({
  rooms = ROOM_NAMES,
  activeRoomNames = [],
  onAddBooking = () => {},
  formPrefill = null,
  onClearPrefill = () => {},
  currentUser = null,
  onLogout = () => {},
  saving = false
}) {
  const [room, setRoom] = useState("");
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  });
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [people, setPeople] = useState(1);

  useEffect(() => {
    if (formPrefill) {
      if (formPrefill.room) setRoom(formPrefill.room);
      if (formPrefill.startTime) setTimeStr(formPrefill.startTime);
      onClearPrefill();
    }
  }, [formPrefill, onClearPrefill]);

  useEffect(() => {
    const t = setInterval(() => {
      const d = new Date();
      setTimeStr((prev) => {
        const nowStr = `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
        return prev === "" ? nowStr : prev;
      });
    }, 60_000);
    return () => clearInterval(t);
  }, []);

  const handleNow = () => {
    const d = new Date();
    setTimeStr(`${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`);
  };

  const handleAdd = async () => {
    if (!room) return;
    const hh = parseInt(hours || 0, 10);
    const mm = parseInt(minutes || 0, 10);
    const totalMinutes = Math.max(0, hh * 60 + mm);
    if (totalMinutes <= 0) return;
    const [tH, tM] = (timeStr || "00:00").split(":").map((s) => parseInt(s, 10));
    const start = new Date();
    start.setHours(tH, tM, 0, 0);
    const startIso = start.toISOString();
    const payload = {
      room,
      startTime: startIso,
      durationMinutes: totalMinutes,
      people: Number(people || 1),
      cashier: currentUser || "Tidak Diketahui"
    };
    await onAddBooking(payload);
    setRoom("");
    setHours("");
    setMinutes("");
    setPeople(1);
  };

  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-start bg-gray-900 p-6 text-white shadow-xl md:static fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400">Login sebagai:</div>
          <div className="font-semibold text-pink-400">{currentUser || "Tamu"}</div>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="text-sm text-red-400 hover:text-red-500">Logout</button>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

        <label className="block text-sm mb-2">Pilih Ruangan</label>
        <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg">
          <option value="">-- Pilih Ruangan --</option>
          {Array.isArray(rooms) && rooms.map((r) => (
            <option key={r} value={r} disabled={Array.isArray(activeRoomNames) && activeRoomNames.includes(r)}>
              {r} {Array.isArray(activeRoomNames) && activeRoomNames.includes(r) ? " (Terpakai)" : ""}
            </option>
          ))}
        </select>

        <label className="block text-sm mb-2">Jam Masuk</label>
        <div className="flex gap-3 mb-4">
          <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg" />
          <button onClick={handleNow} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg" type="button">Sekarang</button>
        </div>

        <label className="block text-sm mb-2">Durasi</label>
        <div className="flex gap-3 mb-4">
          <input type="number" min="0" placeholder="Jam" value={hours} onChange={(e) => setHours(e.target.value)} className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg" />
          <input type="number" min="0" placeholder="Menit" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg" />
        </div>

        <label className="block text-sm mb-2">Jumlah Orang</label>
        <input type="number" min="1" placeholder="Masukkan jumlah tamu" value={people} onChange={(e) => setPeople(e.target.value)} className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg" />

        <button onClick={handleAdd} disabled={saving || (room && Array.isArray(activeRoomNames) && activeRoomNames.includes(room))} className={`w-full py-3 rounded-lg font-semibold transition ${saving ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700"}`} type="button">
          {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
        </button>

        <div className="mt-6 text-sm text-gray-400 border-t border-gray-700 pt-3 leading-relaxed">
          <p>
            <span className="text-pink-400 font-semibold">Promo otomatis:</span>
            <br />• 2 jam → +30 menit gratis
            <br />• 3 jam → +1 jam gratis
          </p>
        </div>
      </div>
    </aside>
  );
}
