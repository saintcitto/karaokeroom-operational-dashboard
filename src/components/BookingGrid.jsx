import React from 'react';
import { Info } from 'lucide-react';
import BookingGridHeader from './BookingGridHeader';
import BookingCard from './BookingCard';

const BookingGrid = ({ bookings = [], now = new Date(), onExpire, onCancelBooking, stats = {} }) => {
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safeStats = typeof stats === 'object' && stats !== null
    ? stats
    : { active: 0, warning: 0, expired: 0 };

  return (
    <div className="p-6 h-full flex flex-col">
      <h2 className="text-2xl font-bold mb-6 text-white">Pemesanan Aktif</h2>
      <BookingGridHeader stats={safeStats} />
      {safeBookings.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Info size={48} className="mx-auto mb-2" />
            <p>Belum ada pemesanan aktif.</p>
          </div>
        </div>
      ) : (
        <div
          className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pr-1"
          style={{ scrollbarGutter: 'stable' }}
        >
          {safeBookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              now={now}
              onExpire={onExpire}
              onCancel={onCancelBooking}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingGrid;
