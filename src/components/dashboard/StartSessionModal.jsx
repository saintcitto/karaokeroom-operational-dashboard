import React, { useEffect, useRef, useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import Modal from "../ui/Modal";
import { useSession } from "../../context/SessionContext";

const timeNowParts = () => {
	const d = new Date();
	return {
		hh: String(d.getHours()).padStart(2, "0"),
		mm: String(d.getMinutes()).padStart(2, "0"),
	};
};

const parseHHMMPartsToTimestamp = (hh, mm) => {
	hh = String(hh || "").trim();
	mm = String(mm || "").trim();
	if (hh === "" || mm === "") return null;
	const h = Number(hh);
	const m = Number(mm);
	if (!Number.isFinite(h) || h < 0 || h > 23) return null;
	if (!Number.isFinite(m) || m < 0 || m > 59) return null;

	const now = new Date();
	return new Date(
		now.getFullYear(),
		now.getMonth(),
		now.getDate(),
		h,
		m,
		0,
		0
	).getTime();
};

const formatHHmmFromTs = (ts) => {
	if (!ts) return " - ";
	const d = new Date(ts);
	if (isNaN(d.getTime())) return " - ";
	return `${String(d.getHours()).padStart(2, "0")}:${String(
		d.getMinutes()
	).padStart(2, "0")}`;
};

const clamp = (v, min, max) => {
	const n = Number(v);
	if (!Number.isFinite(n)) return min;
	return Math.min(max, Math.max(min, n));
};

const StartSessionModal = ({ room, onClose }) => {
	const { startSession } = useSession();

	const now = timeNowParts();
	const [hh, setHh] = useState(now.hh);
	const [mm, setMm] = useState(now.mm);

	const hhRef = useRef(null);
	const mmRef = useRef(null);

	const [durationHours, setDurationHours] = useState(1);
	const [durationMinutes, setDurationMinutes] = useState(0);

	const [pax, setPax] = useState("1");

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");

	const [isValid, setIsValid] = useState(false);

	useEffect(() => {
		hhRef.current?.focus();
	}, []);

	const estimatedEndTs = (() => {
		const startTs = parseHHMMPartsToTimestamp(hh, mm);
		const totalMin =
			Math.max(0, Number(durationHours)) * 60 +
			Math.max(0, Number(durationMinutes));
		if (!startTs || totalMin <= 0) return null;
		return startTs + totalMin * 60 * 1000;
	})();

	const normalizeTwoDigits = (str) => {
		const s = String(str || "").replace(/[^\d]/g, "");
		if (!s) return "";
		if (s.length === 1) return `0${s}`;
		return s.slice(-2);
	};

	const resetError = () => setError("");

	useEffect(() => {
		const startTs = parseHHMMPartsToTimestamp(hh, mm);
		if (!startTs) {
			setIsValid(false);
			return;
		}

		const dh = Number(durationHours);
		const dm = Number(durationMinutes);
		const durationOk =
			(Number.isFinite(dh) && dh > 0) || (Number.isFinite(dm) && dm > 0);
		if (!durationOk) {
			setIsValid(false);
			return;
		}

		const paxNum = Number(pax);
		if (!Number.isFinite(paxNum) || paxNum <= 0 || !Number.isInteger(paxNum)) {
			setIsValid(false);
			return;
		}

		if (room?.capacity && paxNum > room.capacity) {
			setIsValid(false);
			return;
		}

		setIsValid(true);
	}, [hh, mm, durationHours, durationMinutes, pax, room]);

	const handlePasteHH = (e) => {
		const t = e.clipboardData.getData("text");
		const m = t.trim().match(/^(\d{1,2})[:\-]?(\d{2})$/);
		if (!m) return;
		e.preventDefault();
		setHh(normalizeTwoDigits(m[1]));
		setMm(normalizeTwoDigits(m[2]));
		setTimeout(() => mmRef.current?.focus?.(), 0);
	};

	const handlePasteMM = (e) => {
		const t = e.clipboardData.getData("text");
		const m = t.trim().match(/^(\d{1,2})[:\-]?(\d{2})$/);
		if (m) {
			e.preventDefault();
			setHh(normalizeTwoDigits(m[1]));
			setMm(normalizeTwoDigits(m[2]));
			return;
		}
	};

	const onHhChange = (e) => {
		const raw = e.target.value.replace(/[^\d]/g, "");
		const nv = raw.slice(0, 2);
		if (nv.length === 2) {
			const c = String(clamp(nv, 0, 23)).padStart(2, "0");
			setHh(c);
			setTimeout(() => mmRef.current?.focus(), 0);
		} else setHh(nv);
		resetError();
	};

	const onMmChange = (e) => {
		const raw = e.target.value.replace(/[^\d]/g, "");
		const nv = raw.slice(0, 2);
		if (nv.length === 2) {
			const c = String(clamp(nv, 0, 59)).padStart(2, "0");
			setMm(c);
		} else setMm(nv);
		resetError();
	};

	const onMmKey = (e) => {
		if (e.key === "Backspace" && mm.length === 0) {
			hhRef.current?.focus();
		}
	};

	const onHhKey = (e) => {
		if (e.key === "ArrowRight") mmRef.current?.focus();
	};

	const applyQuickDuration = (h, m) => {
		setDurationHours(h);
		setDurationMinutes(m);
		resetError();
	};

	const validateBeforeSubmit = () => {
		resetError();

		if (!hh || !mm) {
			setError("Masukkan waktu mulai lengkap (HH dan MM).");
			return false;
		}
		const h = Number(hh);
		const m = Number(mm);
		if (!Number.isFinite(h) || h < 0 || h > 23) {
			setError("Jam tidak valid (0–23).");
			return false;
		}
		if (!Number.isFinite(m) || m < 0 || m > 59) {
			setError("Menit tidak valid (0–59).");
			return false;
		}

		if (pax.trim() === "") {
			setError("Masukkan jumlah orang.");
			return false;
		}
		const paxNum = Number(pax);
		if (!Number.isFinite(paxNum) || paxNum <= 0 || !Number.isInteger(paxNum)) {
			setError("Jumlah orang harus angka positif.");
			return false;
		}
		if (room.capacity && paxNum > room.capacity) {
			setError(`Jumlah orang maksimal ${room.capacity}.`);
			return false;
		}

		const dh = Number(durationHours);
		const dm = Number(durationMinutes);
		if (!(dh > 0 || dm > 0)) {
			setError("Durasi harus lebih dari 0 menit.");
			return false;
		}

		const startTs = parseHHMMPartsToTimestamp(hh, mm);
		if (!startTs) {
			setError("Waktu mulai tidak valid.");
			return false;
		}

		return true;
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateBeforeSubmit()) return;
		if (!isValid) return;

		setLoading(true);

		try {
			const startTs = parseHHMMPartsToTimestamp(hh, mm);
			const totalMin = Number(durationHours) * 60 + Number(durationMinutes);

			await startSession(room.id, {
				startTime: startTs,
				durationMin: totalMin,
				pax: Number(pax),
			});

			onClose();
		} catch (err) {
			setError(err?.message || "Gagal membuat sesi.");
		}

		setLoading(false);
	};

	return (
		<Modal onClose={onClose} wide>
			<form
				onSubmit={handleSubmit}
				className="space-y-6 text-gray-900 dark:text-gray-100"
			>
				<div className="text-center">
					<h2 className="text-2xl font-bold">Start Session</h2>
					<p className="mt-1 text-sm text-gray-500">
						Ruangan: <b>{room?.name || room?.room_number}</b>
					</p>
				</div>

				<div className="grid items-end grid-cols-1 gap-4 lg:grid-cols-3">
					<div className="lg:col-span-2">
						<label className="block mb-1 text-sm font-medium">
							Waktu Mulai
						</label>

						<div className="flex items-center gap-3">
							<div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
								<input
									ref={hhRef}
									value={hh}
									onChange={onHhChange}
									onKeyDown={onHhKey}
									onPaste={handlePasteHH}
									maxLength={2}
									inputMode="numeric"
									className="w-10 font-mono text-sm text-center bg-transparent outline-none dark:text-white"
									placeholder="HH"
								/>
								<span className="text-gray-500">:</span>
								<input
									ref={mmRef}
									value={mm}
									onChange={onMmChange}
									onKeyDown={onMmKey}
									onPaste={handlePasteMM}
									maxLength={2}
									inputMode="numeric"
									className="w-10 font-mono text-sm text-center bg-transparent outline-none dark:text-white"
									placeholder="MM"
								/>
							</div>

							<button
								type="button"
								onClick={() => {
									const nowParts = timeNowParts();
									setHh(nowParts.hh);
									setMm(nowParts.mm);
									setTimeout(() => mmRef.current.focus(), 0);
								}}
								className="px-3 py-2 text-sm text-white bg-blue-500 rounded-lg hover:bg-blue-600"
							>
								Mulai Sekarang
							</button>

							<div className="w-40 ml-auto">
								<label className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
									Jumlah Orang
								</label>
								<input
									type="text"
									inputMode="numeric"
									value={pax}
									onChange={(e) => {
										setPax(e.target.value.replace(/[^\d]/g, ""));
										resetError();
									}}
									className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500"
									placeholder="1"
								/>
							</div>
						</div>
						<p className="mt-1 text-xs text-gray-400">
							Format 24 jam, contoh: 20:00
						</p>
					</div>

					<div>
						<label className="block mb-1 text-sm text-gray-600 dark:text-gray-400">
							Perkiraan selesai
						</label>
						<div className="px-3 py-3 text-center border border-gray-200 rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
							<div className="text-xs text-gray-400">
								Berdasarkan waktu & durasi
							</div>
							<div className="mt-1 text-lg font-semibold">
								{formatHHmmFromTs(estimatedEndTs)}
							</div>
						</div>
					</div>
				</div>

				<div>
					<label className="block mb-2 text-sm font-medium">Durasi</label>

					<div className="flex flex-wrap items-center gap-4">
						{/* Input Jam */}
						<div className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
							<button
								type="button"
								onClick={() => setDurationHours(Math.max(0, durationHours - 1))}
								className="p-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white transition"
							>
								<Minus size={16} />
							</button>
							<div className="w-16 px-4 text-center">
								<div className="text-lg font-semibold dark:text-white">
									{String(durationHours).padStart(2, "0")}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Jam
								</div>
							</div>
							<button
								type="button"
								onClick={() => setDurationHours(durationHours + 1)}
								className="p-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white transition"
							>
								<Plus size={16} />
							</button>
						</div>

						{/* Input Menit */}
						<div className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg dark:border-gray-600 dark:bg-gray-700">
							<button
								type="button"
								onClick={() =>
									setDurationMinutes(Math.max(0, durationMinutes - 5))
								}
								className="p-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white transition"
							>
								<Minus size={16} />
							</button>
							<div className="w-16 px-4 text-center">
								<div className="text-lg font-semibold dark:text-white">
									{String(durationMinutes).padStart(2, "0")}
								</div>
								<div className="text-xs text-gray-500 dark:text-gray-400">
									Menit
								</div>
							</div>
							<button
								type="button"
								onClick={() =>
									setDurationMinutes(Math.min(55, durationMinutes + 5))
								}
								className="p-1.5 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded text-gray-800 dark:text-white transition"
							>
								<Plus size={16} />
							</button>
						</div>

						<div className="flex items-center gap-2">
							<button
								type="button"
								onClick={() => applyQuickDuration(1, 0)}
								className="px-3 py-1 text-sm bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
							>
								1 Jam
							</button>
							<button
								type="button"
								onClick={() => applyQuickDuration(2, 0)}
								className="px-3 py-1 text-sm bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
							>
								2 Jam
							</button>
							<button
								type="button"
								onClick={() => applyQuickDuration(3, 0)}
								className="px-3 py-1 text-sm bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
							>
								3 Jam
							</button>
							<button
								type="button"
								onClick={() => applyQuickDuration(0, 30)}
								className="px-3 py-1 text-sm bg-gray-100 rounded dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200"
							>
								30m
							</button>
						</div>

						<div className="ml-auto text-sm">
							<div className="text-xs text-gray-400">Estimasi durasi</div>
							<div className="text-sm font-medium">
								{String(durationHours).padStart(2, "0")} jam{" "}
								{String(durationMinutes).padStart(2, "0")} menit
							</div>
						</div>
					</div>
				</div>

				{error && (
					<div className="p-3 text-sm text-red-700 border border-red-300 rounded-md bg-red-50">
						{error}
					</div>
				)}

				<div className="flex justify-end gap-3">
					<button
						type="button"
						onClick={onClose}
						className="px-4 py-2 bg-gray-100 rounded-lg dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
					>
						Batal
					</button>
					<button
						type="submit"
						disabled={!isValid || loading}
						className={`px-6 py-2 rounded-lg text-white font-semibold ${
							!isValid || loading
								? "bg-blue-300 cursor-not-allowed"
								: "bg-blue-500 hover:bg-blue-600"
						}`}
					>
						{loading ? "Membuat..." : "Start Session"}
					</button>
				</div>
			</form>
		</Modal>
	);
};

export default StartSessionModal;
