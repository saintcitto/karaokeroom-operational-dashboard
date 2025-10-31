// src/components/ExpiredList.jsx
import React from "react";
import { formatTime } from "../utils/helpers";

/**
 * Small helper to show duration like "1 Jam" or "1j 30m" fallback.
 * We keep it local so utils/helpers.js tidak perlu diubah.
 */
function niceDuration(totalMinutes = 0) {
  const h = Math.floor(totalMinutes / 60);
  const m = Math.round(totalMinutes % 60);
  if (h > 0 && m === 0) return `${h} Jam`;
  if (h > 0 && m > 0) return `${h} Jam ${m} m`;
  return `${m} m`;
}

export default function ExpiredList({ items = [] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return (
      <div className="p-6">
        <h3 className="text-2xl font-semibold mb-4">Waktu Habis</h3>
        <div className="text-center text-gray-500 mt-8">Belum ada pemesanan yang berstatus waktu habis.</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="text-2xl font-semibold mb-4">Waktu Habis</h3>

      <div className="overflow-x-auto bg-gray-800/60 border border-gray-700 rounded-lg">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="text-gray-400 bg-gray-900/40">
            <tr>
              <th className="py-3 px-4">Room</th>
              <th className="py-3 px-4">Jam Masuk</th>
              <th className="py-3 px-4">Durasi</th>
              <th className="py-3 px-4">Jam Habis</th>
              <th className="py-3 px-4">Jumlah Orang</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => {
              const start = b._start instanceof Date ? b._start : (b.startTime ? new Date(b.startTime) : null);
              const end = b._end instanceof Date ? b._end : (b.endTime ? new Date(b.endTime) : null);
              const durationMin = typeof b.durationMinutes === "number"
                ? b.durationMinutes
                : (start && end ? Math.max(0, Math.round((end - start) / 60000)) : 0);

              return (
                <tr key={b.id} className="border-t border-gray-700 hover:bg-gray-700/20">
                  <td className="py-3 px-4 font-medium text-white">{b.room ?? "-"}</td>
                  <td className="py-3 px-4">{start ? formatTime(start) : "--:--"}</td>
                  <td className="py-3 px-4">{niceDuration(durationMin)}</td>
                  <td className="py-3 px-4">{end ? formatTime(end) : "--:--"}</td>
                  <td className="py-3 px-4">{b.people ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
