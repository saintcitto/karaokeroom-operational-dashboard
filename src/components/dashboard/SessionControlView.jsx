import React, { useEffect, useState, useMemo, useRef } from "react";
import Modal from "../ui/Modal";
import CountdownTimer from "../dashboard/CountdownTimer";
import { motion } from "framer-motion";
import { BellRing, Plus, StopCircle } from "lucide-react";
import { useSession } from "../../context/SessionContext";
import { formatTime } from "../../utils/format";

const ALARM_URL = "https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg";

const ExpiredAlertContent = ({ roomName, onAcknowledge, onExtend, onEnd }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="p-4 bg-red-100 rounded-full mb-4">
        <BellRing size={48} className="text-red-500" />
      </div>
      <h2 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-2">Session Expired</h2>
      <p className="text-lg text-gray-700 dark:text-gray-200 mb-1">Ruangan: <span className="font-semibold">{roomName}</span></p>
      <p className="text-gray-500 dark:text-gray-400 mb-8">Durasi sesi telah habis.</p>

      <div className="w-full space-y-3">
        <motion.button onClick={onExtend} className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-600" whileTap={{ scale: 0.98 }}>
          Extend 15m
        </motion.button>
        <motion.button onClick={onEnd} className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold text-lg shadow-lg hover:bg-red-600" whileTap={{ scale: 0.98 }}>
          End Session
        </motion.button>
        <motion.button onClick={onAcknowledge} className="w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 py-2.5 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600" whileTap={{ scale: 0.98 }}>
          Acknowledge (Stop Alarm)
        </motion.button>
      </div>
    </div>
  );
};

