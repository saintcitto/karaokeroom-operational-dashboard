import React, { useState } from 'react';

export default function SidebarForm({
  activeRoomNames,
  onAddBooking,
  formPrefill,
  onClearPrefill,
  onShowHistory,
  currentUser
}) {
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [people, setPeople] = useState('');

  const handleAddBooking = () => {
    if (!room || !startTime) return alert('Pilih ruangan dan jam masuk!');
    if (!durationHours && !durationMinutes)
      return alert('Durasi tidak boleh kosong atau nol!');
    if (Number(durationHours) < 0 || Number(durationMinutes) < 0)
      return alert('Durasi tidak boleh negatif!');
    if (!people || Number(people) <= 0)
      return alert('Jumlah orang minimal 1!');

    const start = new Date();
    const [hour, minute] = startTime.split(':').map(Number);
    start.setHours(hour, minute, 0, 0);

    const durHours = Number(durationHours) || 0;
    const durMinutes = Number(durationMinutes) || 0;

    let bonusMinutes = 0;
    if (durHours >= 3) bonusMinutes = 60;
    else if (durHours >= 2) bonusMinutes = 30;

    const totalMinutes = durHours * 60 + durMinutes + bonusMinutes;
    const end = new Date(start.getTime() + totalMinutes * 60000);

    const totalHours = totalMinutes / 60;
    const pricePerHour = 60000;
    const basePrice = totalHours * pricePerHour;
    const extraPeople = Number(people) > 10 ? 5000 : 0;
    const promo =
      durHours >= 3 ? 'Gratis 1 jam' : durHours >= 2 ? 'Gratis 30 menit' : '-';
    const totalPrice = basePrice + extraPeople;

    onAddBooking({
      id: `${room}-${Date.now()}`,
      room,
      startTime: start,
      endTime: end,
      people: Number(people),
      totalPrice,
      promo,
      expired: false,
      handledBy: currentUser,
    });

    setRoom('');
    setDurationHours('');
    setDurationMinutes('');
    setPeople('');
  };

  // Fungsi input sanitizer
  const handleNumberInput = (value, setter, allowZero = false) => {
    if (value === '') return setter('');
    const num = Number(value);
    if (isNaN(num) || num < 0) return;
    if (!allowZero && num === 0) return setter('');
    setter(num);
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
              onChange={(e) => handleNumberInput(e.target.value, setDurationHours)}
              className="w-full p-2 bg-gray-700 text-white rounded"
              placeholder="Jam"
              min="1"
            />
            <span className="text-gray-400 self-center">Jam</span>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => handleNumberInput(e.target.value, setDurationMinutes, true)}
              className="w-full p-2 bg-gray-700 text-white rounded"
              placeholder="Menit"
              min="0"
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
          onChange={(e) => handleNumberInput(e.target.value, setPeople)}
          className="w-full mt-1 p-2 bg-gray-700 text-white rounded"
          placeholder="Masukkan jumlah tamu"
          min="1"
        />
      </div>

      <button
        onClick={handleAddBooking}
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded"
      >
        + Tambah Pemesanan
      </button>

      {currentUser === 'Baya Ganteng' && (
        <button
          onClick={onShowHistory}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded"
        >
          📊 Data Historis
        </button>
      )}

      <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
        Promo otomatis: 30 menit gratis untuk durasi ≥ 2 jam, dan 1 jam gratis untuk durasi ≥ 3 jam.
      </div>
    </div>
  );
}
