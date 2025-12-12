import { useEffect, useRef, useCallback } from "react";

export default function useAudio(src, loop = false) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (!src) return;
    try {
      const audio = new Audio(src);
      audio.loop = loop;
      audioRef.current = audio;
    } catch (error) {
      console.error("Gagal memuat audio:", error);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [src, loop]);

  const play = useCallback(() => {
    audioRef.current?.play().catch((e) => console.warn("Interaksi pengguna diperlukan untuk memutar audio.", e));
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  return { play, pause, stop };
}
