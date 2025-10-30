import React, { useEffect, useState } from 'react';

const formatTwo = (n) => String(n).padStart(2, '0');

export default function SidebarForm({
  rooms = [],
  activeRooms = [],
  onAddBooking = () => {},
  saving = false
}) {
  const [room, setRoom] = useState('');
  const [timeStr, setTimeStr] = useState(() => {
    const d = new Date(); return `${formatTwo(d.getHours())}:${formatTwo(d.getMinutes())}`;
  });
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [people, setPeople] = useState('');

  useEffect(() => {
    const handle = setInterval(() => {
      const d = new Date();
      setTimeStr(`${formatTwo(d.getHours())}:${formatTwo(d.getMinutes())}`);
    }, 60_000);
    return () => clearInterval(handle);
  }, []);

  const handleNow = () => {
    const d = new Date();
    setTimeStr(`${formatTwo(d.getHours())}:${formatTwo(d.getMinutes())}`);
  };

  const handleAdd = async () => {
    if (!room) return;
    const hrs = parseInt(hours || 0, 10);
    const mins = parseInt(minutes || 0, 10);
    const totalMinutes = hrs * 60 + mins;
    if (totalMinutes <= 0) return;
    const peopleCount = Math.max(1, parseInt(people || 1, 10));
    const [hh, mm] = (timeStr || '00:00').split(':').map((s) => parseInt(s, 10));
    const start = new Date();
    start.setHours(hh);
    start.setMinutes(mm);
    start.setSeconds(0);
    const end = new Date(start.getTime() + totalMinutes * 60_000);
    await onAddBooking({
      room,
      start: start.toISOString(),
      end: end.toISOString(),
      durationMinutes: totalMinutes,
      people: peopleCount
    });
    setRoom('');
    setHours('');
    setMinutes('');
    setPeople('');
  };

  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-start bg-gray-900 p-6 text-white shadow-xl fixed left-0 top-0 md:static md:rounded-none md:shadow-none overflow-y-auto">
      <div className="flex flex-col flex-1">
        <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

        <label className="block text-sm mb-2">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
        >
          <option value="">-- Pilih Ruangan --</option>
          {Array.isArray(rooms) && rooms.map((r) => (
            <option key={r} value={r} disabled={Array.isArray(activeRooms) && activeRooms.includes(r)}>
              {r} {Array.isArray(activeRooms) && activeRooms.includes(r) ? " (Terpakai)" : ""}
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
          <button
            onClick={handleNow}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg"
            type="button"
          >
            Sekarang
          </button>
        </div>

        <label className="block text-sm mb-2">Durasi</label>
        <div className="flex gap-3 mb-4">
          <input
            type="number"
            min="0"
            placeholder="Jam"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg"
          />
          <input
            type="number"
            min="0"
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
          placeholder="Masukkan jumlah tamu"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg"
        />

        <button
          onClick={handleAdd}
          disabled={saving}
          className={`w-full py-3 rounded-lg font-semibold transition ${saving ? "bg-gray-700 text-gray-400" : "bg-green-600 hover:bg-green-700"}`}
          type="button"
        >
          {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
        </button>
      </div>
    </aside>
  );
}
