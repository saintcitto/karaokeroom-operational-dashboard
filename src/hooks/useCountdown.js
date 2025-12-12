import { useEffect, useState } from "react";

/**
 * useCountdown - smooth countdown using requestAnimationFrame
 * returns remaining ms (integer)
 */
export default function useCountdown(targetTime, tickTrigger = 0) {
  const [remainingMs, setRemainingMs] = useState(() => Math.max(0, targetTime - Date.now()));

  useEffect(() => {
    let raf = null;
    const update = () => {
      const now = Date.now();
      const msLeft = Math.max(0, targetTime - now);
      setRemainingMs(msLeft);
    };

    const loop = () => {
      update();
      if (targetTime > Date.now()) {
        raf = requestAnimationFrame(loop);
      }
    };

    loop();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [targetTime, tickTrigger]);

  return remainingMs;
}
