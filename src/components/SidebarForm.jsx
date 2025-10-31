import React, { useEffect, useMemo, useState } from "react";

const defaultRooms = [
  "KTV 1","KTV 2","KTV 3","KTV 4","KTV 5","KTV 8","KTV 9","KTV 10","KTV 11","KTV 12"
];

export default function SidebarForm({
  rooms = defaultRooms,
  activeRoomNames = [],
  onAddBooking = () => {},
  formPrefill = null,
  onClearPrefill = () => {},
  currentUser = "",
  onLogout = () => {},
  saving = false
}) {
  const [room, setRoom] = useState("");
  const [time, setTime] = useState(() => {
    const d = new Date();
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  });
  const [hours, setHours] = useState(1);
  const [minutes, setMinutes] = useState(0);
  const [people, setPeople] = useState(1);

  useEffect(() => {
    if (formPrefill) {
      setRoom(formPrefill.room || "");
      setHours(formPrefill.durationHours || Math.floor((formPrefill.durationMinutes || 60) / 60));
      setMinutes(formPrefill.durationMinutes ? (formPrefill.durationMinutes % 60) : 0);
      setPeople(formPrefill.people || 1);
    }
  }, [formPrefill]);

  const roomOptions = useMemo(() => rooms, [rooms]);

  function buildStartEndFromTimeString(timeStr, durMinutes) {
    // timeStr format "HH:MM" from UI
    const now = new Date();
    const [hh, mm] = String(timeStr).split(":").map((s) => parseInt(s, 10));
    // Use today's date with provided time
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hh || 0, mm || 0, 0, 0);
    // If start is in the past, keep it as-is (we allow)
    const end = new Date(start.getTime() + durMinutes * 60000);
    return { start: start.toISOString(), end: end.toISOString() };
  }

  function detectPromoAndExtraMinutes(durationMinutes) {
    // Promo rules:
    // 2 hours (120 min) -> +30min
    // 3 hours (180 min) -> +60min
    // rules are additive highest rule applies
    if (durationMinutes >= 180) return { extra: 60, note: "3 jam -> +1 jam gratis" };
    if (durationMinutes >= 120) return { extra: 30, note: "2 jam -> +30 menit gratis" };
    return { extra: 0, note: "-" };
  }

  async function handleSubmit(e) {
    e && e.preventDefault();
    if (!room) return alert("Pilih ruangan dulu.");
    const baseMinutes = (parseInt(hours || 0, 10) * 60) + (parseInt(minutes || 0, 10));
    if (baseMinutes <= 0) return alert("Durasi tidak boleh 0.");
    // calculate promo
    const promo = detectPromoAndExtraMinutes(baseMinutes);
    const finalDurationMinutes = baseMinutes + (promo.extra || 0);
    const { start, end } = buildStartEndFromTimeString(time, finalDurationMinutes);

    // price meta: minimal example so downstream can use it
    const priceMeta = {
      durationHours: finalDurationMinutes / 60,
      durationMinutes: finalDurationMinutes,
      promoNote: promo.note,
      bayarJam: finalDurationMinutes / 60, // used by current system
      hargaWaktu: 60000, // fallback; real pricing logic may be elsewhere
      biayaTambahan: 0,
      tarif: 60000,
      total: Math.round((finalDurationMinutes/60) * 60000) // simple estimate
    };

    const payload = {
      room,
      startTime: start,
      endTime: end,
      durationMinutes: finalDurationMinutes,
      people,
      cashier: currentUser || "Tidak Diketahui",
      priceMeta,
      promoNote: promo.note
    };

    try {
      await onAddBooking(payload);
      // reset inputs (but keep currentUser)
      setRoom("");
      setHours(1);
      setMinutes(0);
      setPeople(1);
    } catch (err) {
      console.error("Tambah pemesanan error:", err);
      alert("Gagal menambah pemesanan. Cek console.");
    }
  }

  return (
    <aside className="w-full md:w-80 lg:w-72 h-screen flex flex-col justify-start bg-gray-900 p-6 text-white shadow-xl md:static fixed left-0 top-0 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-xs text-gray-400">Login sebagai:</div>
          <div className="font-semibold text-pink-400">{currentUser || "Tamu"}</div>
        </div>
        {currentUser ? (
          <button onClick={onLogout} className="text-sm text-red-400 hover:text-red-500">
            Logout
          </button>
        ) : (
          <div className="text-xs text-gray-500">Belum login</div>
        )}
      </div>

      <h2 className="text-2xl font-semibold mb-4">Buat Pemesanan Baru</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm text-gray-300 block mb-1">Pilih Ruangan</label>
          <select value={room} onChange={(e) => setRoom(e.target.value)} className="w-full bg-gray-800 p-2 rounded">
            <option value="">-- Pilih Ruangan --</option>
            {roomOptions.map((r) => {
              const busy = activeRoomNames.includes(r);
              return (
                <option key={r} value={r} disabled={busy}>
                  {r}{busy ? " — Sedang dipakai" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-1">Jam Masuk</label>
          <div className="flex gap-2">
            <input value={time} onChange={(e) => setTime(e.target.value)} className="bg-gray-800 p-2 rounded flex-1" />
            <button type="button" onClick={() => {
              const d = new Date();
              setTime(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
            }} className="bg-blue-600 px-3 rounded">Sekarang</button>
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-1">Durasi</label>
          <div className="flex gap-2">
            <input type="number" min="0" value={hours} onChange={(e) => setHours(e.target.value)} className="w-1/2 bg-gray-800 p-2 rounded" placeholder="Jam" />
            <input type="number" min="0" max="59" value={minutes} onChange={(e) => setMinutes(e.target.value)} className="w-1/2 bg-gray-800 p-2 rounded" placeholder="Menit" />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-300 block mb-1">Jumlah Orang</label>
          <input type="number" min="1" value={people} onChange={(e) => setPeople(e.target.value)} className="w-full bg-gray-800 p-2 rounded" />
        </div>

        <div>
          <button type="submit" disabled={saving} className="w-full bg-green-600 p-3 rounded font-semibold">
            + Tambah Pemesanan
          </button>
        </div>

        <div className="text-sm text-pink-400 mt-6">
          <div className="font-semibold">Promo otomatis:</div>
          <ul className="text-xs mt-2 text-gray-300">
            <li>• 2 jam → +30 menit gratis</li>
            <li>• 3 jam → +1 jam gratis</li>
          </ul>
        </div>
      </form>
    </aside>
  );
}
