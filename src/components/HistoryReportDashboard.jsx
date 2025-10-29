import React, { useMemo } from "react";
import { Card, CardContent } from "./ui/card";
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

      const isShiftPagi = (hour > 9 && hour < 16) || (hour === 16 && minute < 45);
      const isShiftMalam = (hour > 16 || (hour === 16 && minute >= 45)) && hour <= 23;

      if (isShiftPagi) pagi += total;
      else if (isShiftMalam) malam += total;

      if (entry.handledBy) {
        kasirTotals[entry.handledBy] = (kasirTotals[entry.handledBy] || 0) + total;
      }
    });

    const kasirChart = Object.entries(kasirTotals).map(([kasir, total]) => ({
      kasir,
      total,
    }));

    return { pagi, malam, total: pagi + malam, kasirChart };
  }, [filtered]);

  return (
    <div className="flex flex-col gap-6 text-gray-100 font-sans">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-emerald-600/20 to-emerald-400/10 border border-emerald-500/40 p-5 backdrop-blur-sm">
          <CardContent>
            <p className="text-sm text-gray-400">Pendapatan Shift Pagi (10.00–16.44)</p>
            <h2 className="text-2xl font-bold text-emerald-400 mt-1">
              Rp {shiftData.pagi.toLocaleString("id-ID")}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600/20 to-fuchsia-500/10 border border-indigo-500/40 p-5 backdrop-blur-sm">
          <CardContent>
            <p className="text-sm text-gray-400">Pendapatan Shift Malam (16.45–00.00)</p>
            <h2 className="text-2xl font-bold text-indigo-400 mt-1">
              Rp {shiftData.malam.toLocaleString("id-ID")}
            </h2>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-700/40 to-gray-900/40 border border-gray-600/40 p-5 backdrop-blur-sm">
          <CardContent>
            <p className="text-sm text-gray-400">Total Pendapatan Hari Ini</p>
            <h2 className="text-2xl font-bold text-yellow-400 mt-1">
              Rp {shiftData.total.toLocaleString("id-ID")}
            </h2>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800/70 border border-gray-700/50 rounded-xl backdrop-blur-md shadow-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Grafik Transaksi per Kasir</h3>
          {shiftData.kasirChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={shiftData.kasirChart}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                barGap={14}
              >
                <XAxis
                  dataKey="kasir"
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={{ stroke: "#4b5563" }}
                />
                <YAxis
                  stroke="#9ca3af"
                  tickLine={false}
                  axisLine={{ stroke: "#4b5563" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#111827",
                    border: "1px solid #374151",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  cursor={{ fill: "rgba(167,139,250,0.08)" }}
                />
                <Bar
                  dataKey="total"
                  fill="url(#colorGradient)"
                  radius={[8, 8, 0, 0]}
                  barSize={42}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-sm text-center">Belum ada transaksi untuk hari ini.</p>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-800/70 border border-gray-700/50 rounded-xl backdrop-blur-md shadow-md">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-100">Aktivitas Pemesanan Hari Ini</h3>
          {filtered.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
              {filtered.map((entry) => {
                const t = new Date(entry.finishedAt);
                const time = t.toLocaleTimeString("id-ID", {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center bg-gray-900/50 px-4 py-3 rounded-lg border border-gray-700/40 hover:bg-gray-900/70 transition-all duration-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-white">{entry.room}</p>
                      <p className="text-xs text-gray-400">
                        Kasir: <span className="text-gray-300">{entry.handledBy}</span> • Rp{" "}
                        {entry.totalPrice.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500">{time}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center">Belum ada aktivitas pemesanan hari ini.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
