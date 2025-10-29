import React, { useState } from 'react';
import HistoryReport from './HistoryReport';

export default function SidebarForm({ activeRoomNames, onAddBooking, formPrefill, onClearPrefill }) {
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [people, setPeople] = useState(0);
  const [showHistory, setShowHistory] = useState(false);

  const handleAddBooking = () => {
    if (!room) return;
    const start = new Date();
    const [hour, minute] = startTime.split(':').map(Number);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(start.getTime() + (durationHours * 60 + durationMinutes) * 60000);
    const totalHours = durationHours + durationMinutes / 60;
    const pricePerHour = 60000;
    const basePrice = totalHours * pricePerHour;
    const extraPeople = people > 10 ? 5000 : 0;
    const promo =
      totalHours >= 3 ? 'Gratis 1 jam' : totalHours >= 2 ? 'Gratis 30 menit' : null;
    const totalPrice = basePrice + extraPeople;

    onAddBooking({
      id: `${room}-${Date.now()}`,
      room,
      startTime: start,
      endTime: end,
      people,
      totalPrice,
      promo,
      expired: false,
    });

    setRoom('');
    setDurationHours(1);
    setDurationMinutes(0);
    setPeople(0);
  };

  return (
    <div className="p-4 space-y-4 relative">
      <h2 className="text-lg font-bold mb-2 text-gray-100">Buat Pemesanan Baru</h2>

      <div>
        <label className="text-sm text-gray-300">Pilih Ruangan</label>
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full mt-1 p-2 bg-gray-700 text-white rounded"
        >
          <option value="">-- Pilih Ruangan --</option>
          {[...Array(10)].map((_, i) => (
            <option
              key={i}
              value={`KTV ${i + 1}`}
              disabled={activeRoomNames.includes(`KTV ${i + 1}`)}
            >
              KTV {i + 1}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm text-gray-300">Jam Masuk</label>
        <div className="flex items-center space-x-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 p-2 bg-gray-700 text-white rounded"
          />
          <button
            onClick={() => {
              const now = new Date();
              const jam = String(now.getHours()).padStart(2, '0');
              const menit = String(now.getMinutes()).padStart(2, '0');
              setStartTime(`${jam}:${menit}`);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm"
          >
            Sekarang
          </button>
        </div>
      </div>

      <div className="flex space-x-2">
        <div className="flex-1">
          <label className="text-sm text-gray-300">Durasi</label>
          <div className="flex space-x-2">
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
            <span className="text-gray-400 self-center">Jam</span>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full p-2 bg-gray-700 text-white rounded"
            />
            <span className="text-gray-400 self-center">Menit</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300">Jumlah Orang</label>
        <input
          type="number"
          value={people}
          onChange={(e) => setPeople(Number(e.target.value))}
          className="w-full mt-1 p-2 bg-gray-700 text-white rounded"
          placeholder="Masukkan jumlah tamu"
        />
      </div>

      <button
        onClick={handleAddBooking}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
      >
        + Tambah Pemesanan
      </button>

      <button
        onClick={() => setShowHistory(true)}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
      >
      </button>

      {showHistory && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl p-6 w-11/12 md:w-3/4 h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowHistory(false)}
              className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm font-semibold"
            >
              Tutup
            </button>
            <HistoryReport />
          </div>
        </div>
      )}

      <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
        Promo otomatis: 30 menit gratis untuk durasi ≥ 2 jam, dan 1 jam gratis untuk durasi ≥ 3 jam.
      </div>
    </div>
  );
}
