import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Hourglass, Power } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { useToast } from "../../context/ToastContext";
import { formatTimer } from "../../utils/format";
import StartSessionModal from "./StartSessionModal";
import SessionControlView from "./SessionControlView";
import Modal from "../ui/Modal";

const CardTimer = ({ session, now }) => {
	const [displayTime, setDisplayTime] = useState("");

	useEffect(() => {
		if (!session) {
			setDisplayTime("");
			return;
		}

		const safeDate = (v) => {
			if (!v) return null;
			const d = new Date(v);
			return isNaN(d.getTime()) ? null : d;
		};

		const startDate = safeDate(session.start_time);
		const endDate = safeDate(session.end_time);

		if (!startDate && !endDate) {
			setDisplayTime("");
			return;
		}

		const update = () => {
			const nowTs = Date.now();
			const st = (session.status || "").toString().toLowerCase();
			if (st === "ongoing") {
				if (!endDate) {
					setDisplayTime("");
					return;
				}
				const msLeft = Math.max(0, endDate.getTime() - nowTs);
				setDisplayTime(formatTimer(msLeft));
			} else if (st === "scheduled") {
				if (!startDate) {
					setDisplayTime("");
					return;
				}
				const msLeft = Math.max(0, startDate.getTime() - nowTs);
				setDisplayTime("Starts in " + formatTimer(msLeft));
			} else {
				setDisplayTime("");
			}
		};

		update();
		const id = setInterval(update, 1000);
		return () => clearInterval(id);
	}, [session, now]);

	if (!displayTime) return null;

	return (
		<div className="flex items-center mt-2 text-sm text-gray-700 dark:text-gray-300">
			<Hourglass size={14} className="mr-2" />
			<span className="inline-block w-24 font-mono text-left tabular-nums">
				{displayTime}
			</span>
		</div>
	);
};

const RoomCard = React.memo(({ room }) => {
	const { sessions, now, endSession } = useSession();
	const { addToast } = useToast();
	const [modal, setModal] = useState(null);
	const [isEnding, setIsEnding] = useState(false);

	const session = sessions?.[room?.id] ?? null;

	const getStatus = () => {
		if (!session)
			return { type: "available", color: "bg-green-500", label: "Available" };

		const st = (session.status || "").toString().toLowerCase();
		switch (st) {
			case "scheduled":
				return { type: "scheduled", color: "bg-blue-400", label: "Scheduled" };
			case "ongoing":
				return { type: "ongoing", color: "bg-yellow-500", label: "Ongoing" };
			case "expired":
				return { type: "expired", color: "bg-red-500", label: "Expired" };
			default:
				return { type: "available", color: "bg-green-500", label: "Available" };
		}
	};

	const status = getStatus();
	const isExpired = status.type === "expired";
	const roomLabel = room?.name || room?.room_number || `Room ${room?.id ?? ""}`;

	const handleConfirmEnd = async () => {
		setIsEnding(true);
		const result = await endSession(room.id);
		if (result.success) {
			addToast(`Sesi ${roomLabel} Berhasil Diakhiri`, "success");
			setModal(null);
		} else {
			addToast(`Gagal mengakhiri sesi: ${result.error?.message}`, "error");
		}
		setIsEnding(false);
	};

	const handleStartSuccess = () => {
		addToast(`Sesi ${roomLabel} Berhasil Dimulai`, "success");
		setModal(null);
	};

	return (
		<>
			<motion.div
				className={`relative bg-white dark:bg-gray-800 shadow-lg rounded-2xl p-5 overflow-hidden border transition-all duration-300
          ${
						isExpired
							? "border-red-500/50"
							: "border-transparent dark:border-gray-700"
					}`}
				whileHover={{ y: -5 }}
				style={{ minHeight: 180, willChange: "transform" }}
			>
				<div className="flex items-start justify-between mb-3">
					<div className="min-w-0">
						<h3 className="text-xl font-bold text-gray-800 truncate dark:text-white">
							{roomLabel}
						</h3>
					</div>

					<div className="flex items-center space-x-3">
						<div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
							<Users size={14} className="mr-1.5" />
							<span className="whitespace-nowrap">
								{session?.pax ?? 0} / {room?.capacity ?? "-"}
							</span>
						</div>

						<div
							className={`w-3 h-3 rounded-full ${status.color} relative flex-shrink-0`}
							aria-hidden
						>
							{(status.type === "ongoing" || status.type === "expired") && (
								<div
									className={`absolute inset-0 rounded-full ${status.color} animate-ping`}
								/>
							)}
						</div>
					</div>
				</div>

				<div className="mb-4 min-h-[48px]">
					<p className="text-sm font-medium text-gray-500 dark:text-gray-400">
						{status.label}
					</p>

					{(status.type === "ongoing" || status.type === "scheduled") &&
						modal !== "view" && <CardTimer session={session} now={now} />}
				</div>

				<div className="flex space-x-2">
					{status.type === "available" ? (
						<motion.button
							onClick={() => setModal("start")}
							className="w-full bg-blue-500 text-white px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md hover:bg-blue-600 transition"
							whileTap={{ scale: 0.98 }}
						>
							Start Session
						</motion.button>
					) : (
						<div className="flex w-full space-x-2">
							<motion.button
								onClick={() => setModal("view")}
								className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm shadow-md transition
                  ${
										isExpired
											? "bg-red-500 text-white hover:bg-red-600"
											: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200"
									}`}
								whileTap={{ scale: 0.98 }}
							>
								{isExpired ? "View Alert" : "View Session"}
							</motion.button>

							{/* TOMBOL QUICK END DENGAN KONFIRMASI */}
							<motion.button
								onClick={() => setModal("confirm_end")}
								className="px-3 text-red-600 bg-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
								whileTap={{ scale: 0.95 }}
								title="Quick End Session"
							>
								<Power size={18} />
							</motion.button>
						</div>
					)}
				</div>
			</motion.div>

			<AnimatePresence>
				{/* MODAL START SESSION */}
				{modal === "start" && (
					<StartSessionModal
						room={room}
						onClose={() => setModal(null)}
						onSuccess={handleStartSuccess}
					/>
				)}

				{/* MODAL VIEW SESSION */}
				{modal === "view" && (
					<SessionControlView roomId={room.id} onClose={() => setModal(null)} />
				)}

				{/* MODAL KONFIRMASI END SESSION */}
				{modal === "confirm_end" && (
					<Modal onClose={() => setModal(null)}>
						<div className="p-4 text-center">
							<div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full dark:bg-red-900/30">
								<Power size={32} className="text-red-500" />
							</div>
							<h3 className="mb-2 text-xl font-bold text-gray-800 dark:text-white">
								Akhiri Sesi?
							</h3>
							<p className="mb-6 text-gray-500 dark:text-gray-400">
								Apakah Anda yakin ingin mematikan sesi di <b>{roomLabel}</b>{" "}
								sekarang?
							</p>

							<div className="flex justify-center gap-3">
								<button
									onClick={() => setModal(null)}
									className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200"
								>
									Batal
								</button>
								<button
									onClick={handleConfirmEnd}
									disabled={isEnding}
									className="px-5 py-2.5 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50"
								>
									{isEnding ? "Memproses..." : "Ya, Akhiri"}
								</button>
							</div>
						</div>
					</Modal>
				)}
			</AnimatePresence>
		</>
	);
});

export default RoomCard;
