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
          <X
