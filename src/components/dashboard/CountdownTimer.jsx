import React, { useMemo, useRef, useLayoutEffect, useState } from "react";
import CircularProgress from "./../ui/CircularProgress";
import { useSession } from "../../context/SessionContext";
import { formatTimer } from "../../utils/format";

const safeDateMs = (v) => {
  if (!v) return null;
  if (typeof v === "number") return v;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.getTime();
};

const CountdownTimer = React.memo(({ start_time, end_time, status, size = 200 }) => {
  const { now } = useSession();
  const textRef = useRef(null);
  const wrapperRef = useRef(null);
  const [scale, setScale] = useState(1);

  const { remainingMs, totalMs, percent } = useMemo(() => {
    const startMs = safeDateMs(start_time);
    const endMs = safeDateMs(end_time);

    if (!startMs || !endMs) return { remainingMs: 0, totalMs: 1, percent: 0 };

    const total = Math.max(1, endMs - startMs);
    const remaining = Math.max(0, endMs - now);
    const pct = total > 0 ? (remaining / total) * 100 : 0;
    return { remainingMs: remaining, totalMs: total, percent: pct };
  }, [start_time, end_time, now]);

  const timeStr = formatTimer(remainingMs);

  const stroke = Math.max(10, Math.round(size * 0.06));
  const innerPadding = Math.round(stroke * 1.2);
  const maxTextWidth = Math.floor(size - stroke * 2 - innerPadding * 2);
  const baseFont = Math.max(12, Math.round(size * 0.14));

  useLayoutEffect(() => {
    const txt = textRef.current;
    const wrap = wrapperRef.current;
    if (!txt || !wrap) {
      setScale(1);
      return;
    }

    const measured = txt.getBoundingClientRect().width || 0;
    const allowed = maxTextWidth || (size * 0.65);
    if (measured <= 0) {
      setScale(1);
      return;
    }
    const computed = Math.min(1, allowed / measured);
    const final = Math.max(0.6, computed);
    setScale(final);
  }, [timeStr, size, maxTextWidth, baseFont]);

  const colorClass =
    remainingMs <= 5 * 60 * 1000 ? "text-red-500" : percent <= 20 ? "text-yellow-500" : "text-green-500";

  const containerStyle = {
    width: `${size}px`,
    height: `${size}px`,
    margin: "0 auto",
  };

  const timeStyle = {
    fontSize: `${baseFont}px`,
    lineHeight: 1,
    display: "inline-block",
    transform: `scale(${scale})`,
    transformOrigin: "center center",
    whiteSpace: "nowrap",
  };

  return (
    <div className="flex flex-col items-center" style={containerStyle}>
      <div className="w-full h-full relative">
        <CircularProgress percentage={percent} color={colorClass} size={size} stroke={stroke} />
        <div
          ref={wrapperRef}
          className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none px-2"
          aria-hidden
        >
          <span
            ref={textRef}
            className="font-bold font-mono text-gray-900 dark:text-white text-center"
            style={timeStyle}
          >
            {timeStr}
          </span>

          <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-widest">
            Remaining
          </span>
        </div>
      </div>
    </div>
  );
});

export default CountdownTimer;