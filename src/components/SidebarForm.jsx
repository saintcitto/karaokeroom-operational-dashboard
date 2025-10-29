import React, { useState, useEffect } from "react";

export default function SidebarForm({
  activeRoomNames,
  onAddBooking,
  onShowHistory,
  currentUser
}) {
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [people, setPeople] = useState('');
  const [calculated, setCalculated] = useState(null);

  const sanitizeNumber = (value, allowZero = false) => {
    if (value === '') return '';
    const cleaned = value.replace(/[^0-9]/g, '');
    if (cleaned === '') return '';
    const num = Number(cleaned);
    if (!allowZero && num === 0) return '';
    return num;
  };

  useEffect(() => {
    if (!startTime || (!durationHours && !durationMinutes)) {
      setCalculated(null);
      return;
    }

    const now = new Date();
    const [hour, minute] = startTime.split(':').map(Number);
    const start = new Date(now);
    start.setHours(hour, minute, 0, 0);

    const durH = Number(durationHours) || 0;
    const durM = Number(durationMinutes) || 0;
    const totalMinutes = durH * 60 + durM;

    // tarif
    const startHour = start.getHours();
    const startMin = start.getMinutes();
    let rate = 45000;
    if (startHour > 16 || (startHour === 16 && startMin >= 45)) {
      rate = 60000;
    }

    // bonus
    let bonus = 0;
    let promo = null;
    if (durH >= 3) {
      bonus = 60;
      promo = "Gratis 1 jam";
    } else if (durH >= 2) {
      bonus = 30;
      promo = "Gratis 30 menit";
    }

    const paidHours = totalMinutes / 60;
    const totalPaid = paidHours * rate;

    const totalMinutesDisplay = totalMinutes + bonus;
    const hours = Math.floor(totalMinutesDisplay / 60);
    const minutes = totalMinutesDisplay % 60;

    setCalculated({
      rate,
      promo,
      bonus,
      totalPaid,
      totalDisplay: `${hours} jam ${minutes ? minutes + ' menit' : ''}`,
    });
  }, [startTime, durationHours, durationMinutes]);

  const handleAddBooking = () => {
    if (!room || !startTime) return alert('Pilih ruangan dan jam masuk!');
    if (!durationHours && !durationMinutes)
      return alert('Durasi tidak boleh kosong atau nol!');
    if (!people || Number(people) <= 0)
      return alert('Jumlah orang minimal 1!');

    const start = new Date();
    const [hour, minute] = startTime.split(':').map(Number);
    start.setHours(hour, minute, 0, 0);

    const durH = Number(durationHours) || 0;
    const durM = Number(durationMinutes) || 0;

    let bonusMinutes = 0;
    if (durH >= 3) bonusMinutes = 60;
    else if (durH >= 2) bonusMinutes = 30;

    const totalMinutes = durH * 60 + durM + bonusMinutes;
    const end = new Date(start.getTime() + totalMinutes * 60000);

    const startHour = start.getHours();
    const startMin = start.getMinutes();
    let rate = 45000;
    if (startHour > 16 || (startHour === 16 && startMin >= 45)) rate = 60000;

    const paidHours = (durH * 60 + durM) / 60;
    const totalPrice = paidHours * rate;
    const promo =
      durH >= 3 ? "Gratis 1 jam" : durH >= 2 ? "Gratis 30 menit" : "-";

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
    setCalculated(null);
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
              type="text"
              inputMode="numeric"
              value={durationHours}
              onChange={(e) => setDurationHours(sanitizeNumber(e.target.value))}
              className="w-full p-2 bg-gray-700 text-white rounded"
              placeholder="Jam"
            />
            <span className="text-gray-400 self-center">Jam</span>
            <input
              type="text"
              inputMode="numeric"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(sanitizeNumber(e.target.value, true))}
              className="w-full p-2 bg-gray-700 text-white rounded"
              placeholder="Menit"
            />
            <span className="text-gray-400 self-center">Menit</span>
          </div>
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-300">Jumlah Orang</label>
        <input
          type="text"
          inputMode="numeric"
          value={people}
          onChange={(e) => setPeople(sanitizeNumber(e.target.value))}
          className="w-full mt-1 p-2 bg-gray-700 text-white rounded"
          placeholder="Masukkan jumlah tamu"
        />
      </div>

      {calculated && (
        <div className="bg-gray-700/60 rounded-lg p-3 mt-2 text-sm text-gray-100 border border-gray-600">
          <p>
            💵 Tarif: <span className="font-semibold">Rp {calculated.rate.toLocaleString()}</span>/jam
          </p>
          <p>
            ⏱ Total waktu: <span className="font-semibold">{calculated.totalDisplay}</span>
          </p>
          {calculated.promo && (
            <p className="text-green-400">🎁 {calculated.promo}</p>
          )}
          <p className="mt-1">
            💰 Estimasi Bayar:{" "}
            <span className="font-bold text-yellow-400">
              Rp {calculated.totalPaid.toLocaleString()}
            </span>
          </p>
        </div>
      )}

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