const SessionControlView = ({ roomId, onClose, embedded = false }) => {
  const { sessions, rooms, extendSession, endSession, activeAlerts, acknowledgeAlert, now } = useSession();
  const [isEnding, setIsEnding] = useState(false);

  const session = sessions?.[roomId];
  const alert = activeAlerts?.[roomId];
  const room = rooms.find((r) => r.id === roomId);

  const startTs = useMemo(() => {
    const v = session?.start_time;
    if (!v) return null;
    const n = typeof v === "number" ? v : Date.parse(v);
    return isNaN(n) ? null : n;
  }, [session?.start_time]);

  const endTs = useMemo(() => {
    const v = session?.end_time;
    if (!v) return null;
    const n = typeof v === "number" ? v : Date.parse(v);
    return isNaN(n) ? null : n;
  }, [session?.end_time]);

  const durationMin = Number(session?.duration_min ?? session?.durationMin ?? session?.duration ?? 0);
  const totalMs = durationMin * 60 * 1000;
  const remainingMs = endTs ? Math.max(0, endTs - now) : 0;
  const percentage = totalMs > 0 ? (remainingMs / totalMs) * 100 : 0;

  const audioRef = useRef(null);
  const playedRef = useRef(false);
  const lastTriggeredRef = useRef(null);
  const audioPlayFailedRef = useRef(false);

  useEffect(() => {
    try {
      audioRef.current = new Audio(ALARM_URL);
      audioRef.current.preload = "auto";
      audioRef.current.volume = 0.7;
    } catch (err) {
      console.warn("Audio initialization failed:", err);
      audioRef.current = null;
    }

    return () => {
      try {
        audioRef.current?.pause?.();
        if (audioRef.current) audioRef.current.src = "";
      } catch (e) {}
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    playedRef.current = false;
    lastTriggeredRef.current = null;
    audioPlayFailedRef.current = false;
  }, [session?.id]);

  useEffect(() => {
    const isExpired = String(session?.status || "").toLowerCase() === "expired";
    const endedByTime = typeof remainingMs === "number" && remainingMs <= 0;

    if ((isExpired || endedByTime) && !playedRef.current) {
      const key = `${roomId}-${session?.id ?? ""}-${session?.end_time ?? ""}`;
      if (lastTriggeredRef.current === key) return;
      lastTriggeredRef.current = key;

      if (!audioRef.current) {
        playedRef.current = true;
        return;
      }

      audioRef.current.currentTime = 0;
      const playPromise = audioRef.current.play();
      if (playPromise && typeof playPromise.then === "function") {
        playPromise
          .then(() => {
            playedRef.current = true;
            audioPlayFailedRef.current = false;
          })
          .catch((err) => {
            if (!err.message.toLowerCase().includes("autoplay") &&
                !err.message.toLowerCase().includes("play") &&
                !err.message.toLowerCase().includes("interact") &&
                !err.name.toLowerCase().includes("aborterror") &&
                !err.toString().toLowerCase().includes("abort") &&
                !err.toString().toLowerCase().includes("notallowed")) {
              console.warn("Alarm play failed:", err);
            } else {
              console.debug("Alarm autoplay blocked or failed:", err);
            }
            audioPlayFailedRef.current = true;
            playedRef.current = true;
          });
      } else {
        // Fallback for browsers that don't return a promise
        try {
          audioRef.current.play();
          playedRef.current = true;
          audioPlayFailedRef.current = false;
        } catch (err) {
          if (!err.message.toLowerCase().includes("autoplay") &&
              !err.message.toLowerCase().includes("play") &&
              !err.message.toLowerCase().includes("interact") &&
              !err.name.toLowerCase().includes("aborterror") &&
              !err.toString().toLowerCase().includes("abort") &&
              !err.toString().toLowerCase().includes("notallowed")) {
            console.warn("Alarm play failed:", err);
          } else {
            console.debug("Alarm autoplay blocked or failed:", err);
          }
          audioPlayFailedRef.current = true;
          playedRef.current = true;
        }
      }
    }
  }, [remainingMs, session?.status, session?.end_time, roomId]);

  const handleEndSession = async () => {
    if (!window.confirm("Apakah Anda yakin ingin mengakhiri sesi ini?")) return;
    setIsEnding(true);
    try {
      await endSession(roomId);
      try { audioRef.current?.pause?.(); audioRef.current && (audioRef.current.currentTime = 0); } catch (e) {}
      onClose?.();
    } catch (e) {
      console.error("handleEndSession failed:", e);
      const msg = e?.message || (e?.error && e.error.message) || "Gagal mengakhiri sesi. Cek console.";
      window.alert(msg);
    } finally {
      setIsEnding(false);
    }
  };

  const handleExtendSession = async () => {
    await extendSession(roomId, 15);
    try { audioRef.current?.pause?.(); audioRef.current && (audioRef.current.currentTime = 0); } catch (e) {}
  };

  const handleAcknowledge = async () => {
    if (audioPlayFailedRef.current && audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (err) {
        console.warn("Play on acknowledge failed:", err);
      }
      try {
        setTimeout(() => {
          try { audioRef.current?.pause?.(); audioRef.current && (audioRef.current.currentTime = 0); } catch (e) {}
        }, 800);
      } catch (e) {}
    }

    try {
      acknowledgeAlert(roomId);
    } catch (e) {
      console.warn("Acknowledge failed:", e);
    }

    try { audioRef.current?.pause?.(); audioRef.current && (audioRef.current.currentTime = 0); } catch (e) {}
  };

  const showExpired = Boolean(alert) || String(session?.status || "").toLowerCase() === "expired" || (typeof remainingMs === "number" && remainingMs <= 0);

  const content = (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{room?.name ?? `Room ${roomId}`}</h2>
        <p className="text-sm text-gray-500 mt-1">
          Status:{" "}
          <span className={`font-semibold ${String(session?.status || "").toLowerCase() === "ongoing" ? "text-yellow-500" : String(session?.status || "").toLowerCase() === "scheduled" ? "text-blue-500" : String(session?.status || "").toLowerCase() === "expired" ? "text-red-500" : ""}`}>
            {session?.status ?? "Available"}
          </span>
        </p>
      </div>

      {showExpired ? (
        <ExpiredAlertContent
          roomName={room?.name}
          onAcknowledge={handleAcknowledge}
          onExtend={handleExtendSession}
          onEnd={handleEndSession}
        />
      ) : (
        <div className="flex flex-col items-center">
          <div className="relative max-w-xs mx-auto mb-8">
            <motion.div className={`absolute inset-0 blur-2xl rounded-full transition-all duration-500`} style={{ opacity: percentage < 10 ? 0.7 : 0.4 }} />
            <div className="relative">
              <CountdownTimer
                start_time={session?.start_time}
                end_time={session?.end_time}
                status={session?.status}
                size={220}
              />
            </div>
          </div>

          <div className="w-full mb-6">
            <div className="grid grid-cols-3 gap-4 text-center p-4 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-200 font-medium">Mulai</p>
                <p className="text-lg font-semibold text-gray-600 dark:text-white">{formatTime(startTs)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-200 font-medium">Selesai (Estimasi)</p>
                <p className="text-lg font-semibold text-gray-600 dark:text-white">{formatTime(endTs)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-200 font-medium">Jumlah Orang</p>
                <p className="text-lg font-semibold text-gray-600 dark:text-white">{session?.pax ?? 0}</p>
              </div>
            </div>
          </div>

          <div className="w-full flex gap-4">
            <motion.button onClick={handleExtendSession} className="flex-1 bg-blue-500 text-white py-3.5 px-6 rounded-lg font-semibold text-lg shadow-lg hover:bg-blue-600 flex items-center justify-center" whileTap={{ scale: 0.98 }}>
              <Plus size={18} className="mr-2" /> Extend 15m
            </motion.button>
            <motion.button onClick={handleEndSession} disabled={isEnding} className="flex-1 bg-red-500 text-white py-3.5 px-6 rounded-lg font-semibold text-lg shadow-lg hover:bg-red-600 disabled:opacity-50 flex items-center justify-center" whileTap={{ scale: 0.98 }}>
              <StopCircle size={18} className="mr-2" /> {isEnding ? "Mengakhiri..." : "End Session"}
            </motion.button>
          </div>
        </div>
      )}
    </div>
  );

  if (!embedded) {
    return (
      <Modal onClose={onClose} wide>
        {content}
      </Modal>
    );
  }

  return content;
};

export default SessionControlView;