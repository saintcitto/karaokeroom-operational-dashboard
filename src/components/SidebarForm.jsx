import React, { useState, useEffect } from 'react';
import * as Tone from 'tone';
import { AlertTriangle, Plus } from 'lucide-react';
import { ROOM_NAMES, DURATION_MINUTES } from '../data/constants';
import { formatTimeForInput, calculateTotalPriceWithPromo } from '../utils/helpers';

const SidebarForm = ({ activeRoomNames, onAddBooking }) => {
  const [room, setRoom] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationHours, setDurationHours] = useState(1);
  const [durationMinutes, setDurationMinutes] = useState(0);
  const [people, setPeople] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    const unlock = () => {
      if (Tone.context.state !== 'running') {
        Tone.start().then(() => {
          window.removeEventListener('click', unlock);
        });
      }
    };
    window.addEventListener('click', unlock);
    return () => window.removeEventListener('click', unlock);
  }, []);

  const handleStartTimeNow = () => {
    const now = new Date();
    setStartTime(formatTimeForInput(now));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!room) return setError('Silakan pilih ruangan.');
    if (!startTime) return setError('Silakan tentukan jam masuk.');

    const durationTotalMinutes = (Number(durationHours) * 60) + Number(durationMinutes);
    if (durationTotalMinutes <= 0) return setError('Durasi harus lebih dari 0 menit.');

    const [startH, startM] = startTime.split(':').map(Number);
    if (isNaN(startH) || isNaN(startM)) return setError('Format jam masuk tidak valid.');

    const startTimeDate = new Date();
    startTimeDate.setHours(startH, startM, 0, 0);
    const endTimeDate = new Date(startTimeDate.getTime() + durationTotalMinutes * 60000);

    const priceData = calculateTotalPriceWithPromo(startTimeDate, durationTotalMinutes, people);

    const newBooking = {
      id: `booking_${Date.now()}`,
      room,
      startTime: startTimeDate,
      endTime: endTimeDate,
      durationInMinutes: durationTotalMinutes,
      tarif: priceData.tarif,
      hargaWaktu: priceData.hargaWaktu,
      biayaTambahan: priceData.biayaTambahan,
      totalPrice: priceData.total,
      people,
      promoNote: priceData.promoNote,
    };

    onAddBooking(newBooking);
    setRoom('');
    setStartTime('');
    setDurationHours(1);
    setDurationMinutes(0);
    setPeople(0);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-xl font-bold text-white mb-4">Buat Pemesanan Baru</h2>

      <div>
        <label htmlFor="room" className="block text-sm font-medium text-gray-300 mb-1">Pilih Ruangan</label>
        <select
          id="room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">-- Pilih Ruangan --</option>
          {ROOM_NAMES.map(name => (
            <option key={name} value={name} disabled={activeRoomNames.includes(name)}>
              {name} {activeRoomNames.includes(name) ? '(Aktif)' : ''}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="start-time" className="block text-sm font-medium text-gray-300 mb-1">Jam Masuk</label>
        <div className="flex gap-2">
          <input
            type="time"
            id="start-time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
          />
          <button
            type="button"
            onClick={handleStartTimeNow}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap"
          >
            Sekarang
          </button>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">Durasi</label>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-xs text-gray-400">Jam</label>
            <input
              type="number"
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              min="0"
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-400">Menit</label>
            <select
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
            >
              {DURATION_MINUTES.map(min => (
                <option key={min} value={min}>{min}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="people" className="block text-sm font-medium text-gray-300 mb-1">Jumlah Orang</label>
        <input
          type="number"
          id="people"
          value={people}
          onChange={(e) => setPeople(Math.max(0, Number(e.target.value)))}
          min="0"
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2"
        />
        <small className="text-gray-400 text-xs">
          Tambahan Rp5.000 jika tamu lebih dari 10 orang (tidak dikali jumlah orang, berlaku semua jam).
        </small>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-red-400 bg-red-900/50 p-3 rounded-md">
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 transition-colors"
      >
        <Plus size={20} />
        Tambah Pemesanan
      </button>

      <p className="text-xs text-gray-400 mt-2">
        Promo otomatis: 30 menit gratis untuk durasi ≥ 2 jam, dan 1 jam gratis untuk durasi ≥ 3 jam.
      </p>
    </form>
  );
};

export default SidebarForm;
