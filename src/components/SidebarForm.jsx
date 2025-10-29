import React, { useState } from 'react';
import { formatTimeForInput } from '../utils/helpers';

export default function SidebarForm({ activeRoomNames, onAddBooking, formPrefill, onClearPrefill }) {
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState(formatTimeForInput(new Date()));
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [people, setPeople] = useState(0);
  const [note, setNote] = useState('');

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
      totalHours >= 3
        ? 'Gratis 1 jam'
        : totalHours >= 2
        ? 'Gratis 30 menit'
        : null;
    const totalPrice = basePrice + extraPeople;

    onAddBooking({
      id: `${room}-${Date.now()}`,
      room,
      startTime: start,
      endTime: end,
      people,
      totalPrice,
      promo,
      note,
      expired: false,
    });

    setRoom('');
    setDurationHours(1);
    setDurationMinutes(0);
    setPeople(0);
    setNote('');
  };

  return (
    <div className="p-4 space-y-4">
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
            onClick={() => setStartTime(formatTimeForInput(new Date()))}
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

      {formPrefill?.note && (
        <p className="text-xs text-blue-300 italic border-l-2 border-blue-400 pl-2">
          {formPrefill.note}
        </p>
      )}

      <button
        onClick={handleAddBooking}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
      >
        + Tambah Pemesanan
      </button>

      <a
        href="/history"
        className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
      >
        📘 Lihat Data Historis
      </a>

      <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
        Promo otomatis: 30 menit gratis untuk durasi ≥ 2 jam, dan 1 jam gratis untuk durasi ≥ 3 jam.
      </div>
    </div>
  );
}
