import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function HistoryReportDashboard({ history = [] }) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return history
      .map((h) => {
        const start = h.startTime ? new Date(h.startTime) : h.startTime;
        const end = h.endTime ? new Date(h.endTime) : h.endTime;
        const finishedAt = h.finishedAt ? new Date(h.finishedAt) : new Date();
        return { ...h, _start: start, _end: end, _finishedAt: finishedAt };
      })
      .filter((item) => {
        const f = item._finishedAt;
        if (!f) return false;
        if (!f.toISOString().startsWith(todayStr)) return false;
        if (!item._start || !item._end) return false;
        const durationMs = Math.abs(item._end - item._start);
        const durationHours = Math.round(durationMs / 3600000);
        return durationHours >= 1 && durationHours <= 5;
      });
  }, [history, todayStr]);

  const shiftData = useMemo(() => {
    let pagi = 0;
    let malam = 0;
    const kasirTotals = {};
    filtered.forEach((entry) => {
      const finishTime = entry._finishedAt;
      const hour = finishTime.getHours();
      const minute = finishTime.getMinutes();
      const total = parseInt(entry.totalPrice || entry.total || 0, 10) || 0;
      const isShiftPagi = (hour > 9 && hour < 16) || (hour === 16 && minute < 45);
      const isShiftMalam = (hour > 16 || (hour === 16 && minute >= 45)) && hour <= 23;
      if (isShiftPagi) pagi += total;
      else if (isShiftMalam) malam += total;
      if (entry.handledBy) kasirTotals[entry.handledBy] = (kasirTotals[entry.handledBy] || 0) + total;
    });
    const kasirChart = Object.entries(kasirTotals).map(([kasir, total]) => ({ kasir, total }));
    return { pagi, malam, total: pagi + malam, kasirChart };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6 text-gray-100">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-700/10 to-emerald-500/6 border border-green-500/20 rounded-xl p-5">
          <p className="text-sm text-gray-400">Pendapatan Shift Pagi (10.00 - 16.44)</p>
          <h2 className="text-2xl font-bold text-green-400 mt-1">Rp {shiftData.pagi.toLocaleString("id-ID")}</h2>
        </div>

        <div className="bg-gradient-to-r from-indigo-700/10 to-fuchsia-500/6 border border-indigo-500/20 rounded-xl p-5">
          <p className="text-sm text-gray-400">Pendapatan Shift Malam (16.45 - 00.00)</p>
          <h2 className="text-2xl font-bold text-indigo-400 mt-1">Rp {shiftData.malam.toLocaleString("id-ID")}</h2>
        </div>

        <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-5">
          <p className="text-sm text-gray-400">Total Pendapatan Hari Ini</p>
          <h2 className="text-2xl font-bold text-yellow-400 mt-1">Rp {shiftData.total.toLocaleString("id-ID")}</h2>
        </div>
      </div>

      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Grafik Transaksi per Kasir</h3>
        {shiftData.kasirChart.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={shiftData.kasirChart}>
              <XAxis dataKey="kasir" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid #374151",
                  borderRadius: "8px",
                  color: "#fff"
                }}
              />
              <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-400 text-sm text-center">Belum ada transaksi untuk hari ini.</p>
        )}
      </div>

      <div className="bg-gray-800/60 border border-gray-700/40 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-100">Aktivitas Pemesanan Hari Ini</h3>
        {filtered.length > 0 ? (
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {filtered.map((entry) => {
              const t = new Date(entry._finishedAt);
              const time = t.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
              const price = parseInt(entry.totalPrice || entry.total || 0, 10) || 0;
              return (
                <div key={entry.id || entry._finishedAt.getTime()} className="flex justify-between items-center bg-gray-900/60 px-4 py-3 rounded-lg border border-gray-700/50 hover:bg-gray-900/80 transition-all">
                  <div>
                    <p className="text-sm font-medium text-white">{entry.room}</p>
                    <p className="text-xs text-gray-400">Kasir: {entry.handledBy || "-"} • Rp {price.toLocaleString("id-ID")}</p>
                  </div>
                  <span className="text-xs text-gray-500">{time}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-400 text-sm text-center">Belum ada aktivitas pemesanan hari ini.</p>
        )}
      </div>
    </div>
  );
}
