import React from "react";
import { ROOM_NAMES } from "../data/constants";

export default function SidebarForm({ rooms = ROOM_NAMES, activeRoomNames = [], onAddBooking = () => {}, formPrefill = null, onClearPrefill = () => {}, currentUser = null, onLogout = () => {}, saving = false }) {
  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-start bg-gray-900 p-6 text-white shadow-xl md:static fixed left-0 top-0 overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">Buat Pemesanan Baru</h2>

      <label className="text-sm text-gray-400">Pilih Ruangan</label>
      <select className="w-full p-3 rounded-md bg-gray-800 text-white mb-4">
        <option>-- Pilih Ruangan --</option>
        {rooms.map((r) => (
          <option key={r} disabled={activeRoomNames.includes(r)}>{r}</option>
        ))}
      </select>

      <div className="mt-2">
        <label className="text-sm text-gray-400 block mb-1">Jam Masuk</label>
        <input className="w-full p-3 bg-gray-800 rounded-md mb-3 text-white" placeholder="HH:MM" />
        <button className="bg-blue-600 text-white px-4 py-2 rounded-md">Sekarang</button>
      </div>

      <div className="mt-4">
        <label className="text-sm text-gray-400 block mb-1">Durasi</label>
        <div className="flex gap-2">
          <input className="w-1/2 p-3 bg-gray-800 rounded-md text-white" placeholder="Jam" />
          <input className="w-1/2 p-3 bg-gray-800 rounded-md text-white" placeholder="Menit" />
        </div>
      </div>

      <div className="mt-4">
        <label className="text-sm text-gray-400 block mb-1">Jumlah Orang</label>
        <input className="w-full p-3 bg-gray-800 rounded-md text-white" defaultValue={1} />
      </div>

      <button onClick={onAddBooking} className="mt-5 bg-green-600 text-white px-4 py-3 rounded-md">
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
          <button onClick={onLogout} className="text-sm text-red-400 hover:text-red-500">Logout</button>
        </div>
      )}
    </aside>
  );
}
