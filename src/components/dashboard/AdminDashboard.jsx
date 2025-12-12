import React, { useEffect, useMemo, useState } from "react";
import { useSession } from "../../context/SessionContext";
import { formatTime, formatTimer } from "../../utils/format";
import { Calendar, Search, X, Filter } from "lucide-react"; // Tambah Icon

const SUPABASE_URL = "https://lweccpjfvprvsjebxvts.supabase.co";
const SUPABASE_ANON_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3ZWNjcGpmdnBydnNqZWJ4dnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM2OTQyODcsImV4cCI6MjA3OTI3MDI4N30.kb0TVdhbF3RiMLSZieQ1aoMWad5V3ynSZLUQnC7TwkA";

// Helper: Format Durasi
const formatDuration = (msOrMinutes) => {
	if (msOrMinutes == null) return "-";
	let totalMinutes;
	if (Math.abs(msOrMinutes) > 1000) {
		totalMinutes = Math.round(msOrMinutes / (60 * 1000));
	} else {
		totalMinutes = Math.round(Number(msOrMinutes) || 0);
	}
	if (totalMinutes <= 0) return "0 Menit";
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	if (hours > 0 && minutes > 0) return `${hours} Jam ${minutes} Menit`;
	else if (hours > 0) return `${hours} Jam`;
	else return `${minutes} Menit`;
};

// Helper: Format Tanggal Cantik
const formatDateTime = (isoString) => {
	if (!isoString) return "-";
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return "-";
	return new Intl.DateTimeFormat("id-ID", {
		day: "2-digit",
		month: "short",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: false,
	}).format(date);
};

