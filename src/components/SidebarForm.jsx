import React from "react";

const SidebarForm = ({
  room,
  setRoom,
  timeStr,
  setTimeStr,
  hours,
  setHours,
  minutes,
  setMinutes,
  people,
  setPeople,
  handleAddBooking,
  saving,
  rooms,
  activeRooms,
}) => {
  return (
    <aside className="w-full md:w-80 lg:w-72 h-full flex flex-col justify-start bg-gray-900 p-6 text-white border-r border-gray-800 shadow-inner overflow-y-auto">
      <div className="flex flex-col flex-1">
        <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

        <label className="block text-sm mb-2">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          <option value="">-- Pilih Ruangan --</option>
          {rooms.map((r) => (
            <option key={r} value={r} disabled={activeRooms.includes(r)}>
              {r} {activeRooms.includes(r) ? "(Terpakai)" : ""}
            </option>
          ))}
        </select>

        <label className="block text-sm mb-2">Jam Masuk</label>
        <div className="flex gap-3 mb-4">
          <input
            type="time"
            value={timeStr}
            onChange={(e) => setTimeStr(e.target.value)}
            className="flex-1 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <button
            onClick={() => {
              const now = new Date();
              setTimeStr(now.toTimeString().slice(0, 5));
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-lg transition"
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
            className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
          <input
            type="number"
            min="0"
            placeholder="Menit"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            className="w-1/2 p-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>

        <label className="block text-sm mb-2">Jumlah Orang</label>
        <input
          type="number"
          min="1"
          placeholder="Masukkan jumlah tamu"
          value={people}
          onChange={(e) => setPeople(e.target.value)}
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        />

        <button
          onClick={handleAddBooking}
          disabled={saving}
          className={`w-full py-3 rounded-lg font-semibold transition ${
            saving
              ? "bg-gray-700 text-gray-400"
              : "bg-green-600 hover:bg-green-700 active:bg-green-800"
          }`}
        >
          {saving ? "Menyimpan..." : "+ Tambah Pemesanan"}
        </button>
      </div>
    </aside>
  );
};

export default SidebarForm;
