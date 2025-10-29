import React, { useMemo } from "react";

export default function HistoryReportDashboard({ history = [], onClose }) {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const todayData = useMemo(() => {
    return history.filter((item) => {
      const date = item.finishedAt ? item.finishedAt.slice(0, 10) : null;
      return date === todayStr;
    });
  }, [history, todayStr]);

  const calcShift = (start, end) => {
    return todayData.filter((b) => {
      const time = new Date(b.finishedAt);
      const hour = time.getHours();
      return hour >= start && hour <= end;
    });
  };

  const morningShift = calcShift(0, 17);
  const nightShift = calcShift(18, 23);

  const sum = (data) =>
    data.reduce((acc, b) => acc + (parseInt(b.totalPrice || 0) || 0), 0);

  const totalToday = sum(todayData);
  const totalMorning = sum(morningShift);
  const totalNight = sum(nightShift);

  const cashierSummary = useMemo(() => {
    const grouped = {};
    todayData.forEach((b) => {
      const name = b.handledBy || "Unknown";
      if (!grouped[name]) grouped[name] = 0;
      grouped[name] += parseInt(b.totalPrice || 0) || 0;
    });
    return grouped;
  }, [todayData]);

  return (
    <div className="p-6 text-white min-h-screen bg-gray-900">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">📊 Laporan Harian</h2>
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md text-white font-semibold"
        >
          Kembali
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-green-700/40 border border-green-600 rounded-lg p-4">
          <p className="text-sm text-gray-300">Total Pendapatan Hari Ini</p>
          <h3 className="text-3xl font-bold text-green-400 mt-2">
            Rp{totalToday.toLocaleString("id-ID")}
          </h3>
        </div>
        <div className="bg-blue-700/40 border border-blue-600 rounded-lg p-4">
          <p className="text-sm text-gray-300">Shift Pagi (00:00–17:59)</p>
          <h3 className="text-3xl font-bold text-blue-400 mt-2">
            Rp{totalMorning.toLocaleString("id-ID")}
          </h3>
        </div>
        <div className="bg-purple-700/40 border border-purple-600 rounded-lg p-4">
          <p className="text-sm text-gray-300">Shift Malam (18:00–23:59)</p>
          <h3 className="text-3xl font-bold text-purple-400 mt-2">
            Rp{totalNight.toLocaleString("id-ID")}
          </h3>
        </div>
      </div>

      <h3 className="text-xl font-semibold mb-3">Pendapatan per Kasir</h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {Object.entries(cashierSummary).map(([name, total]) => (
          <div
            key={name}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <p className="text-gray-300">{name}</p>
            <h4 className="text-2xl font-bold text-yellow-400 mt-1">
              Rp{total.toLocaleString("id-ID")}
            </h4>
          </div>
        ))}
      </div>

      <h3 className="text-xl font-semibold mb-3">Riwayat Transaksi Hari Ini</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-700">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-4 py-2">Waktu</th>
              <th className="px-4 py-2">Ruangan</th>
              <th className="px-4 py-2">Durasi</th>
              <th className="px-4 py-2">Total</th>
              <th className="px-4 py-2">Kasir</th>
            </tr>
          </thead>
          <tbody>
            {todayData.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-gray-400">
                  Belum ada transaksi hari ini
                </td>
              </tr>
            ) : (
              todayData
                .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt))
                .map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-700 hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-2">
                      {new Date(item.finishedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-2">{item.room}</td>
                    <td className="px-4 py-2">
                      {Math.floor(item.duration / 60)}j{" "}
                      {item.duration % 60}m
                    </td>
                    <td className="px-4 py-2 text-green-400 font-semibold">
                      Rp{(item.totalPrice || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-2">{item.handledBy}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
