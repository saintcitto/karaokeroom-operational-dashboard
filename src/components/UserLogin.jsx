import { motion, useAnimation } from "framer-motion";
import React, { useEffect } from "react";

export function LivingFooter() {
  const controls = useAnimation();

  useEffect(() => {
    const loop = async () => {
      while (true) {
        await controls.start({
          textShadow: [
            "0 0 0px rgba(244,114,182,0)",
            "0 0 12px rgba(244,114,182,0.5)",
            "0 0 24px rgba(244,114,182,0.7)",
            "0 0 0px rgba(244,114,182,0)",
          ],
          opacity: [0.7, 1, 0.9, 1],
          scale: [1, 1.04, 1],
          transition: { duration: 6, ease: "easeInOut" },
        });
      }
    };
    loop();
  }, [controls]);

  return (
    <footer className="absolute bottom-8 w-full flex items-center justify-center">
      <motion.div
        animate={controls}
        className="font-light tracking-[0.2em] text-gray-400 select-none relative"
      >
        {"sweet cherry pie".split("").map((char, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className={char === " " ? "inline-block w-1" : "inline-block"}
          >
            {char}
          </motion.span>
        ))}

        <motion.span
          animate={{
            rotate: [0, 12, -12, 8, -8, 0],
            y: [0, -2, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="inline-block ml-2 text-pink-400 drop-shadow-[0_0_8px_rgba(244,114,182,0.6)]"
        >
          🍰
        </motion.span>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{
            opacity: [0.1, 0.25, 0.1],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-36 h-[1px] bg-gradient-to-r from-transparent via-pink-400/50 to-transparent blur-[2px]"
        />
      </motion.div>
    </footer>
  );
}
export default UserLogin;