// Helper: Format Created At
const formatCreatedAt = (isoString) => {
	if (!isoString) return "-";
	const date = new Date(isoString);
	if (isNaN(date.getTime())) return "-";
	const day = String(date.getDate()).padStart(2, "0");
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const year = date.getFullYear();
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

const ucfirst = (str = "") =>
	str ? str.charAt(0).toUpperCase() + str.slice(1) : "-";

const AdminDashboard = () => {
	const { sessions, rooms, now } = useSession();
	const [filter, setFilter] = useState("all");
	const [viewMode, setViewMode] = useState("active");
	const [historyRaw, setHistoryRaw] = useState([]);

	// STATE BARU: Date Range Filter
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	useEffect(() => {
		if (viewMode !== "history") return;
		let cancelled = false;
		const loadHistory = async () => {
			try {
				// Kita ambil data agak banyak biar filter di client side enak
				const url = `${SUPABASE_URL}/rest/v1/session_history?select=*&order=created_at.desc&limit=1000`;
				const res = await fetch(url, {
					headers: {
						apikey: SUPABASE_ANON_KEY,
						Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
						"Content-Type": "application/json",
					},
				});
				if (!res.ok) return;
				const data = await res.json();
				if (!cancelled) setHistoryRaw(Array.isArray(data) ? data : []);
			} catch (e) {
				console.error(e);
			}
		};
		loadHistory();
		const interval = setInterval(loadHistory, 5000);
		return () => {
			cancelled = true;
			clearInterval(interval);
		};
	}, [viewMode]);

	// LOGIKA FILTER TANGGAL
	const isWithinDateRange = (dateString) => {
		if (!startDate && !endDate) return true; // Tidak ada filter
		if (!dateString) return false;

		const targetDate = new Date(dateString);
		targetDate.setHours(0, 0, 0, 0); // Normalisasi ke jam 00:00

		if (startDate) {
			const start = new Date(startDate);
			start.setHours(0, 0, 0, 0);
			if (targetDate < start) return false;
		}

		if (endDate) {
			const end = new Date(endDate);
			end.setHours(23, 59, 59, 999); // Sampai akhir hari
			if (targetDate > end) return false;
		}

		return true;
	};

	const activeRows = useMemo(() => {
		if (viewMode !== "active") return [];
		const sessArray = Array.isArray(sessions)
			? sessions
			: Object.values(sessions || {});

		return sessArray
			.map((s) => {
				const startRaw = s.start_time ?? s.startTime;
				const endRaw = s.end_time ?? s.endTime;
				const durMin =
					s.duration_min ?? s.durationMin ?? s.duration ?? s.durationMinutes;
				const roomObj = rooms?.find((r) => r.id === (s.room_id ?? s.roomId));
				return {
					...s,
					roomName:
						roomObj?.name ||
						roomObj?.room_number ||
						`KTV ${s.room_id ?? s.roomId ?? "-"}`,
					startRaw,
					endRaw,
					durMin,
				};
			})
			.filter((s) => {
				if (!s) return false;
				// Filter Status Dropdown
				if (
					filter !== "all" &&
					String(s.status || "").toLowerCase() !==
						String(filter || "").toLowerCase()
				) {
					return false;
				}
				// Filter Tanggal
				return isWithinDateRange(s.startRaw);
			})
			.sort((a, b) => {
				const aStart = a.startRaw ? Date.parse(a.startRaw) : 0;
				const bStart = b.startRaw ? Date.parse(b.startRaw) : 0;
				return aStart - bStart;
			});
	}, [sessions, rooms, filter, viewMode, startDate, endDate]);

	const historyRows = useMemo(() => {
		if (viewMode !== "history") return [];
		if (!historyRaw || historyRaw.length === 0) return [];

		return historyRaw
			.map((h) => {
				let payload = {};
				try {
					payload = h.payload || {};
				} catch (e) {
					payload = {};
				}

				const roomId = h.room_id ?? payload.room_id ?? null;
				const roomObj = rooms?.find((r) => r.id === roomId);
				const startRaw =
					payload.start_time ?? h.start_time ?? h.created_at ?? null;
				const endRaw = payload.end_time ?? null;
				const durMin = payload.duration_min ?? payload.duration ?? null;
				const startTs = startRaw ? Date.parse(startRaw) : null;
				const endTs = endRaw ? Date.parse(endRaw) : null;

				return {
					...h,
					roomName:
						roomObj?.name ||
						roomObj?.room_number ||
						(roomId ? `KTV ${roomId}` : "-"),
					startRaw,
					endRaw,
					startTs,
					endTs,
					durMin,
					payload,
				};
			})
			.filter((h) => {
				// Filter Tanggal untuk History (Cek berdasarkan Created At atau Start Time)
				const checkDate = h.created_at || h.startRaw;
				return isWithinDateRange(checkDate);
			});
	}, [historyRaw, rooms, viewMode, startDate, endDate]);

	return (
		<div className="p-6 space-y-6">
			{/* HEADER */}
			<div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
				<h1 className="text-3xl font-bold text-gray-800 dark:text-white">
					Admin Dashboard
				</h1>

				<div className="flex items-center p-1 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-xl dark:border-gray-700">
					<button
						onClick={() => setViewMode("active")}
						className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
							viewMode === "active"
								? "bg-blue-500 text-white shadow-md"
								: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
					>
						Active Sessions
					</button>
					<button
						onClick={() => setViewMode("history")}
						className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
							viewMode === "history"
								? "bg-blue-500 text-white shadow-md"
								: "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
						}`}
					>
						History Logs
					</button>
				</div>
			</div>

			{/* SEARCH & FILTER BAR (DESAIN BARU) */}
			<div className="flex flex-col items-center gap-4 p-4 bg-white border border-gray-200 shadow-sm dark:bg-gray-800 rounded-2xl dark:border-gray-700 md:flex-row">
				{/* Status Filter (Hanya untuk Active View) */}
				{viewMode === "active" && (
					<div className="relative min-w-[150px]">
						<Filter
							className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2"
							size={16}
						/>
						<select
							value={filter}
							onChange={(e) => setFilter(e.target.value)}
							className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-200 appearance-none cursor-pointer"
						>
							<option value="all">Semua Status</option>
							<option value="ongoing">Sedang Berjalan</option>
							<option value="scheduled">Terjadwal</option>
							<option value="expired">Waktu Habis</option>
						</select>
					</div>
				)}

				{/* Date Range Picker (Ala Search Bar) */}
				<div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1.5 w-full">
					<div className="flex items-center flex-1 gap-2 px-3 py-1 border-r border-gray-200 dark:border-gray-700">
						<Calendar size={16} className="text-gray-400" />
						<div className="flex flex-col">
							<span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
								Dari Tanggal
							</span>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full p-0 text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer dark:text-gray-200"
							/>
						</div>
					</div>

					<div className="flex items-center flex-1 gap-2 px-3 py-1">
						<div className="flex flex-col w-full">
							<span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
								Sampai Tanggal
							</span>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full p-0 text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer dark:text-gray-200"
							/>
						</div>
					</div>

					{(startDate || endDate) && (
						<button
							onClick={() => {
								setStartDate("");
								setEndDate("");
							}}
							className="p-2 text-gray-500 transition rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
							title="Reset Filter"
						>
							<X size={18} />
						</button>
					)}

					<div className="bg-blue-500 p-2.5 rounded-lg text-white shadow-sm flex items-center justify-center">
						<Search size={18} />
					</div>
				</div>

				<div className="px-2 text-sm text-gray-500 whitespace-nowrap">
					Total:{" "}
					<b>
						{viewMode === "active" ? activeRows.length : historyRows.length}
					</b>{" "}
					Data
				</div>
			</div>

			{/* TABLE CONTENT */}
			<div className="overflow-hidden bg-white border border-gray-100 shadow-lg dark:bg-gray-800 rounded-2xl dark:border-gray-700">
				<div className="overflow-x-auto">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead className="bg-gray-50 dark:bg-gray-700/50">
							<tr>
								{viewMode === "active" ? (
									<>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Ruangan
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Status
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Mulai
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Durasi
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Sisa
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Selesai
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Pax
										</th>
									</>
								) : (
									<>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											ID
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Ruangan
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Event
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Mulai
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Selesai
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Durasi
										</th>
										<th className="px-6 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">
											Created At
										</th>
									</>
								)}
							</tr>
						</thead>

						<tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
							{/* LOGIC DATA ACTIVE */}
							{viewMode === "active" &&
								activeRows.length > 0 &&
								activeRows.map((s) => {
									const startTs = s.startRaw ? Date.parse(s.startRaw) : null;
									const endTs = s.endRaw ? Date.parse(s.endRaw) : null;
									const durMinutesFromField = Number(s.durMin) || null;
									let computedEndTs = endTs;
									if (!computedEndTs && startTs && durMinutesFromField) {
										computedEndTs = startTs + durMinutesFromField * 60 * 1000;
									}
									let durationDisplay = "-";
									if (durMinutesFromField)
										durationDisplay = formatDuration(durMinutesFromField);
									else if (startTs && computedEndTs)
										durationDisplay = formatDuration(computedEndTs - startTs);

									const remainingMs = computedEndTs
										? Math.max(0, computedEndTs - now)
										: null;
									const statusLower = String(s.status || "").toLowerCase();
									const remainingDisplay =
										statusLower === "ongoing" && remainingMs != null
											? formatTimer(remainingMs)
											: statusLower === "expired"
											? formatTimer(0)
											: "-";

									return (
										<tr
											key={s.id}
											className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
										>
											<td className="px-6 py-4 font-medium dark:text-white">
												{s.roomName}
											</td>
											<td className="px-6 py-4 text-sm font-semibold">
												<span
													className={`px-2.5 py-1 rounded-md ${
														statusLower === "ongoing"
															? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
															: statusLower === "expired"
															? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
															: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
													}`}
												>
													{ucfirst(s.status)}
												</span>
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
												{formatTime(startTs || s.startRaw)}
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
												{durationDisplay}
											</td>
											<td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">
												{remainingDisplay}
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
												{formatTime(computedEndTs || s.endRaw)}
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
												{s.pax}
											</td>
										</tr>
									);
								})}

							{/* LOGIC DATA HISTORY */}
							{viewMode === "history" &&
								historyRows.length > 0 &&
								historyRows.map((h) => {
									const durMinutesFromField = Number(h.durMin) || null;
									let durationDisplay = "-";
									if (durMinutesFromField)
										durationDisplay = formatDuration(durMinutesFromField);
									else if (h.startTs && h.endTs)
										durationDisplay = formatDuration(h.endTs - h.startTs);
									const timestamp = h.created_at || h.startTs;

									return (
										<tr
											key={h.id}
											className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50"
										>
											<td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
												#{h.id}
											</td>
											<td className="px-6 py-4 font-medium dark:text-white">
												{h.roomName}
											</td>
											<td className="px-6 py-4">
												<span
													className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
														h.event_type === "completed"
															? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
															: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
													}`}
												>
													{ucfirst(h.event_type)}
												</span>
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
												{formatDateTime(h.payload?.start_time)}
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">
												{formatDateTime(h.payload?.end_time)}
											</td>
											<td className="px-6 py-4 text-gray-600 dark:text-gray-300">
												{durationDisplay}
											</td>
											<td className="px-6 py-4 font-mono text-xs text-gray-600 dark:text-gray-300 whitespace-nowrap">
												{formatCreatedAt(timestamp)}
											</td>
										</tr>
									);
								})}

							{/* EMPTY STATE */}
							{((viewMode === "active" && activeRows.length === 0) ||
								(viewMode === "history" && historyRows.length === 0)) && (
								<tr>
									<td colSpan={7} className="px-6 py-16 text-center">
										<div className="flex flex-col items-center justify-center text-gray-400">
											<Search size={48} className="mb-4 opacity-20" />
											<p className="text-lg font-medium">
												Tidak ada data ditemukan
											</p>
											<p className="text-sm opacity-70">
												Coba ubah filter tanggal atau status.
											</p>
										</div>
									</td>
								</tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
};

export default AdminDashboard;
