import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	useCallback,
	useRef,
} from "react";
import { supabase } from "../lib/supabaseClient";
import { IDLE_TIMEOUT_MS } from "../data/constants";

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	const [rooms, setRooms] = useState([]);
	const [sessions, setSessions] = useState({});
	const [activeAlerts, setActiveAlerts] = useState({});
	const [sessionHistory, setSessionHistory] = useState([]);
	const [now, setNow] = useState(Date.now());

	const idleTimerRef = useRef(null);
	const alarmAudioRef = useRef(null);
	const alarmedSessionKeysRef = useRef(new Set());
	const expiredDbUpdatedRef = useRef(new Set());

	useEffect(() => {
		try {
			alarmAudioRef.current = new Audio(
				"https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg"
			);
			alarmAudioRef.current.preload = "auto";
			alarmAudioRef.current.volume = 0.7;
		} catch (e) {
			console.warn("Failed to init alarm audio:", e);
			alarmAudioRef.current = null;
		}
		return () => {
			try {
				if (alarmAudioRef.current) {
					try {
						alarmAudioRef.current.pause();
					} catch (e) {}
					alarmAudioRef.current.src = "";
				}
			} catch (e) {}
			alarmAudioRef.current = null;
			try {
				alarmedSessionKeysRef.current.clear();
				expiredDbUpdatedRef.current.clear();
			} catch (e) {}
		};
	}, []);

	const _stopAudioPlayback = useCallback(() => {
		try {
			if (!alarmAudioRef.current) return;
			try {
				alarmAudioRef.current.pause();
			} catch (e) {}
			try {
				alarmAudioRef.current.currentTime = 0;
			} catch (e) {}
		} catch (e) {
			console.warn("audio stop error:", e);
		}
	}, []);

	const playAlarmFor = useCallback(async (roomId, session) => {
		// Key unik untuk sesi ini
		const key = `${roomId}-${session?.id ?? ""}-${session?.end_time ?? ""}`;

		// Jika sudah pernah bunyi untuk sesi ini, jangan bunyi lagi
		// KECUALI jika activeAlerts kosong (kasus refresh page)
		if (alarmedSessionKeysRef.current.has(key)) return;

		alarmedSessionKeysRef.current.add(key);
		if (!alarmAudioRef.current) return;

		try {
			alarmAudioRef.current.currentTime = 0;
			const p = alarmAudioRef.current.play();
			if (p && typeof p.then === "function") {
				await p;
				return;
			}
		} catch (err) {
			const msg = err?.message?.toLowerCase?.() || "";
			if (!msg.includes("autoplay")) {
				console.warn("Alarm play failed:", err);
			}
		}

		const playWhenAllowed = () => {
			if (alarmAudioRef.current) {
				try {
					alarmAudioRef.current.currentTime = 0;
					alarmAudioRef.current.play().catch(() => {});
				} catch (e) {}
			}
			document.removeEventListener("click", playWhenAllowed);
			document.removeEventListener("touchstart", playWhenAllowed);
			document.removeEventListener("keydown", playWhenAllowed);
		};

		document.addEventListener("click", playWhenAllowed, { once: true });
		document.addEventListener("touchstart", playWhenAllowed, { once: true });
		document.addEventListener("keydown", playWhenAllowed, { once: true });
	}, []);

	const stopAlarmFor = useCallback(
		(roomId) => {
			try {
				_stopAudioPlayback();
			} catch (e) {}
			// Jangan hapus key dari alarmedSessionKeysRef agar tidak bunyi lagi otomatis
		},
		[_stopAudioPlayback]
	);

	const silenceAllAlarms = useCallback(() => {
		try {
			_stopAudioPlayback();
			alarmedSessionKeysRef.current.clear();
		} catch (e) {}
	}, [_stopAudioPlayback]);

	const login = useCallback(async (username, password) => {
		try {
			const { data, error } = await supabase
				.from("app_users")
				.select("*")
				.eq("username", username)
				.eq("password", password)
				.single();
			if (error || !data) throw new Error("User ID atau password salah");
			localStorage.setItem("karaoke_token", "logged_in");
			localStorage.setItem("karaoke_user", data.username);
			setIsAuthenticated(true);
			setUser(data.username);
			resetIdleTimer();
			return { success: true, user: data };
		} catch (err) {
			throw err;
		}
	}, []);

	const logout = useCallback(() => {
		setIsAuthenticated(false);
		setUser(null);
		if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
	}, []);

	const loadRooms = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("rooms")
				.select("*")
				.order("id");
			if (!error) setRooms(data || []);
		} catch (err) {
			console.error("loadRooms exception:", err);
		}
	}, []);

	const loadSessions = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("sessions")
				.select("*")
				.order("id", { ascending: true });

			if (!error) {
				const mapped = {};
				(data || []).forEach((s) => {
					mapped[String(s.room_id)] = s;
				});
				setSessions(mapped);
			}
		} catch (err) {
			console.error("loadSessions exception:", err);
		}
	}, []);

	const loadSessionHistory = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from("session_history")
				.select("*")
				.order("created_at", { ascending: false })
				.limit(500);

			if (!error) setSessionHistory(data || []);
		} catch (err) {
			console.error("loadSessionHistory exception:", err);
		}
	}, []);

	const safeInsertSessionHistory = useCallback(async (row) => {
		Object.keys(row).forEach((k) => row[k] === undefined && delete row[k]);
		try {
			const { data, error } = await supabase
				.from("session_history")
				.insert([row])
				.select()
				.single();
			return { data, error };
		} catch (e) {
			return { data: null, error: e };
		}
	}, []);

	const startSession = useCallback(
		async (roomId, { startTime, durationMin, pax }) => {
			try {
				const endTime = startTime + durationMin * 60000;
				const current = Date.now();
				const status = startTime <= current ? "ongoing" : "scheduled";

				try {
					await supabase.from("sessions").delete().eq("room_id", roomId);
				} catch (e) {}

				const payload = {
					room_id: roomId,
					start_time: new Date(startTime).toISOString(),
					end_time: new Date(endTime).toISOString(),
					duration_min: durationMin,
					pax,
					status,
					updated_at: new Date().toISOString(),
					created_at: new Date().toISOString(),
				};

				const { data, error } = await supabase
					.from("sessions")
					.insert([payload])
					.select()
					.single();

				if (error) throw new Error(error.message || "Gagal membuat sesi");

				await supabase
					.from("rooms")
					.update({ status: "occupied", updated_at: new Date().toISOString() })
					.eq("id", roomId);

				await Promise.allSettled([loadSessions(), loadRooms()]);
				return data;
			} catch (err) {
				console.error("startSession exception:", err);
				throw err;
			}
		},
		[loadSessions, loadRooms]
	);

	const extendSession = useCallback(
		async (roomId, minutes) => {
			try {
				const session = sessions[String(roomId)];
				if (!session) throw new Error("Tidak ada sesi aktif");

				const newEndMs = new Date(session.end_time).getTime() + minutes * 60000;
				const newEndIso = new Date(newEndMs).toISOString();
				const newDuration = (session.duration_min || 0) + minutes;

				await supabase
					.from("sessions")
					.update({
						end_time: newEndIso,
						duration_min: newDuration,
						status: "ongoing",
						updated_at: new Date().toISOString(),
					})
					.eq("id", session.id);

				// Reset alarm key agar bisa bunyi lagi nanti
				const sessionKey = `${roomId}-${session.id}-${session.end_time}`;
				if (alarmedSessionKeysRef.current.has(sessionKey)) {
					alarmedSessionKeysRef.current.delete(sessionKey);
				}

				try {
					stopAlarmFor(roomId);
				} catch (e) {}

				setActiveAlerts((prev) => {
					const copy = { ...prev };
					delete copy[roomId];
					return copy;
				});

				await loadSessions();
				return { success: true };
			} catch (err) {
				console.error("extendSession exception:", err);
				throw err;
			}
		},
		[sessions, stopAlarmFor, loadSessions]
	);

	const endSession = useCallback(
		async (roomId) => {
			try {
				const session = sessions[String(roomId)];
				if (!session) throw new Error("Tidak ada sesi aktif");

				const actor = localStorage.getItem("karaoke_user") || "system";

				// SATU-SATUNYA INSERT HISTORY (Completed)
				const { data: existing } = await supabase
					.from("session_history")
					.select("id")
					.eq("session_id", session.id)
					.eq("event_type", "completed")
					.limit(1);

				if (!existing || existing.length === 0) {
					const finalHistoryData = {
						session_id: session.id,
						room_id: session.room_id,
						event_type: "completed",
						payload: {
							start_time: session.start_time,
							end_time: session.end_time,
							duration_min: session.duration_min,
							pax: session.pax,
						},
						created_by: actor,
						created_at: new Date().toISOString(),
					};
					await safeInsertSessionHistory(finalHistoryData);
				}

				await supabase.from("sessions").delete().eq("id", session.id);

				await supabase
					.from("rooms")
					.update({ status: "available", updated_at: new Date().toISOString() })
					.eq("id", roomId);

				await Promise.allSettled([
					loadSessions(),
					loadSessionHistory(),
					loadRooms(),
				]);

				setActiveAlerts((prev) => {
					const copy = { ...prev };
					delete copy[roomId];
					return copy;
				});
				stopAlarmFor(roomId);

				return { success: true };
			} catch (err) {
				console.error("endSession exception:", err);
				return { success: false, error: err };
			}
		},
		[
			sessions,
			safeInsertSessionHistory,
			loadSessions,
			loadSessionHistory,
			loadRooms,
			stopAlarmFor,
		]
	);

	// --- INTERVAL LOGIC (YANG DIPERBAIKI) ---
	useEffect(() => {
		const interval = setInterval(() => {
			const current = Date.now();
			setNow(current);

			setSessions((prevSessions) => {
				if (!prevSessions) return prevSessions;
				const updated = { ...prevSessions };
				let dirty = false;

				Object.entries(prevSessions).forEach(([roomId, s]) => {
					if (!s) return;
					const start = s.start_time ? new Date(s.start_time).getTime() : null;
					const end = s.end_time ? new Date(s.end_time).getTime() : null;
					let newStatus = s.status;

					// Logic 1: Scheduled -> Ongoing
					if (s.status === "scheduled" && start && current >= start) {
						newStatus = "ongoing";
					}

					// Logic 2: Time Is Up (Cek Waktu, BUKAN status)
					// Ini agar jika di-refresh saat expired, logic tetap jalan
					const isTimeUp = end && current >= end;

					if (isTimeUp) {
						// A. Update Status DB (Jika belum expired)
						if (s.status !== "expired") {
							newStatus = "expired";
							const sid = s.id;
							if (sid && !expiredDbUpdatedRef.current.has(sid)) {
								expiredDbUpdatedRef.current.add(sid);
								supabase
									.from("sessions")
									.update({
										status: "expired",
										updated_at: new Date().toISOString(),
									})
									.eq("id", sid)
									.then(({ error }) => {
										if (error) expiredDbUpdatedRef.current.delete(sid);
										else loadSessions();
									});
							}
						}

						// B. Trigger Alarm Popup (Perbaikan: Cek activeAlerts)
						// Jika popup belum muncul di state lokal, munculkan sekarang!
						if (!activeAlerts[roomId]) {
							setActiveAlerts((prev) => ({
								...prev,
								[roomId]: { ...s, triggeredAt: current },
							}));
							// playAlarmFor sudah handle deduplikasi suara
							playAlarmFor(roomId, s);
						}
					}

					if (newStatus !== s.status) {
						updated[roomId] = { ...s, status: newStatus };
						dirty = true;
					}
				});

				return dirty ? updated : prevSessions;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [activeAlerts, loadSessions, playAlarmFor]); // Added activeAlerts dependency

	// --- REST OF HOOKS ---
	useEffect(() => {
		if (!isAuthenticated) return;
		const channel = supabase
			.channel("session_changes")
			.on(
				"postgres_changes",
				{ event: "*", schema: "public", table: "sessions" },
				() => {
					loadSessions();
				}
			)
			.on(
				"postgres_changes",
				{ event: "INSERT", schema: "public", table: "session_history" },
				() => {
					loadSessionHistory();
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [isAuthenticated, loadSessions, loadSessionHistory]);

	const resetIdleTimer = useCallback(() => {
		if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
		idleTimerRef.current = setTimeout(() => {
			if (isAuthenticated) logout();
		}, IDLE_TIMEOUT_MS);
	}, [isAuthenticated, logout]);

	useEffect(() => {
		if (isAuthenticated) {
			resetIdleTimer();
			window.addEventListener("mousemove", resetIdleTimer);
			window.addEventListener("keydown", resetIdleTimer);
			return () => {
				window.removeEventListener("mousemove", resetIdleTimer);
				window.removeEventListener("keydown", resetIdleTimer);
			};
		}
	}, [isAuthenticated, resetIdleTimer]);

	useEffect(() => {
		if (isAuthenticated) {
			loadRooms();
			loadSessions();
			loadSessionHistory();
		}
	}, [isAuthenticated, loadRooms, loadSessions, loadSessionHistory]);

	const value = {
		isAuthenticated,
		user,
		rooms,
		sessions,
		activeAlerts,
		sessionHistory,
		now,
		login,
		logout,
		startSession,
		extendSession,
		endSession,
		loadSessions,
		loadRooms,
		loadSessionHistory,
		_internal: {
			playAlarmFor,
			stopAlarmFor,
			silenceAllAlarms,
			alarmAudioRef,
			alarmedSessionKeysRef,
		},
	};

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	);
};

export const useSession = () => useContext(SessionContext);
