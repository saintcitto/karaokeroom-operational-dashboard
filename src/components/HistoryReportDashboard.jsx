import React, { useMemo } from "react";
import { Card, CardContent } from "./components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function HistoryReportDashboard({ history = [] }) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const finishDate = new Date(item.finishedAt);
      return finishDate.toISOString().startsWith(todayStr);
    });
  }, [history, todayStr]);

  const shiftData = useMemo(() => {
    let pagi = 0;
    let malam = 0;
    let kasirTotals = {};

    filtered.forEach((entry) => {
      const finishTime = new Date(entry.finishedAt);
      const hour = finishTime.getHours();
      const minute = finishTime.getMinutes();
      const total = parseInt(entry.totalPrice) || 0;

      
      const isShiftPagi =
        (hour > 9 && hour < 16) || (hour === 16 && minute < 45);
      const isShiftMalam =
        (hour > 16 || (hour === 16 && minute >= 45)) && hour <= 23;

      if (isShiftPagi) pagi += total;
      else if (isShiftMalam) malam += total;

      // Kasir
      if (entry.handledBy) {
        kasirTotals[entry.handledBy] =
          (kasirTotals[entry.handledBy] || 0) + total;
      }
    });

    const kasirChart = Object.entries(kasirTotals).map(([kasir, total]) => ({
      kasir,
      total,
    }));

    return { pagi, malam, total: pagi + malam, kasirChart };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6 text-gray-100">
      {/* --- SHIFT SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-green-700/20 to-emerald-500/10 border border-green-500/40 rounded-xl backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-400">Pendapatan Shift Pagi (10.00 - 16.44)</p>
            <h2 className="text-2xl font-bold text-green-400 mt-1">
              Rp {shiftData.pagi.toLocaleString("id-ID")}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-700/20 to-fuchsia-500/10 border border-indigo-500/40 rounded-xl backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-400">Pendapatan Shift Malam (16.45 - 00.00)</p>
            <h2 className="text-2xl font-bold text-indigo-400 mt-1">
              Rp {shiftData.malam.toLocaleString("id-ID")}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-700/50 to-gray-800/30 border border-gray-600/40 rounded-xl backdrop-blur-sm">
          <CardContent className="p-5">
            <p className="text-sm text-gray-400">Total Pendapatan Hari Ini</p>
            <h2 className="text-2xl font-bold text-yellow-400 mt-1">
              Rp {shiftData.total.toLocaleString("id-ID")}
            </h2>
          </CardContent>
        </Card>
      </div>

      {}
      <Card className="bg-gray-800/70 border border-gray-700/50 rounded-xl backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">
            Grafik Transaksi per Kasir
          </h3>
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
                    color: "#fff",
                  }}
                />
                <Bar dataKey="total" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center">
              Belum ada transaksi untuk hari ini.
            </p>
          )}
        </CardContent>
      </Card>

      {}
      <Card className="bg-gray-800/70 border border-gray-700/50 rounded-xl backdrop-blur-sm">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">
            Aktivitas Pemesanan Hari Ini
          </h3>
          {filtered.length > 0 ? (
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {filtered.map((entry) => {
                const t = new Date(entry.finishedAt);
                const time = t.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center bg-gray-900/60 px-4 py-3 rounded-lg border border-gray-700/50 hover:bg-gray-900/80 transition-all"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">
                        {entry.room}
                      </p>
                      <p className="text-xs text-gray-400">
                        Kasir: {entry.handledBy} • Rp{" "}
                        {entry.totalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{time}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center">
              Belum ada aktivitas pemesanan hari ini.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
