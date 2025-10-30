import React from 'react';
import BookingCard from './BookingCard';

export default function BookingGrid({ bookings = [], onCancel = () => {}, filter = 'active', pricing, promotions }) {
  const list = Array.isArray(bookings) ? bookings : [];
  const filtered = list.filter(b => {
    if (!b) return false;
    const now = new Date();
    const end = b.end ? new Date(b.end) : null;
    if (filter === 'expired') return end && end.getTime() <= now.getTime();
    if (filter === 'ending') return end && (end.getTime() - now.getTime()) <= (30*60*1000) && end.getTime() > now.getTime();
    return end && end.getTime() > now.getTime();
  });

  if (filtered.length === 0) {
    return (
      <div className="flex-1 p-6">
        <h3 className="text-2xl font-semibold mb-4">Pemesanan Aktif</h3>
        <div className="text-center text-gray-500 mt-20">Belum ada pemesanan aktif.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
      {filtered.map(b => (
        <BookingCard key={b.id} booking={b} onCancel={onCancel} pricing={pricing} promotions={promotions} />
      ))}
    </div>
  );
}
