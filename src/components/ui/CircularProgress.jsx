import React, { useMemo } from "react";

/**
 * props:
 * - percentage: 0..100 (number)
 * - color: tailwind color class string e.g. "text-green-500"
 * - size: px (number)
 * - stroke: stroke width (number)
 */
const CircularProgress = ({ percentage = 100, color = "text-green-500", size = 200, stroke = 14 }) => {
  const s = Math.max(8, stroke);
  const r = Math.max(10, (size - s) / 2);
  const circumference = 2 * Math.PI * r;

  const pct = Math.max(0, Math.min(100, Number(percentage) || 0));
  const dashOffset = circumference - (pct / 100) * circumference;

  const bgClass = "stroke-gray-200 dark:stroke-gray-700";

  const ringClass = `${color} stroke-current`;

  const progressStyle = {
    strokeDasharray: circumference,
    strokeDashoffset: dashOffset,
    transition: "stroke-dashoffset 0.45s linear, stroke 0.25s ease",
  };

  return (
    <div style={{ width: size, height: size }} className="relative">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={s}
          className={bgClass}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={s}
          fill="none"
          strokeLinecap="round"
          className={ringClass}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={progressStyle}
        />
      </svg>
    </div>
  );
};

export default CircularProgress;