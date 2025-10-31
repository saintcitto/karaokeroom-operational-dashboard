import React, { useEffect, useState } from "react";
import { formatTimeForInput, calculateTotalPriceWithPromo } from "../utils/helpers";
import { ROOM_NAMES } from "../data/constants";

export default function SidebarForm({
  rooms = ROOM_NAMES,
  activeRoomNames = [],
  onAddBooking = () => {},
  formPrefill = null,
  onClearPrefill = () => {},
  currentUser = "Tidak Diketahui",
  saving = false
}) {
  const [room, setRoom] = useState("");
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
    const id = setInterval(() => {
      const d = new Date();
      // only update clock if empty or equals previous minute (prevents overriding typed value)
      setTimeStr((prev) => {
        const s = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        return prev === "" ? s : prev;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const handleNow = () => {
    const d = new Date();
    setTimeStr(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
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
    const end = new Date(start.getTime() + totalMinutes * 60000);

    const pricing = calculateTotalPriceWithPromo(start, totalMinutes, Number(people || 1));

    await onAddBooking({
      room,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      durationMinutes: totalMinutes,
      people: Number(people || 1),
      cashier: currentUser,
      priceMeta: pricing
    });

    setRoom("");
    setHours("");
    setMinutes("");
    setPeople(1);
  };

  return (
    <div className="flex flex-col h-full">
      <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

      <label className="block text-sm mb-2">Pilih Ruangan</label>
      <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg">
        <option value="">-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} value={r} disabled={activeRoomNames.includes(r)}>{r}{activeRoomNames.includes(r) ? " (Terpakai)" : ""}</option>
        ))}
      </select>

      <label className="block text-sm mb-2">Jam Masuk</label>
      <div className="flex gap-3 mb-4">
        <input type="time" value={timeStr} onChange={(e) => setTimeStr(e.target.value)} className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg" />
        <button type="button" onClick={handleNow} className="px-4 py-2 bg-blue-600 rounded-lg">Sekarang</button>
      </div>

      <label className="block text-sm mb-2">Durasi</label>
      <div className="flex gap-3 mb-4">
        <input type="number" min="0" placeholder="Jam" value={hours} onChange={(e) => setHours(e.target.value)} className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg" />
        <input type="number" min="0" placeholder="Menit" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg" />
      </div>

      <label className="block text-sm mb-2">Jumlah Orang</label>
      <input type="number" min="1" placeholder="Masukkan jumlah tamu" value={people} onChange={(e) => setPeople(e.target.value)} className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg" />

      <button onClick={handleAdd} disabled={saving || (room && activeRoomNames.includes(room))} className={`w-full py-3 rounded-lg font-semibold ${saving ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700"}`}>
        {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
      </button>

      <div className="mt-6 text-sm text-gray-400 border-t border-gray-700 pt-3">
        <div className="text-pink-400 font-semibold">Promo otomatis:</div>
        <ul className="list-disc ml-5 mt-2">
          <li>2 jam → +30 menit gratis</li>
          <li>3 jam → +1 jam gratis</li>
        </ul>
      </div>
    </div>
  );
}
