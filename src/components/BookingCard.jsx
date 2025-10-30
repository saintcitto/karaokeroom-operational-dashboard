import React, { useEffect, useMemo, useState } from 'react';

function formatCurrency(n) {
  try {
    return n.toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
  } catch {
    return 'Rp 0';
  }
}

function secondsToHMS(sec) {
  if (typeof sec !== 'number' || isNaN(sec)) sec = 0;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

export default function BookingCard({ booking = {}, onCancel = () => {}, pricing = { ratePer30Min: 22500 }, promotions = { 120:30, 180:60 } }) {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const computeRemaining = () => {
      const now = new Date();
      const end = booking.end ? new Date(booking.end) : null;
      const sec = end ? Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000)) : 0;
      setRemaining(sec);
    };
    computeRemaining();
    const t = setInterval(computeRemaining, 1000);
    return () => clearInterval(t);
  }, [booking.end]);

  const durationMinutes = booking.durationMinutes || (() => {
    if (booking.start && booking.end) {
      const s = new Date(booking.start); const e = new Date(booking.end);
      return Math.max(0, Math.round((e - s) / 60000));
    }
    return 0;
  })();

  const bonusMinutes = useMemo(() => {
    const keys = Object.keys(promotions || {}).map(k => parseInt(k,10)).filter(Boolean);
    for (let k of keys.sort((a,b)=>b-a)) {
      if (durationMinutes >= k) return promotions[k] || 0;
    }
    return 0;
  }, [durationMinutes, promotions]);

  const totalMinutesWithBonus = durationMinutes + bonusMinutes;

  const subtotal = useMemo(() => {
    const unit = pricing.ratePer30Min || 0;
    const blocks = Math.ceil(totalMinutesWithBonus / 30);
    return blocks * unit;
  }, [totalMinutesWithBonus, pricing]);

  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 shadow-sm w-full">
      <div className="flex justify-between items-start mb-3">
        <div className="text-lg font-semibold"> {booking.room || '—'} </div>
        <div className="text-sm text-gray-300">{(durationMinutes) ? `${durationMinutes} menit` : ''}</div>
      </div>
      <div className="text-sm text-gray-400 mb-4">
        <div>{booking.start ? new Date(booking.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'} — {booking.end ? new Date(booking.end).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '--'}</div>
        <div className="mt-2">👥 {booking.people || 0} orang</div>
        <div>Kasir: {booking.cashier || 'Tidak Diketahui'}</div>
        {bonusMinutes > 0 && <div className="text-green-400 mt-2">Bonus: +{bonusMinutes} menit</div>}
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-400 mb-2">Sisa Waktu:</div>
        <div className="flex items-center justify-between">
          <div className="flex-1 h-2 bg-gray-700 rounded-full mr-4 overflow-hidden">
            <div style={{width: `${Math.max(0, Math.min(100, (totalMinutesWithBonus - remaining/60) / totalMinutesWithBonus * 100 || 0))}%`}} className="h-full bg-gradient-to-r from-green-400 to-green-600"></div>
          </div>
          <div className="text-green-400 monospace text-sm">{secondsToHMS(remaining)}</div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div>
          <div className="text-xs text-gray-400">Subtotal:</div>
          <div className="text-lg font-semibold text-green-400">{formatCurrency(subtotal)}</div>
        </div>
        <button onClick={() => onCancel(booking.id)} className="px-4 py-2 bg-red-600 text-white rounded-lg">Batalkan</button>
      </div>
    </div>
  );
}
