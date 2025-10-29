import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { X } from "lucide-react";

export default function HistoryReportDashboard({ history, onClose }) {
  const today = new Date().toISOString().split("T")[0];

  const todayData = useMemo(() => {
    return history.filter((h) => h.finishedAt && h.finishedAt.startsWith(today));
  }, [history]);

  const shiftPagi = todayData.filter((h) => new Date(h.finishedAt).getHours() < 18);
  const shiftMalam = todayData.filter((h) => new Date(h.finishedAt).getHours() >= 18);

  const totalPagi = shiftPagi.reduce((sum, h) => sum + (h.totalPrice || 0), 0);
  const totalMalam = shiftMalam.reduce((sum, h) => sum + (h.totalPrice || 0), 0);
  const totalHarian = totalPagi + totalMalam;

  const kasirCount = {};
  todayData.forEach((h) => {
    const name = h.handledBy || "Tidak Diketahui";
    kasirCount[name] = (kasirCount[name] || 0) + 1;
  });

  const kasirData = Object.entries(kasirCount).map(([name, count]) => ({
    name,
    transaksi: count,
  }));

  const kasirAktif = Object.entries(kasirCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center border-b border-gray-700 pb-3">
        <h2 className="text-2xl font-bold text-white">📊 Laporan Harian</h2>
        <button
          onClick={onClose}
          className="text-red-400 hover:text-red-500 p-2 rounded-md bg-gray-800 hover:bg-gray-700"
        >
          <X />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800/70 p-4 rounded-xl shadow">
          <h3 className="text-gray-400 text-sm">Pendapatan Shift Pagi</h3>
          <p className="text-2xl font-bold text-green-400">Rp {totalPagi.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/70 p-4 rounded-xl shadow">
          <h3 className="text-gray-400 text-sm">Pendapatan Shift Malam</h3>
          <p className="text-2xl font-bold text-yellow-400">Rp {totalMalam.toLocaleString()}</p>
        </div>
        <div className="bg-gray-800/70 p-4 rounded-xl shadow">
          <h3 className="text-gray-400 text-sm">Total Pendapatan Hari Ini</h3>
          <p className="text-2xl font-bold text-blue-400">Rp {totalHarian.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-gray-800/60 p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold text-white mb-3">📈 Grafik Transaksi per Kasir</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={kasirData}>
            <XAxis dataKey="name" stroke="#ccc" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="transaksi" fill="#60a5fa" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="text-center text-gray-300 mt-6">
        🧾 Kasir paling aktif hari ini:{" "}
        <span className="font-semibold text-pink-400">{kasirAktif}</span>
      </div>
    </div>
  );
}
